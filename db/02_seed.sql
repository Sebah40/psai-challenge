-- Datos de ejemplo (datos "de campo", tal cual llegan del mirror: con ruido).

INSERT INTO marcas (id, nombre) VALUES
    (1, 'Tío Nacho'),
    (2, 'Suerox'),
    (3, 'Goicoechea'),
    (4, 'Cicatricure');

INSERT INTO tiendas (id, nombre, canal, activa) VALUES
    (1,  'Walmart Centro',                'Autoservicios',  true),
    (2,  'Walmart Norte',                 'autoservicios',  true),
    (3,  'Soriana Sur',                   'autoservicios',  true),
    (4,  'Farmacia del Ahorro Reforma',   'Farmacias',      true),
    (5,  'Farmacia del Ahorro Polanco',   'Farmacias',      true),
    (6,  'Oxxo Condesa',                  'Conveniencia',   true),
    (7,  'Sam''s Club Satélite',          'Clubes',         true),
    (8,  'Chedraui Roma',                 'AUTOSERVICIOS',  true),
    (9,  'Bodega Vieja',                  'Autoservicios',  false),
    (10, 'PRUEBA QA - NO USAR',           'Autoservicios',  true);

INSERT INTO productos (id, nombre, marca_id) VALUES
    (1, 'Tío Nacho Shampoo 415ml',        1),
    (2, 'Tío Nacho Acondicionador',       1),
    (3, 'Suerox Manzana 630ml',           2),
    (4, 'Suerox Uva 630ml',               2),
    (5, 'Goicoechea Várices',             3),
    (6, 'Cicatricure Gel',                4),
    (7, 'Cicatricure Crema Facial',       4),
    (8, 'Genérico Sin Marca',             99);

INSERT INTO observaciones (id, tienda_id, producto_id, fecha, presente, stock_unidades) VALUES
    (1,  1, 1, '2026-05-15', true,  10),
    (2,  1, 2, '2026-05-15', true,  5),
    (3,  1, 3, '2026-05-15', true,  20),
    (4,  1, 4, '2026-05-15', true,  0),
    (5,  1, 5, '2026-05-15', true,  8),
    (6,  1, 6, '2026-05-15', true,  12),
    (7,  2, 1, '2026-05-15', true,  3),
    (8,  2, 3, '2026-05-15', true,  15),
    (9,  2, 5, '2026-05-15', true,  0),
    (10, 2, 6, '2026-05-15', true,  7),
    (11, 2, 4, '2026-05-15', true,  -2),
    (12, 3, 1, '2026-05-15', true,  6),
    (13, 3, 3, '2026-05-15', true,  9),
    (14, 3, 4, '2026-05-15', true,  4),
    (15, 3, 7, '2026-05-15', true,  2),
    (16, 4, 5, '2026-05-15', true,  5),
    (17, 4, 6, '2026-05-15', true,  10),
    (18, 4, 7, '2026-05-15', true,  8),
    (19, 5, 5, '2026-05-15', true,  0),
    (20, 5, 6, '2026-05-15', true,  3),
    (21, 5, 7, '2026-05-15', true,  NULL),
    (22, 6, 3, '2026-05-15', true,  4),
    (23, 6, 4, '2026-05-15', true,  6),
    (24, 7, 1, '2026-05-15', true,  30),
    (25, 7, 3, '2026-05-15', true,  25),
    (26, 8, 2, '2026-05-15', true,  4),
    (27, 8, 6, '2026-05-15', true,  9),
    (28, 8, 7, '2026-05-15', true,  1),
    (29, 8, 4, '2026-05-15', false, 0),
    (30, 9, 3, '2026-05-15', true,  50),
    (31, 10, 1, '2026-05-15', true, 99),
    (32, 1, 999, '2026-05-15', true, 5),
    (33, 999, 3, '2026-05-15', true, 8);
