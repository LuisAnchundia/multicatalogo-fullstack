-- Base de demostración. Docker solo ejecuta este script al crear un volumen nuevo.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'cliente')),
    parent_id BIGINT REFERENCES usuarios(id),
    ventas_cents BIGINT NOT NULL DEFAULT 0 CHECK (ventas_cents >= 0),
    saldo_cents BIGINT NOT NULL DEFAULT 0 CHECK (saldo_cents >= 0)
);

CREATE TABLE productos (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    precio_cents BIGINT NOT NULL CHECK (precio_cents >= 0),
    categoria TEXT NOT NULL,
    img TEXT NOT NULL,
    galeria JSONB NOT NULL DEFAULT '[]'::jsonb,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE pedidos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    numero TEXT UNIQUE NOT NULL,
    total_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    nombre_cliente TEXT NOT NULL,
    email_cliente TEXT NOT NULL,
    direccion TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    telefono TEXT NOT NULL,
    metodo_pago TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pedido_items (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_cents BIGINT NOT NULL CHECK (precio_cents >= 0)
);

-- El trabajo se registra dentro de la compra. Si el proceso cae, queda pendiente.
CREATE TABLE commission_jobs (
    pedido_id BIGINT PRIMARY KEY REFERENCES pedidos(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    total_cents BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done'))
);

CREATE TABLE comisiones (
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id),
    beneficiario_id BIGINT NOT NULL REFERENCES usuarios(id),
    nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 3),
    monto_cents BIGINT NOT NULL CHECK (monto_cents >= 0),
    PRIMARY KEY (pedido_id, beneficiario_id, nivel)
);

-- Cuentas de clase; la contraseña 12345678 se guarda como bcrypt, no como texto plano.
INSERT INTO usuarios(id,email,password_hash,nombre,rol,parent_id,ventas_cents,saldo_cents) VALUES
(1,'admin@upse.edu.ec',crypt('12345678',gen_salt('bf')),'Tú','admin',NULL,240000,31950),
(2,'cliente@upse.edu.ec',crypt('12345678',gen_salt('bf')),'Ana García','cliente',1,120000,0),
(3,'luis.poveda@demo.local',crypt('12345678',gen_salt('bf')),'Luis Poveda','cliente',1,85000,0),
(4,'marta.sanchez@demo.local',crypt('12345678',gen_salt('bf')),'Marta Sánchez','cliente',1,43000,0),
(5,'carlos.ruiz@demo.local',crypt('12345678',gen_salt('bf')),'Carlos Ruiz','cliente',2,50000,0),
(6,'sofia.leon@demo.local',crypt('12345678',gen_salt('bf')),'Sofía León','cliente',2,43000,0),
(7,'marco.diaz@demo.local',crypt('12345678',gen_salt('bf')),'Marco Díaz','cliente',3,38000,0),
(8,'diana.paz@demo.local',crypt('12345678',gen_salt('bf')),'Diana Paz','cliente',5,30000,0);
SELECT setval(pg_get_serial_sequence('usuarios','id'), 8);

INSERT INTO productos(id,nombre,descripcion,precio_cents,categoria,img,galeria,stock) VALUES
(1,'Serum Revitalizante','Serum concentrado con vitamina C y ácido hialurónico. Ilumina la piel y aporta hidratación profunda.',4500,'Serum','https://picsum.photos/seed/serum/600','["https://picsum.photos/seed/serum1/600","https://picsum.photos/seed/serum2/600","https://picsum.photos/seed/serum3/600"]',50),
(2,'Crema Hidratante Pro','Crema facial con niacinamida y manteca de karité. Hidratación de 24 horas.',3250,'Crema','https://picsum.photos/seed/crema/600','["https://picsum.photos/seed/crema1/600","https://picsum.photos/seed/crema2/600","https://picsum.photos/seed/crema3/600"]',50),
(3,'Tónico Purificante','Tónico sin alcohol con hamamelis y agua de rosas.',2800,'Tónico','https://picsum.photos/seed/tonico/600','["https://picsum.photos/seed/tonico1/600","https://picsum.photos/seed/tonico2/600","https://picsum.photos/seed/tonico3/600"]',50),
(4,'Mascarilla Nocturna','Mascarilla de noche con colágeno y vitamina E.',5000,'Mascarilla','https://picsum.photos/seed/mascarilla/600','["https://picsum.photos/seed/mascarilla1/600","https://picsum.photos/seed/mascarilla2/600","https://picsum.photos/seed/mascarilla3/600"]',50),
(5,'Serum Anti-Edad Retinol','Serum de retinol encapsulado de uso nocturno.',5800,'Serum','https://picsum.photos/seed/retinol/600','["https://picsum.photos/seed/retinol1/600","https://picsum.photos/seed/retinol2/600","https://picsum.photos/seed/retinol3/600"]',50),
(6,'Crema Contorno de Ojos','Contorno de ojos con cafeína y péptidos.',2600,'Crema','https://picsum.photos/seed/ojos/600','["https://picsum.photos/seed/ojos1/600","https://picsum.photos/seed/ojos2/600","https://picsum.photos/seed/ojos3/600"]',50),
(7,'Tónico Exfoliante AHA-BHA','Exfoliación química suave con ácidos AHA y BHA.',3400,'Tónico','https://picsum.photos/seed/exfoliante/600','["https://picsum.photos/seed/exfoliante1/600","https://picsum.photos/seed/exfoliante2/600","https://picsum.photos/seed/exfoliante3/600"]',50),
(8,'Kit Rutina Completa','Kit con serum, crema, tónico y mascarilla.',12900,'Kit','https://picsum.photos/seed/kit/600','["https://picsum.photos/seed/kit1/600","https://picsum.photos/seed/kit2/600","https://picsum.photos/seed/kit3/600"]',50);
SELECT setval(pg_get_serial_sequence('productos','id'), 8);
