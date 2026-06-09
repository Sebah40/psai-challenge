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

* Filas huérfanas: la obs 32 apunta a un producto que no existe (999) y la obs 33 a una tienda que no existe (999). Quedan afuera por los INNER JOIN y lo dejo así a propósito: sin FKs el JOIN es el filtro.

* El dropdown de canales leía tiendas de todos los tenants, le agregué el filtro por tenant. Con estos datos no cambiaba nada pero conceptualmente corresponde.

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
- A stock NULL lo trato como no disponible: si el dato no afirma que hay stock no cuento disponibilidad.
- Stock negativo es dato corrupto del mirror: cuenta como presente pero nunca como disponible.
- Estado actual: la observación más reciente por tienda+producto, sin ventana de antigüedad. Una observación vale hasta que una visita nueva la contradiga.
- Tiendas inactivas y de prueba fuera del universo de los KPIs.
- El tenant va hardcodeado como constante: en el producto real saldría de la sesión del usuario, nunca de la URL.

## Test
- ¿Qué fijaste en el/los test(s)? (qué KPI, sobre qué subconjunto conocido)

* 6 tests en app/tests/kpis.test.mjs con node:test (sin dependencias nuevas), se corren con npm test con la app y la DB levantadas. Fijan DN, Disp, tiendas y observaciones calculados a mano contra el seed: el general, Goicoechea (Soriana no cuenta por estado actual), Suerox (el stock -2 no cuenta como disponible), farmacias (el denominador respeta el canal), el casing del canal, y la exclusión manual (al excluir una observación resurge la anterior). Las exclusiones manuales no se tienen en cuenta durante los tests: un before() las reincorpora y un after() las restaura como estaban.

## Extras / pregunta de escala (opcional)
- Si hiciste algún extra, contalo acá.

* Agregué exclusión manual de observaciones: columna excluida BOOLEAN DEFAULT false en el esquema, un PATCH en /api/observaciones que la togglea (scopeado por tenant) y en la UI un botón Excluir por fila más un modal con las excluidas donde se pueden reincorporar. La exclusión corre antes del DISTINCT ON, así al excluir una observación la anterior de esa tienda+producto vuelve a ser el estado actual. Nota: en el producto real el mirror es read-only, esto viviría en una tabla de exclusiones propia de la app que se joinea contra el mart, no como columna del mirror.

* Los filtros de Canal y Marca pasaron de dropdown fijo a combobox con búsqueda: un input con datalist que sugiere opciones a medida que escribís. La búsqueda va al server (/api/filters?q=) y es insensible a mayúsculas (ILIKE) y a acentos (extensión unaccent de Postgres en ambos lados de la comparación, agregada al schema), escapando % y _ para que no se inyecten wildcards. En el front cada uno tiene debounce de 300ms para no disparar una request por tecla y cache en memoria por búsqueda. El texto aplica el filtro a los KPIs cuando coincide con una opción (también sin importar acentos ni mayúsculas); vacío o sin match es todas/todos.

* Paginé la tabla para que no se sobrecargue ni la DB ni el front con miles de filas: /api/observaciones acepta page y pageSize (default 20, capado a 100), aplica LIMIT/OFFSET en la query y devuelve el total con count(*) OVER() en la misma consulta, sin un round-trip extra. En el front hay controles anterior/siguiente, vuelve a la página 1 al cambiar de filtro y cachea cada página. Así la DB nunca devuelve más de pageSize filas sin importar el tamaño de la tabla.

* Ordenamiento por columna haciendo click en el header: como la tabla pagina en el server, el orden también va en el server (si ordenara solo el cliente, ordenaría apenas las 20 filas de la página actual). /api/observaciones acepta sort y dir. Los nombres de columna no se pueden parametrizar como un valor, así que uso una whitelist (un map de clave -> expresión SQL) y cualquier valor desconocido cae a o.id: eso evita inyección. El orden lleva NULLS LAST (el stock sin dato queda al final) y un secundario por o.id para que la paginación sea determinista ante empates. En el front el click alterna asc/desc y vuelve a la página 1.

* Agregué dos charts con Chart.js (chart.js + react-chartjs-2): un gráfico de barras de DN por canal y una dona del estado de stock (en stock / bajo / agotado / sin dato) sobre el estado actual. Sumé la librería en vez de hacerlos a mano en SVG porque da tooltips, leyenda y ejes ya resueltos y es estándar; suma ~250 KB al bundle del cliente, aceptable para un tablero. Los datos los agrega un endpoint nuevo /api/charts en el server (mismo universo limpio que los KPIs, respeta el filtro de marca). Justifico la dependencia acá como pide el README.
- (Opcional, track de profundidad) Esto en producción corre sobre ~50M observaciones y ~400
  tenants, leyendo de *gold marts* read-only (Snowflake). ¿Qué se rompe del enfoque actual y
  qué cambiarías? (índices, una sola query vs varios round-trips, etc.) — en prosa, no hace
  falta implementarlo.

## Qué dejaría para después / qué no llegué
- Tests con su propia DB y fixtures en vez de pegarle a la DB de desarrollo.
- Validación de inputs (hoy ?marca=abc devuelve 500 por el cast de Postgres).
- Mostrar la antigüedad de cada observación en la UI: la frescura del dato debería ser visible.
- Un flag es_test para las tiendas de prueba en lugar del id hardcodeado.

## Tiempo aprox. dedicado
- 2 horas en total durante el día sin apuro. Probando Claude Fable.
