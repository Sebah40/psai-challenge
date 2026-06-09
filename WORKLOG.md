# WORKLOG

> Completá esto mientras trabajás. Importa tanto como el código: queremos ver tu
> razonamiento, no solo el resultado. Escribí en bullets, informal está perfecto.

## Setup
- ¿Pudiste levantar todo (DB + front)? ¿Algún problema?

## Qué encontré
- Bugs / cosas raras en los endpoints:
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
