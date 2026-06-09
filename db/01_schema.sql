-- Esquema mini "Perfect Store" para el challenge.

-- Para búsqueda insensible a acentos (Tío = tio).
CREATE EXTENSION IF NOT EXISTS unaccent;
-- NOTA: a propósito NO hay foreign keys. Los datos vienen de un mirror externo
-- (como en producción) y pueden traer filas inconsistentes. Tenelo en cuenta.

CREATE TABLE marcas (
    id      INT PRIMARY KEY,
    nombre  TEXT NOT NULL
);

-- Multi-tenant: cada tienda pertenece a un cliente (tenant). En este tablero el
-- KPI se reporta para UN tenant ('contoso'). En el producto real, TODA query que
-- toca datos de campo filtra por tenant — nunca se mezclan clientes.
CREATE TABLE tiendas (
    id         INT PRIMARY KEY,
    nombre     TEXT NOT NULL,
    canal      TEXT NOT NULL,
    activa     BOOLEAN NOT NULL DEFAULT true,
    tenant_id  TEXT NOT NULL DEFAULT 'contoso'
);

CREATE TABLE productos (
    id        INT PRIMARY KEY,
    nombre    TEXT NOT NULL,
    marca_id  INT            -- referencia a marcas.id (sin FK)
);

-- Una observación = una visita a una tienda donde se chequeó un producto en una
-- FECHA dada: si estaba presente en el anaquel y cuántas unidades había.
-- La misma tienda+producto puede tener varias observaciones en fechas distintas
-- (el equipo de campo revisita). El dato del mirror es acumulativo.
CREATE TABLE observaciones (
    id              INT PRIMARY KEY,
    tienda_id       INT NOT NULL,      -- referencia a tiendas.id (sin FK)
    producto_id     INT NOT NULL,      -- referencia a productos.id (sin FK)
    fecha           DATE NOT NULL,
    presente        BOOLEAN NOT NULL,  -- ¿estaba el producto en la tienda?
    stock_unidades  INT,               -- unidades en stock (puede ser NULL)
    tenant_id       TEXT NOT NULL DEFAULT 'contoso',
    excluida        BOOLEAN NOT NULL DEFAULT false  -- exclusión manual del KPI
);

CREATE INDEX idx_obs_tienda   ON observaciones (tienda_id);
CREATE INDEX idx_obs_producto ON observaciones (producto_id);
