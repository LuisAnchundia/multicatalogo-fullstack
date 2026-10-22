package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Order struct {
	ID        int64       `json:"id"`
	Numero    string      `json:"numero"`
	UsuarioID int64       `json:"usuarioId"`
	Email     string      `json:"email"`
	Total     float64     `json:"total"`
	Estado    string      `json:"estado"`
	Fecha     time.Time   `json:"fecha"`
	Items     []OrderItem `json:"items,omitempty"`
}
type OrderItem struct {
	Nombre   string  `json:"nombre"`
	Cantidad int     `json:"cantidad"`
	Precio   float64 `json:"precio"`
}
type Commission struct {
	PedidoID int64     `json:"pedidoId"`
	Numero   string    `json:"numero"`
	Nivel    int       `json:"nivel"`
	Monto    float64   `json:"monto"`
	Estado   string    `json:"estado"`
	Fecha    time.Time `json:"fecha"`
}
type Liquidation struct {
	ID             int64     `json:"id"`
	BeneficiarioID int64     `json:"beneficiarioId"`
	Total          float64   `json:"total"`
	Fecha          time.Time `json:"fecha"`
}
type ReportSummary struct {
	Ventas         float64 `json:"ventas"`
	Pedidos        int     `json:"pedidos"`
	TicketPromedio float64 `json:"ticketPromedio"`
	Comisiones     float64 `json:"comisiones"`
}
type TopRecord struct {
	Nombre string  `json:"nombre"`
	Total  float64 `json:"total"`
}
type DebtRecord struct {
	BeneficiarioID int64   `json:"beneficiarioId"`
	Nombre         string  `json:"nombre"`
	Total          float64 `json:"total"`
}

func (p *Postgres) Orders(ctx context.Context, owner int64, admin bool, state string, page, limit int) (Page[Order], error) {
	page, limit = pagination(page, limit)
	out := Page[Order]{Data: []Order{}, Page: page, Limit: limit}
	if err := p.DB.QueryRowContext(ctx, `SELECT count(*) FROM pedidos WHERE ($1 OR usuario_id=$2) AND ($3='' OR estado=$3)`, admin, owner, state).Scan(&out.Total); err != nil {
		return out, err
	}
	rows, err := p.DB.QueryContext(ctx, `SELECT id,numero,usuario_id,email_cliente,total_cents,estado,fecha FROM pedidos WHERE ($1 OR usuario_id=$2) AND ($3='' OR estado=$3) ORDER BY fecha DESC,id DESC LIMIT $4 OFFSET $5`, admin, owner, state, limit, (page-1)*limit)
	if err != nil {
		return out, err
	}
	defer rows.Close()
	for rows.Next() {
		var o Order
		var cents int64
		if err = rows.Scan(&o.ID, &o.Numero, &o.UsuarioID, &o.Email, &cents, &o.Estado, &o.Fecha); err != nil {
			return out, err
		}
		o.Total = float64(cents) / 100
		out.Data = append(out.Data, o)
	}
	return out, rows.Err()
}
func (p *Postgres) OrderDetail(ctx context.Context, id, owner int64, admin bool) (Order, error) {
	var o Order
	var cents int64
	err := p.DB.QueryRowContext(ctx, `SELECT id,numero,usuario_id,email_cliente,total_cents,estado,fecha FROM pedidos WHERE id=$1`, id).Scan(&o.ID, &o.Numero, &o.UsuarioID, &o.Email, &cents, &o.Estado, &o.Fecha)
	if errors.Is(err, sql.ErrNoRows) {
		return o, ErrNotFound
	}
	if err != nil {
		return o, err
	}
	if !admin && o.UsuarioID != owner {
		return o, ErrForbidden
	}
	o.Total = float64(cents) / 100
	o.Items = []OrderItem{}
	rows, err := p.DB.QueryContext(ctx, `SELECT nombre,cantidad,precio_cents FROM pedido_items WHERE pedido_id=$1 ORDER BY producto_id`, id)
	if err != nil {
		return o, err
	}
	defer rows.Close()
	for rows.Next() {
		var item OrderItem
		var price int64
		if err = rows.Scan(&item.Nombre, &item.Cantidad, &price); err != nil {
			return o, err
		}
		item.Precio = float64(price) / 100
		o.Items = append(o.Items, item)
	}
	return o, rows.Err()
}
func (p *Postgres) SetOrderState(ctx context.Context, id int64, next string) error {
	if next != "preparando" && next != "enviado" && next != "entregado" && next != "cancelado" {
		return ErrInvalid
	}
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	// Mismo orden de bloqueo que el trabajador de comisiones.
	var job string
	err = tx.QueryRowContext(ctx, `SELECT status FROM commission_jobs WHERE pedido_id=$1 FOR UPDATE`, id).Scan(&job)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	var current string
	var buyer, total int64
	if err = tx.QueryRowContext(ctx, `SELECT estado,usuario_id,total_cents FROM pedidos WHERE id=$1 FOR UPDATE`, id).Scan(&current, &buyer, &total); err != nil {
		return err
	}
	allowed := map[string]string{"pendiente": "preparando", "preparando": "enviado", "enviado": "entregado"}
	if next != allowed[current] && !(next == "cancelado" && current == "pendiente") {
		return ErrInvalid
	}
	if next == "cancelado" {
		var paid int
		if err = tx.QueryRowContext(ctx, `SELECT count(*) FROM comisiones WHERE pedido_id=$1 AND estado='pagada'`, id).Scan(&paid); err != nil {
			return err
		}
		if paid > 0 {
			return ErrConflict
		}
		rows, e := tx.QueryContext(ctx, `SELECT producto_id,cantidad FROM pedido_items WHERE pedido_id=$1`, id)
		if e != nil {
			return e
		}
		type item struct {
			id  int64
			qty int
		}
		items := []item{}
		for rows.Next() {
			var x item
			if e = rows.Scan(&x.id, &x.qty); e != nil {
				rows.Close()
				return e
			}
			items = append(items, x)
		}
		e = rows.Err()
		rows.Close()
		if e != nil {
			return e
		}
		for _, x := range items {
			if _, err = tx.ExecContext(ctx, `UPDATE productos SET stock=stock+$1 WHERE id=$2`, x.qty, x.id); err != nil {
				return err
			}
		}
		rows, e = tx.QueryContext(ctx, `SELECT beneficiario_id,monto_cents,acreditada FROM comisiones WHERE pedido_id=$1 AND estado='pendiente'`, id)
		if e != nil {
			return e
		}
		type com struct {
			id, amount int64
			credited   bool
		}
		coms := []com{}
		for rows.Next() {
			var x com
			if e = rows.Scan(&x.id, &x.amount, &x.credited); e != nil {
				rows.Close()
				return e
			}
			coms = append(coms, x)
		}
		e = rows.Err()
		rows.Close()
		if e != nil {
			return e
		}
		for _, x := range coms {
			if x.credited {
				if _, err = tx.ExecContext(ctx, `UPDATE usuarios SET saldo_cents=saldo_cents-$1 WHERE id=$2`, x.amount, x.id); err != nil {
					return err
				}
			}
		}
		if _, err = tx.ExecContext(ctx, `UPDATE comisiones SET estado='revertida' WHERE pedido_id=$1 AND estado='pendiente'`, id); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, `UPDATE commission_jobs SET status='done' WHERE pedido_id=$1`, id); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, `UPDATE usuarios SET ventas_cents=ventas_cents-$1 WHERE id=$2`, total, buyer); err != nil {
			return err
		}
	}
	if _, err = tx.ExecContext(ctx, `UPDATE pedidos SET estado=$1 WHERE id=$2`, next, id); err != nil {
		return err
	}
	return tx.Commit()
}
func (p *Postgres) Commissions(ctx context.Context, user int64) ([]Commission, error) {
	rows, err := p.DB.QueryContext(ctx, `SELECT c.pedido_id,p.numero,c.nivel,c.monto_cents,c.estado,p.fecha FROM comisiones c JOIN pedidos p ON p.id=c.pedido_id WHERE c.beneficiario_id=$1 ORDER BY p.fecha DESC,c.nivel`, user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Commission{}
	for rows.Next() {
		var c Commission
		var cents int64
		if err = rows.Scan(&c.PedidoID, &c.Numero, &c.Nivel, &cents, &c.Estado, &c.Fecha); err != nil {
			return nil, err
		}
		c.Monto = float64(cents) / 100
		out = append(out, c)
	}
	return out, rows.Err()
}
func (p *Postgres) Liquidate(ctx context.Context, user int64) (Liquidation, error) {
	var out Liquidation
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return out, err
	}
	defer tx.Rollback()
	rows, err := tx.QueryContext(ctx, `SELECT monto_cents FROM comisiones WHERE beneficiario_id=$1 AND estado='pendiente' AND acreditada=TRUE FOR UPDATE`, user)
	if err != nil {
		return out, err
	}
	var sum int64
	for rows.Next() {
		var c int64
		if err = rows.Scan(&c); err != nil {
			rows.Close()
			return out, err
		}
		sum += c
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return out, err
	}
	if sum == 0 {
		return out, ErrInvalid
	}
	err = tx.QueryRowContext(ctx, `INSERT INTO liquidaciones(beneficiario_id,total_cents) VALUES($1,$2) RETURNING id,creado_en`, user, sum).Scan(&out.ID, &out.Fecha)
	if err != nil {
		return out, err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE comisiones SET estado='pagada',liquidacion_id=$1 WHERE beneficiario_id=$2 AND estado='pendiente' AND acreditada=TRUE`, out.ID, user); err != nil {
		return out, err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE usuarios SET saldo_cents=saldo_cents-$1 WHERE id=$2`, sum, user); err != nil {
		return out, err
	}
	out.BeneficiarioID = user
	out.Total = float64(sum) / 100
	return out, tx.Commit()
}
func (p *Postgres) Liquidations(ctx context.Context, user int64, admin bool) ([]Liquidation, error) {
	rows, err := p.DB.QueryContext(ctx, `SELECT id,beneficiario_id,total_cents,creado_en FROM liquidaciones WHERE $1 OR beneficiario_id=$2 ORDER BY creado_en DESC`, admin, user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Liquidation{}
	for rows.Next() {
		var l Liquidation
		var cents int64
		if err = rows.Scan(&l.ID, &l.BeneficiarioID, &cents, &l.Fecha); err != nil {
			return nil, err
		}
		l.Total = float64(cents) / 100
		out = append(out, l)
	}
	return out, rows.Err()
}
func (p *Postgres) Report(ctx context.Context, from, to time.Time) (ReportSummary, error) {
	var out ReportSummary
	var sales, comm int64
	err := p.DB.QueryRowContext(ctx, `SELECT COALESCE(SUM(total_cents),0),count(*) FROM pedidos WHERE estado<>'cancelado' AND fecha >= $1 AND fecha < $2`, from, to).Scan(&sales, &out.Pedidos)
	if err != nil {
		return out, err
	}
	err = p.DB.QueryRowContext(ctx, `SELECT COALESCE(SUM(c.monto_cents),0) FROM comisiones c JOIN pedidos p ON p.id=c.pedido_id WHERE c.estado<>'revertida' AND p.fecha >= $1 AND p.fecha < $2`, from, to).Scan(&comm)
	if err != nil {
		return out, err
	}
	out.Ventas = float64(sales) / 100
	out.Comisiones = float64(comm) / 100
	if out.Pedidos > 0 {
		out.TicketPromedio = out.Ventas / float64(out.Pedidos)
	}
	return out, nil
}
func (p *Postgres) TopProducts(ctx context.Context) ([]TopRecord, error) {
	return p.top(ctx, `SELECT i.nombre,COALESCE(SUM(i.cantidad*i.precio_cents),0) FROM pedido_items i JOIN pedidos p ON p.id=i.pedido_id WHERE p.estado<>'cancelado' GROUP BY i.nombre ORDER BY 2 DESC LIMIT 10`)
}
func (p *Postgres) TopReferrals(ctx context.Context) ([]TopRecord, error) {
	return p.top(ctx, `WITH RECURSIVE red AS (
		SELECT id AS raiz,id,0 AS nivel FROM usuarios
		UNION ALL
		SELECT r.raiz,u.id,r.nivel+1 FROM red r JOIN usuarios u ON u.parent_id=r.id WHERE r.nivel<3
	) SELECT raiz_user.nombre,COALESCE(SUM(p.total_cents),0) AS total
	FROM red r JOIN usuarios raiz_user ON raiz_user.id=r.raiz
	LEFT JOIN pedidos p ON p.usuario_id=r.id AND p.estado<>'cancelado'
	GROUP BY raiz_user.id,raiz_user.nombre HAVING COALESCE(SUM(p.total_cents),0)>0 ORDER BY total DESC LIMIT 10`)
}
func (p *Postgres) PendingByUser(ctx context.Context) ([]TopRecord, error) {
	return p.top(ctx, `SELECT u.nombre,COALESCE(SUM(c.monto_cents),0) FROM comisiones c JOIN usuarios u ON u.id=c.beneficiario_id WHERE c.estado='pendiente' AND c.acreditada=TRUE GROUP BY u.id,u.nombre ORDER BY 2 DESC LIMIT 50`)
}
func (p *Postgres) Debts(ctx context.Context) ([]DebtRecord, error) {
	rows, err := p.DB.QueryContext(ctx, `SELECT u.id,u.nombre,COALESCE(SUM(c.monto_cents),0) FROM comisiones c JOIN usuarios u ON u.id=c.beneficiario_id WHERE c.estado='pendiente' AND c.acreditada=TRUE GROUP BY u.id,u.nombre ORDER BY 3 DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []DebtRecord{}
	for rows.Next() {
		var x DebtRecord
		var cents int64
		if err = rows.Scan(&x.BeneficiarioID, &x.Nombre, &cents); err != nil {
			return nil, err
		}
		x.Total = float64(cents) / 100
		out = append(out, x)
	}
	return out, rows.Err()
}
func (p *Postgres) top(ctx context.Context, q string) ([]TopRecord, error) {
	rows, err := p.DB.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TopRecord{}
	for rows.Next() {
		var x TopRecord
		var cents int64
		if err = rows.Scan(&x.Nombre, &cents); err != nil {
			return nil, err
		}
		x.Total = float64(cents) / 100
		out = append(out, x)
	}
	return out, rows.Err()
}
