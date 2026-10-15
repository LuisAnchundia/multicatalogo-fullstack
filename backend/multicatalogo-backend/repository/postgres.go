package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
	"multicatalogo-backend/models"
)

var (
	ErrNotFound = errors.New("recurso no encontrado")
	ErrInvalid  = errors.New("datos inválidos")
	ErrStock    = errors.New("stock insuficiente")
)

type CheckoutResult struct {
	Pedido    models.PedidoConfirmado
	PedidoID  int64
	UsuarioID int64
	Afectados []string
}

// DBRepository permite inyectar la persistencia en los controladores.
type DBRepository interface {
	Authenticate(context.Context, string, string) (models.Usuario, error)
	Productos(context.Context) ([]models.Producto, error)
	Producto(context.Context, int) (models.Producto, error)
	Red(context.Context, string) (*models.Referido, error)
	Checkout(context.Context, int64, string, models.CheckoutRequest) (CheckoutResult, error)
	ProcessCommissionJob(context.Context, int64) ([]string, error)
	PendingCommissionJobs(context.Context) ([]int64, error)
}

type Postgres struct{ DB *sql.DB }

func (p *Postgres) Authenticate(ctx context.Context, email, password string) (models.Usuario, error) {
	var u models.Usuario
	var hash string
	var parent sql.NullInt64
	err := p.DB.QueryRowContext(ctx, `SELECT id,email,nombre,rol,parent_id,password_hash FROM usuarios WHERE lower(email)=lower($1)`, email).
		Scan(&u.ID, &u.Email, &u.Nombre, &u.Rol, &parent, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return u, ErrNotFound
	}
	if err != nil {
		return u, err
	}
	if parent.Valid {
		u.ParentID = &parent.Int64
	}
	if !checkPassword(hash, password) {
		return models.Usuario{}, ErrNotFound
	}
	return u, nil
}

func scanProducto(scanner interface{ Scan(...any) error }) (models.Producto, error) {
	var p models.Producto
	var cents int64
	var gallery []byte
	err := scanner.Scan(&p.ID, &p.Nombre, &p.Descripcion, &cents, &p.Categoria, &p.Img, &gallery, &p.Stock)
	if err != nil {
		return p, err
	}
	p.Precio = float64(cents) / 100
	if err = json.Unmarshal(gallery, &p.Galeria); err != nil {
		return p, err
	}
	return p, nil
}

const productoFields = `id,nombre,descripcion,precio_cents,categoria,img,galeria,stock`

func (p *Postgres) Productos(ctx context.Context) ([]models.Producto, error) {
	rows, err := p.DB.QueryContext(ctx, `SELECT `+productoFields+` FROM productos ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]models.Producto, 0)
	for rows.Next() {
		producto, err := scanProducto(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, producto)
	}
	return result, rows.Err()
}

func (p *Postgres) Producto(ctx context.Context, id int) (models.Producto, error) {
	producto, err := scanProducto(p.DB.QueryRowContext(ctx, `SELECT `+productoFields+` FROM productos WHERE id=$1`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return producto, ErrNotFound
	}
	return producto, err
}

func (p *Postgres) Red(ctx context.Context, email string) (*models.Referido, error) {
	rows, err := p.DB.QueryContext(ctx, `WITH RECURSIVE red AS (
		SELECT id,parent_id,nombre,ventas_cents,saldo_cents,0 AS nivel FROM usuarios WHERE lower(email)=lower($1)
		UNION ALL
		SELECT u.id,u.parent_id,u.nombre,u.ventas_cents,u.saldo_cents,r.nivel+1
		FROM usuarios u JOIN red r ON u.parent_id=r.id WHERE r.nivel<3
	) SELECT id,parent_id,nombre,ventas_cents,saldo_cents,nivel FROM red ORDER BY nivel,id`, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	nodes := map[int64]*models.Referido{}
	var root *models.Referido
	for rows.Next() {
		var n models.Referido
		var parent sql.NullInt64
		var ventas, saldo int64
		if err := rows.Scan(&n.ID, &parent, &n.Nombre, &ventas, &saldo, &n.Nivel); err != nil {
			return nil, err
		}
		n.Ventas = float64(ventas) / 100
		n.Saldo = float64(saldo) / 100
		nodes[n.ID] = &n
		if n.Nivel == 0 {
			root = &n
		} else if parent.Valid && nodes[parent.Int64] != nil {
			nodes[parent.Int64].Hijos = append(nodes[parent.Int64].Hijos, &n)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if root == nil {
		return nil, ErrNotFound
	}
	return root, nil
}

func (p *Postgres) Checkout(ctx context.Context, userID int64, email string, req models.CheckoutRequest) (CheckoutResult, error) {
	var result CheckoutResult
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return result, err
	}
	defer tx.Rollback()

	var orderID int64
	var fecha time.Time
	err = tx.QueryRowContext(ctx, `INSERT INTO pedidos(usuario_id,numero,nombre_cliente,email_cliente,direccion,ciudad,telefono,metodo_pago)
		VALUES($1,'MC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),$2,$3,$4,$5,$6,$7)
		RETURNING id,numero,fecha`, userID, req.Cliente.Nombre, req.Cliente.Email, req.Cliente.Direccion, req.Cliente.Ciudad, req.Cliente.Telefono, req.MetodoPago).
		Scan(&orderID, &result.Pedido.Numero, &fecha)
	if err != nil {
		return result, err
	}
	result.Pedido.Fecha = fecha.Format(time.RFC3339)
	result.Pedido.Items = make([]models.PedidoItem, 0, len(req.Items))
	var total int64
	for _, item := range req.Items {
		var nombre string
		var price int64
		var stock int
		err = tx.QueryRowContext(ctx, `SELECT nombre,precio_cents,stock FROM productos WHERE id=$1 FOR UPDATE`, item.ID).Scan(&nombre, &price, &stock)
		if errors.Is(err, sql.ErrNoRows) {
			return result, fmt.Errorf("producto %d: %w", item.ID, ErrInvalid)
		}
		if err != nil {
			return result, err
		}
		if stock < item.Cantidad {
			return result, fmt.Errorf("producto %d: %w", item.ID, ErrStock)
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO pedido_items(pedido_id,producto_id,nombre,cantidad,precio_cents) VALUES($1,$2,$3,$4,$5)`, orderID, item.ID, nombre, item.Cantidad, price)
		if err != nil {
			return result, err
		}
		_, err = tx.ExecContext(ctx, `UPDATE productos SET stock=stock-$1 WHERE id=$2`, item.Cantidad, item.ID)
		if err != nil {
			return result, err
		}
		total += price * int64(item.Cantidad)
		result.Pedido.Items = append(result.Pedido.Items, models.PedidoItem{Nombre: nombre, Cantidad: item.Cantidad, Precio: float64(price) / 100})
	}
	_, err = tx.ExecContext(ctx, `UPDATE pedidos SET total_cents=$1 WHERE id=$2`, total, orderID)
	if err != nil {
		return result, err
	}
	_, err = tx.ExecContext(ctx, `UPDATE usuarios SET ventas_cents=ventas_cents+$1 WHERE id=$2`, total, userID)
	if err != nil {
		return result, err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO commission_jobs(pedido_id,usuario_id,total_cents) VALUES($1,$2,$3)`, orderID, userID, total)
	if err != nil {
		return result, err
	}
	rows, err := tx.QueryContext(ctx, `WITH RECURSIVE ascendientes AS (
		SELECT id,parent_id,email FROM usuarios WHERE id=$1
		UNION ALL SELECT u.id,u.parent_id,u.email FROM usuarios u JOIN ascendientes a ON u.id=a.parent_id
	) SELECT email FROM ascendientes`, userID)
	if err != nil {
		return result, err
	}
	for rows.Next() {
		var e string
		if err = rows.Scan(&e); err != nil {
			rows.Close()
			return result, err
		}
		result.Afectados = append(result.Afectados, e)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return result, err
	}
	if err = tx.Commit(); err != nil {
		return result, err
	}
	result.PedidoID = orderID
	result.UsuarioID = userID
	result.Pedido.UsuarioEmail = email
	result.Pedido.Total = float64(total) / 100
	result.Pedido.Cliente = req.Cliente
	result.Pedido.MetodoPago = req.MetodoPago
	return result, nil
}

func (p *Postgres) ProcessCommissionJob(ctx context.Context, orderID int64) ([]string, error) {
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	var buyer, total int64
	var status string
	err = tx.QueryRowContext(ctx, `SELECT usuario_id,total_cents,status FROM commission_jobs WHERE pedido_id=$1 FOR UPDATE`, orderID).Scan(&buyer, &total, &status)
	if err != nil {
		return nil, err
	}
	if status == "done" {
		return nil, nil
	}
	emails := make([]string, 0, 3)
	var parent sql.NullInt64
	err = tx.QueryRowContext(ctx, `SELECT parent_id FROM usuarios WHERE id=$1`, buyer).Scan(&parent)
	if err != nil {
		return nil, err
	}
	for level := 1; level <= 3 && parent.Valid; level++ {
		var next sql.NullInt64
		var email string
		err = tx.QueryRowContext(ctx, `SELECT email,parent_id FROM usuarios WHERE id=$1`, parent.Int64).Scan(&email, &next)
		if err != nil {
			return nil, err
		}
		emails = append(emails, email)
		rate := []int64{10, 5, 2}[level-1]
		amount := (total*rate + 50) / 100
		_, err = tx.ExecContext(ctx, `INSERT INTO comisiones(pedido_id,beneficiario_id,nivel,monto_cents) VALUES($1,$2,$3,$4)`, orderID, parent.Int64, level, amount)
		if err != nil {
			return nil, err
		}
		_, err = tx.ExecContext(ctx, `UPDATE usuarios SET saldo_cents=saldo_cents+$1 WHERE id=$2`, amount, parent.Int64)
		if err != nil {
			return nil, err
		}
		parent = next
	}
	_, err = tx.ExecContext(ctx, `UPDATE commission_jobs SET status='done' WHERE pedido_id=$1`, orderID)
	if err != nil {
		return nil, err
	}
	return emails, tx.Commit()
}

func (p *Postgres) PendingCommissionJobs(ctx context.Context) ([]int64, error) {
	rows, err := p.DB.QueryContext(ctx, `SELECT pedido_id FROM commission_jobs WHERE status='pending' ORDER BY pedido_id LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// El adaptador bcrypt queda separado para poder probar la lógica sin una base real.
var checkPassword = func(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
