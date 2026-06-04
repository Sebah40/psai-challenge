-- Esquema mini "Perfect Store" para el challenge.
-- NOTA: a propósito NO hay foreign keys. Los datos vienen de un mirror externo
-- (como en producción) y pueden traer filas inconsistentes. Tenelo en cuenta.

CREATE TABLE marcas (
    id      INT PRIMARY KEY,
    nombre  TEXT NOT NULL
);

CREATE TABLE tiendas (
    id      INT PRIMARY KEY,
    nombre  TEXT NOT NULL,
    canal   TEXT NOT NULL,
    activa  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE productos (
    id        INT PRIMARY KEY,
    nombre    TEXT NOT NULL,
    marca_id  INT            -- referencia a marcas.id (sin FK)
);

-- Una observación = una visita a una tienda donde se chequeó un producto:
-- si estaba presente en el anaquel y cuántas unidades de stock había.
CREATE TABLE observaciones (
    id              INT PRIMARY KEY,
    tienda_id       INT NOT NULL,      -- referencia a tiendas.id (sin FK)
    producto_id     INT NOT NULL,      -- referencia a productos.id (sin FK)
    fecha           DATE NOT NULL,
    presente        BOOLEAN NOT NULL,  -- ¿estaba el producto en la tienda?
    stock_unidades  INT                -- unidades en stock (puede ser NULL)
);

CREATE INDEX idx_obs_tienda   ON observaciones (tienda_id);
CREATE INDEX idx_obs_producto ON observaciones (producto_id);
