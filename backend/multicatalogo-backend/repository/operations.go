package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"multicatalogo-backend/models"
)

type Page[T any] struct {
	Data  []T `json:"data"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}
type ProductInput struct {
	Nombre      string   `json:"nombre"`
	Descripcion string   `json:"descripcion"`
	Categoria   string   `json:"categoria"`
	Img         string   `json:"img"`
	Galeria     []string `json:"galeria"`
	Precio      float64  `json:"precio"`
	Stock       int      `json:"stock"`
	Activo      *bool    `json:"activo,omitempty"`
}
type UserRecord struct {
	ID        int64     `json:"id"`
	Nombre    string    `json:"nombre"`
	Email     string    `json:"email"`
	Rol       string    `json:"rol"`
	Activo    bool      `json:"activo"`
	CodigoRef string    `json:"codigoRef"`
	CreadoEn  time.Time `json:"creadoEn"`
}
type RegisterInput struct {
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Ref      string `json:"ref"`
}

func pagination(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	return page, limit
}
func uniqueError(err error) error {
	var p *pgconn.PgError
	if errors.As(err, &p) && p.Code == "23505" {
		return ErrConflict
	}
	return err
}

func (p *Postgres) Register(ctx context.Context, in RegisterInput) (UserRecord, error) {
	var out UserRecord
	in.Nombre = strings.TrimSpace(in.Nombre)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	in.Ref = strings.TrimSpace(in.Ref)
	if in.Nombre == "" || in.Email == "" || len(in.Password) < 8 || !strings.Contains(in.Email, "@") {
		return out, ErrInvalid
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return out, err
	}
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return out, err
	}
	defer tx.Rollback()
	var parent sql.NullInt64
	if in.Ref != "" {
		err = tx.QueryRowContext(ctx, `SELECT id FROM usuarios WHERE codigo_ref=$1 AND activo=TRUE`, in.Ref).Scan(&parent)
		if errors.Is(err, sql.ErrNoRows) {
			return out, ErrInvalid
		}
		if err != nil {
			return out, err
		}
	}
	err = tx.QueryRowContext(ctx, `INSERT INTO usuarios(nombre,email,password_hash,rol,parent_id,codigo_ref) VALUES($1,$2,$3,'cliente',$4,'PENDING-'||gen_random_uuid()::text) RETURNING id,nombre,email,rol,activo,creado_en`, in.Nombre, in.Email, string(hash), parent).Scan(&out.ID, &out.Nombre, &out.Email, &out.Rol, &out.Activo, &out.CreadoEn)
	if err != nil {
		return out, uniqueError(err)
	}
	out.CodigoRef = fmt.Sprintf("MC%d", out.ID)
	if _, err = tx.ExecContext(ctx, `UPDATE usuarios SET codigo_ref=$1 WHERE id=$2`, out.CodigoRef, out.ID); err != nil {
		return out, err
	}
	return out, tx.Commit()
}

func (p *Postgres) ReferralCode(ctx context.Context, id int64) (string, error) {
	var code string
	err := p.DB.QueryRowContext(ctx, `SELECT codigo_ref FROM usuarios WHERE id=$1`, id).Scan(&code)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrNotFound
	}
	return code, err
}
func (p *Postgres) AffectedEmails(ctx context.Context, id int64) ([]string, error) {
	rows, err := p.DB.QueryContext(ctx, `WITH RECURSIVE up AS (
 SELECT id,parent_id,email,0 AS depth FROM usuarios WHERE id=$1
 UNION ALL SELECT u.id,u.parent_id,u.email,up.depth+1 FROM usuarios u JOIN up ON u.id=up.parent_id WHERE up.depth<3
 ) SELECT email FROM up`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var email string
		if err = rows.Scan(&email); err != nil {
			return nil, err
		}
		out = append(out, email)
	}
	return out, rows.Err()
}
func (p *Postgres) OrderAffectedEmails(ctx context.Context, orderID int64) ([]string, error) {
	var buyer int64
	if err := p.DB.QueryRowContext(ctx, `SELECT usuario_id FROM pedidos WHERE id=$1`, orderID).Scan(&buyer); err != nil {
		return nil, err
	}
	return p.AffectedEmails(ctx, buyer)
}

func (p *Postgres) Users(ctx context.Context, page, limit int) (Page[UserRecord], error) {
	page, limit = pagination(page, limit)
	out := Page[UserRecord]{Data: []UserRecord{}, Page: page, Limit: limit}
	if err := p.DB.QueryRowContext(ctx, `SELECT count(*) FROM usuarios`).Scan(&out.Total); err != nil {
		return out, err
	}
	rows, err := p.DB.QueryContext(ctx, `SELECT id,nombre,email,rol,activo,codigo_ref,creado_en FROM usuarios ORDER BY id LIMIT $1 OFFSET $2`, limit, (page-1)*limit)
	if err != nil {
		return out, err
	}
	defer rows.Close()
	for rows.Next() {
		var u UserRecord
		if err = rows.Scan(&u.ID, &u.Nombre, &u.Email, &u.Rol, &u.Activo, &u.CodigoRef, &u.CreadoEn); err != nil {
			return out, err
		}
		out.Data = append(out.Data, u)
	}
	return out, rows.Err()
}
func (p *Postgres) UpdateUser(ctx context.Context, id int64, role string, active bool) error {
	if role != "admin" && role != "cliente" {
		return ErrInvalid
	}
	res, err := p.DB.ExecContext(ctx, `UPDATE usuarios SET rol=$1,activo=$2 WHERE id=$3`, role, active, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) AdminProducts(ctx context.Context, page, limit int, q string) (Page[models.Producto], error) {
	page, limit = pagination(page, limit)
	out := Page[models.Producto]{Data: []models.Producto{}, Page: page, Limit: limit}
	term := "%" + strings.TrimSpace(q) + "%"
	if err := p.DB.QueryRowContext(ctx, `SELECT count(*) FROM productos WHERE nombre ILIKE $1 OR categoria ILIKE $1`, term).Scan(&out.Total); err != nil {
		return out, err
	}
	rows, err := p.DB.QueryContext(ctx, `SELECT `+productoFields+` FROM productos WHERE nombre ILIKE $1 OR categoria ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3`, term, limit, (page-1)*limit)
	if err != nil {
		return out, err
	}
	defer rows.Close()
	for rows.Next() {
		item, err := scanProducto(rows)
		if err != nil {
			return out, err
		}
		out.Data = append(out.Data, item)
	}
	return out, rows.Err()
}
func (p *Postgres) SaveProduct(ctx context.Context, id int, in ProductInput) (models.Producto, error) {
	var empty models.Producto
	in.Nombre = strings.TrimSpace(in.Nombre)
	in.Categoria = strings.TrimSpace(in.Categoria)
	in.Descripcion = strings.TrimSpace(in.Descripcion)
	in.Img = strings.TrimSpace(in.Img)
	if in.Nombre == "" || in.Categoria == "" || in.Precio <= 0 || in.Precio > 1000000 || in.Stock < 0 {
		return empty, ErrInvalid
	}
	gallery, err := json.Marshal(in.Galeria)
	if err != nil {
		return empty, err
	}
	cents := int64(in.Precio*100 + 0.5)
	if cents < 1 {
		return empty, ErrInvalid
	}
	var query string
	var args []any
	if id == 0 {
		query = `INSERT INTO productos(nombre,descripcion,precio_cents,categoria,img,galeria,stock) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ` + productoFields
		args = []any{in.Nombre, in.Descripcion, cents, in.Categoria, in.Img, gallery, in.Stock}
	}
	if id > 0 {
		query = `UPDATE productos SET nombre=$1,descripcion=$2,precio_cents=$3,categoria=$4,img=$5,galeria=$6,stock=$7 WHERE id=$8 RETURNING ` + productoFields
		args = []any{in.Nombre, in.Descripcion, cents, in.Categoria, in.Img, gallery, in.Stock, id}
	}
	if id < 0 {
		return empty, ErrInvalid
	}
	item, err := scanProducto(p.DB.QueryRowContext(ctx, query, args...))
	if errors.Is(err, sql.ErrNoRows) {
		return empty, ErrNotFound
	}
	return item, err
}
func (p *Postgres) SetProductActive(ctx context.Context, id int, active bool) error {
	res, err := p.DB.ExecContext(ctx, `UPDATE productos SET activo=$1 WHERE id=$2`, active, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
