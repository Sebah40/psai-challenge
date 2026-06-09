-- Datos de ejemplo (datos "de campo", tal cual llegan del mirror: con ruido).

INSERT INTO marcas (id, nombre) VALUES
    (1, 'Tío Nacho'),
    (2, 'Suerox'),
    (3, 'Goicoechea'),
    (4, 'Cicatricure');

INSERT INTO tiendas (id, nombre, canal, activa, tenant_id) VALUES
    (1,  'Walmart Centro',                'Autoservicios',  true,  'contoso'),
    (2,  'Walmart Norte',                 'autoservicios',  true,  'contoso'),
    (3,  'Soriana Sur',                   'autoservicios',  true,  'contoso'),
    (4,  'Farmacia del Ahorro Reforma',   'Farmacias',      true,  'contoso'),
    (5,  'Farmacia del Ahorro Polanco',   'Farmacias',      true,  'contoso'),
    (6,  'Oxxo Condesa',                  'Conveniencia',   true,  'contoso'),
    (7,  'Sam''s Club Satélite',          'Clubes',         true,  'contoso'),
    (8,  'Chedraui Roma',                 'AUTOSERVICIOS',  true,  'contoso'),
    (9,  'Bodega Vieja',                  'Autoservicios',  false, 'contoso'),
    (10, 'PRUEBA QA - NO USAR',           'Autoservicios',  true,  'contoso'),
    (11, 'Acme Market Centro',            'Autoservicios',  true,  'acme'),
    (12, 'Acme Farmacia Norte',           'Farmacias',      true,  'acme');

INSERT INTO productos (id, nombre, marca_id) VALUES
    (1, 'Tío Nacho Shampoo 415ml',        1),
    (2, 'Tío Nacho Acondicionador',       1),
    (3, 'Suerox Manzana 630ml',           2),
    (4, 'Suerox Uva 630ml',               2),
    (5, 'Goicoechea Várices',             3),
    (6, 'Cicatricure Gel',                4),
    (7, 'Cicatricure Crema Facial',       4),
    (8, 'Genérico Sin Marca',             99);

-- Foto de hoy (2026-05-15), tenant contoso.
INSERT INTO observaciones (id, tienda_id, producto_id, fecha, presente, stock_unidades, tenant_id) VALUES
    (1,  1, 1, '2026-05-15', true,  10,  'contoso'),
    (2,  1, 2, '2026-05-15', true,  5,   'contoso'),
    (3,  1, 3, '2026-05-15', true,  20,  'contoso'),
    (4,  1, 4, '2026-05-15', true,  0,   'contoso'),
    (5,  1, 5, '2026-05-15', true,  8,   'contoso'),
    (6,  1, 6, '2026-05-15', true,  12,  'contoso'),
    (7,  2, 1, '2026-05-15', true,  3,   'contoso'),
    (8,  2, 3, '2026-05-15', true,  15,  'contoso'),
    (9,  2, 5, '2026-05-15', true,  0,   'contoso'),
    (10, 2, 6, '2026-05-15', true,  7,   'contoso'),
    (11, 2, 4, '2026-05-15', true,  -2,  'contoso'),
    (12, 3, 1, '2026-05-15', true,  6,   'contoso'),
    (13, 3, 3, '2026-05-15', true,  9,   'contoso'),
    (14, 3, 4, '2026-05-15', true,  4,   'contoso'),
    (15, 3, 7, '2026-05-15', true,  2,   'contoso'),
    (16, 4, 5, '2026-05-15', true,  5,   'contoso'),
    (17, 4, 6, '2026-05-15', true,  10,  'contoso'),
    (18, 4, 7, '2026-05-15', true,  8,   'contoso'),
    (19, 5, 5, '2026-05-15', true,  0,   'contoso'),
    (20, 5, 6, '2026-05-15', true,  3,   'contoso'),
    (21, 5, 7, '2026-05-15', true,  NULL,'contoso'),
    (22, 6, 3, '2026-05-15', true,  4,   'contoso'),
    (23, 6, 4, '2026-05-15', true,  6,   'contoso'),
    (24, 7, 1, '2026-05-15', true,  30,  'contoso'),
    (25, 7, 3, '2026-05-15', true,  25,  'contoso'),
    (26, 8, 2, '2026-05-15', true,  4,   'contoso'),
    (27, 8, 6, '2026-05-15', true,  9,   'contoso'),
    (28, 8, 7, '2026-05-15', true,  1,   'contoso'),
    (29, 8, 4, '2026-05-15', false, 0,   'contoso'),
    (30, 9, 3, '2026-05-15', true,  50,  'contoso'),
    (31, 10, 1, '2026-05-15', true, 99,  'contoso'),
    (32, 1, 999, '2026-05-15', true, 5,  'contoso'),
    (33, 999, 3, '2026-05-15', true, 8,  'contoso');

-- Revisitas en fechas anteriores (la misma tienda+producto chequeada más de una vez).
INSERT INTO observaciones (id, tienda_id, producto_id, fecha, presente, stock_unidades, tenant_id) VALUES
    (34, 3, 5, '2026-05-13', true,  8,   'contoso'),
    (35, 3, 5, '2026-05-15', false, 0,   'contoso'),
    (36, 4, 6, '2026-05-13', true,  0,   'contoso'),
    (37, 7, 5, '2026-04-15', true,  5,   'contoso'),
    (38, 6, 4, '2026-05-14', true,  6,   'contoso');

-- Datos de otro cliente (tenant 'acme').
INSERT INTO observaciones (id, tienda_id, producto_id, fecha, presente, stock_unidades, tenant_id) VALUES
    (39, 11, 1, '2026-05-15', true,  20,  'acme'),
    (40, 11, 3, '2026-05-15', true,  0,   'acme'),
    (41, 12, 6, '2026-05-15', true,  15,  'acme'),
    (42, 1,  2, '2026-05-15', true,  99,  'acme');
