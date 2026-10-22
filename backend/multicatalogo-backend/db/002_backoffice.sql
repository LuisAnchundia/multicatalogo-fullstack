-- Ampliaciones idempotentes para los volúmenes ya creados.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_ref TEXT;
UPDATE usuarios SET codigo_ref = 'MC' || id WHERE codigo_ref IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_ref_key ON usuarios(codigo_ref);
CREATE INDEX IF NOT EXISTS usuarios_parent_id_idx ON usuarios(parent_id);

ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS acreditada BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE comisiones c SET acreditada=TRUE FROM commission_jobs j
WHERE c.pedido_id=j.pedido_id AND j.status='done' AND c.estado='pendiente' AND c.acreditada=FALSE;
CREATE INDEX IF NOT EXISTS pedidos_usuario_fecha_idx ON pedidos(usuario_id, fecha DESC);
CREATE INDEX IF NOT EXISTS comisiones_beneficiario_idx ON comisiones(beneficiario_id, estado);

CREATE TABLE IF NOT EXISTS liquidaciones (
    id BIGSERIAL PRIMARY KEY,
    beneficiario_id BIGINT NOT NULL REFERENCES usuarios(id),
    total_cents BIGINT NOT NULL CHECK (total_cents > 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS liquidacion_id BIGINT REFERENCES liquidaciones(id);
