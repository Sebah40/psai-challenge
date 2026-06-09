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
- ¿Cómo te diste cuenta? (qué número no cerraba, qué query corriste, etc.)

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

## Extras / pregunta de escala (opcional)
- Si hiciste algún extra, contalo acá.
- (Opcional, track de profundidad) Esto en producción corre sobre ~50M observaciones y ~400
  tenants, leyendo de *gold marts* read-only (Snowflake). ¿Qué se rompe del enfoque actual y
  qué cambiarías? (índices, una sola query vs varios round-trips, etc.) — en prosa, no hace
  falta implementarlo.

## Qué dejaría para después / qué no llegué
-

## Tiempo aprox. dedicado
-
