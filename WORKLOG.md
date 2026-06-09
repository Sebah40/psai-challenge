# WORKLOG

> Completá esto mientras trabajás. Importa tanto como el código: queremos ver tu
> razonamiento, no solo el resultado. Escribí en bullets, informal está perfecto.

## Setup
- ¿Pudiste levantar todo (DB + front)? ¿Algún problema?
Levanté todo OK, decidí usar un Postgres localmente en vez de dentro de un Docker. Cargué el schema y el seed.
Corrí la app con npm install & npm run dev.

## Qué encontré
- Bugs / cosas raras en los endpoints: 

* Mayúsculas y minúsculas no consistentes en los canales: Hacía que para un mismo canal con casing distinto haya separación de información, lo cual es incorrecto. Lo solucioné con:
        conds.push(`lower(t.canal) = lower($${params.length})`);
        'SELECT DISTINCT lower(canal) AS canal FROM tiendas ORDER BY canal'
        
* Filtro de Marca no funciona: Cualquier marca específica seleccionada da el mismo valor, lo cual me dice que probablemente el filtro está mal programado. Me fijo los requests en la tabla de Network:
    {
    "canales": [
        "autoservicios",
        "clubes",
        "conveniencia",
        "farmacias"
    ],
    "marcas": [
        {
            "id": 4,
            "nombre": "Cicatricure"
        },
        {
            "id": 3,
            "nombre": "Goicoechea"
        },
        {
            "id": 2,
            "nombre": "Suerox"
        },
        {
            "id": 1,
            "nombre": "Tío Nacho"
        }
    ]
}

    Cada marca tiene un ID y un nombre. Cada vez que selecciono una marca diferente, se lanza un http://localhost:3000/api/kpis?marca=2,3,4,etc. Pero dentro de kpis/route.ts, puedo observar que la función GET de los KPI espera un m.nombre. Lo cambié a m.id, y el problema se solucionó.

- Cosas raras en los datos (¿hay filas de otro tenant?, ¿la misma tienda+producto en varias fechas?, ¿filas inconsistentes?):

    * Scope por tenant — el KPI es de contoso; ninguna fila de otro tenant debería colarse: Mirando la distribución numérica al 100%, podemos asumir que el scope por tenant no está implementado. Esto se solucionó seteando los valores de las variables:

        const tenant = 'contoso';
    const conds: string[] = ['o.tenant_id = $1'];
    const params: any[] = [tenant];

    y ajustando una de las queries:          (SELECT count(*) FROM tiendas WHERE tenant_id = $1) AS total`,

* La misma tienda+producto aparece observada en varias fechas: por ejemplo Soriana Sur + Goicoechea Várices figura presente el 2026-05-13 pero ausente el 2026-05-15. Como las queries contaban todas las observaciones históricas, el KPI usaba el dato viejo y Soriana contaba como si todavía tuviera el producto. Lo solucioné agregando un CTE en las queries para quedarme con la última observación de cada tienda+producto:

        WITH ultimas AS (
          SELECT DISTINCT ON (tienda_id, producto_id) *
          FROM observaciones
          WHERE tenant_id = $1
          ORDER BY tienda_id, producto_id, fecha DESC, id DESC
        )

    El DISTINCT ON corre adentro del filtro de tenant porque si deduplicara entre tenants, una observación de acme con la misma tienda+producto y la misma fecha podría pisar a la de contoso (pasa con la obs 42 vs la obs 2). El id DESC del ORDER BY es para desempatar de forma determinística si hay dos observaciones con la misma fecha. Lo verifiqué filtrando por Goicoechea: la DN bajó de 60% a 50% (Soriana ya no cuenta) y las observaciones consideradas bajaron de 34 a 31.

    Para cada tienda+producto uso la observación más reciente como estado actual, incluso si es vieja (caso Sam's Club + Goicoechea, 2026-04-15): una observación vale hasta que una visita nueva la contradiga.

* Solucionado stock cero y negativo: count(*) FILTER (WHERE o.presente = true AND o.stock_unidades > 0) AS con_stock

* Solucionado el denominador de DN: era un count(*) FROM tiendas fijo que ignoraba los filtros, por eso la tarjeta Tiendas siempre mostraba el total. Le armé sus propias condiciones con tenant y canal:

        const tiendasConds: string[] = ['tenant_id = $1'];
        tiendasConds.push(`lower(canal) = lower($${params.length})`);
        (SELECT count(*) FROM tiendas WHERE ${tiendasConds.join(' AND ')}) AS total

    El filtro de marca a propósito no achica el denominador: DN es el porcentaje de todas las tiendas del universo que tienen la marca, si la marca filtrara el denominador daría siempre 100%.

* Tienda inactiva y tienda de prueba: Bodega Vieja (activa = false) y PRUEBA QA NO USAR (id 10) contaban en los KPIs. Las excluí del universo en todas las queries con activa = true y t.id <> 10. Una tienda cerrada no es una oportunidad de distribución y la de QA es dato de prueba. No filtro por nombre (%PRUEBA%) porque matchear strings es frágil: en producción pediría un flag es_test en la fuente. El denominador general queda en 8 tiendas.

- ¿Cómo te diste cuenta? (qué número no cerraba, qué query corriste, etc.)

Decidí agregar una tabla para ver qué datos se están filtrando y qué datos no se están filtrando, para acelerar el proceso.

## Qué cambié y por qué
- DN:
- Disp:
- Filtro canal:
- Filtro marca:
- Scope por tenant (el KPI es de `contoso`):
- Estado actual / fechas (¿qué observación tomaste como "hoy" para cada tienda+producto? ¿qué hiciste con las viejas?):
- Manejo de datos sucios (qué excluiste / cómo lo trataste y por qué):

## Decisiones y supuestos
- (Ej.: "asumí que las tiendas inactivas no cuentan porque…", "a stock NULL lo traté como
  no-disponible porque…", "para 'hoy' tomé la última obs por tienda+producto y descarté las
  de más de X días porque…", "scopeo por tenant en todas las queries porque…")

## Test
- ¿Qué fijaste en el/los test(s)? (qué KPI, sobre qué subconjunto conocido)

* 6 tests en app/tests/kpis.test.mjs con node:test (sin dependencias nuevas), se corren con npm test con la app y la DB levantadas. Fijan DN, Disp, tiendas y observaciones calculados a mano contra el seed: el general, Goicoechea (Soriana no cuenta por estado actual), Suerox (el stock -2 no cuenta como disponible), farmacias (el denominador respeta el canal), el casing del canal, y la exclusión manual (al excluir una observación resurge la anterior). Las exclusiones manuales no se tienen en cuenta durante los tests: un before() las reincorpora y un after() las restaura como estaban.

## Extras / pregunta de escala (opcional)
- Si hiciste algún extra, contalo acá.

* Agregué exclusión manual de observaciones: columna excluida BOOLEAN DEFAULT false en el esquema, un PATCH en /api/observaciones que la togglea (scopeado por tenant) y en la UI un botón Excluir por fila más un modal con las excluidas donde se pueden reincorporar. La exclusión corre antes del DISTINCT ON, así al excluir una observación la anterior de esa tienda+producto vuelve a ser el estado actual. Nota: en el producto real el mirror es read-only, esto viviría en una tabla de exclusiones propia de la app que se joinea contra el mart, no como columna del mirror.
- (Opcional, track de profundidad) Esto en producción corre sobre ~50M observaciones y ~400
  tenants, leyendo de *gold marts* read-only (Snowflake). ¿Qué se rompe del enfoque actual y
  qué cambiarías? (índices, una sola query vs varios round-trips, etc.) — en prosa, no hace
  falta implementarlo.

## Qué dejaría para después / qué no llegué
-

## Tiempo aprox. dedicado
-
