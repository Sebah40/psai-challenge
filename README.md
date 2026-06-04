# 🛒 Challenge — Tablero de KPIs de Retail (Perfect Store)

¡Hola! 👋 Este es un mini-tablero de métricas de retail. **No hace falta que sepas nada del
rubro** — abajo te explicamos cada término. Queremos ver cómo investigás, cómo trabajás con
datos imperfectos y cómo justificás tus decisiones.

> ### 🎯 Tu misión
> La app ya está armada y andando, pero **los dos KPIs muestran números equivocados** y
> **los filtros no responden bien**. Tu trabajo: entender por qué y **dejarlos correctos**.
> El detalle de qué entregar está en el [checklist](#-tu-checklist) más abajo.

---

## 📖 Glosario (1 minuto, leelo)

| Término | Qué es |
|---|---|
| **KPI** | *Key Performance Indicator*: un número que resume algo del negocio. Acá hay dos. |
| **Tienda / canal** | Un local. El **canal** es el tipo de local (autoservicio, farmacia, conveniencia, club). |
| **Marca / producto** | La marca (ej. "Suerox") y sus productos (ej. "Suerox Manzana 630ml"). |
| **Presente** | El producto estaba en la góndola cuando se visitó la tienda. |
| **Stock** | Unidades disponibles para vender en ese momento (**stock 0 = está pero agotado**). |
| **Observación** | Una visita a una tienda donde se anotó si el producto estaba y cuánto stock había. |

---

## 📊 Los 2 KPIs

### 1) Distribución Numérica (DN)
**De todas las tiendas, ¿en qué porcentaje _está_ el producto?**
```
DN = (tiendas donde el producto está presente) ÷ (total de tiendas) × 100
```
> 🧮 *Ejemplo:* 10 tiendas y el shampoo está en 6 → **DN = 60%**

### 2) Disponibilidad (Disp)
**De las tiendas donde el producto _está_, ¿en cuántas además _hay stock_ (no agotado)?**
```
Disp = (observaciones con stock > 0) ÷ (observaciones donde el producto está presente) × 100
```
> 🧮 *Ejemplo:* presente en 6 tiendas, pero agotado en 2 → disponible en 4 → **Disp = 67%**

Los dos tienen que poder filtrarse por **canal** y por **marca**.

---

## 🐛 Qué está mal hoy

Hay **dos** problemas mezclados:

1. **Bugs en las queries del endpoint** (`app/app/api/kpis/route.ts`) → los números no
   cierran y los filtros no responden bien.
2. **Datos "de campo", con ruido** → como en cualquier sistema real (esto sale de un
   *mirror* externo), hay filas que **no deberían contar** para el KPI. Decidir cuáles, y qué
   hacer con ellas, es parte del laburo.

---

## ✅ ¿Qué significa "dejar los KPIs bien"?

Que el número **refleje correctamente lo que dicen los datos**, según las definiciones de arriba.

**No hay un número secreto que tengas que adivinar.** No evaluamos si pegás un decimal exacto,
sino que: entiendas **qué mide** cada KPI · el cálculo sea **coherente** con la definición y los
datos · y que **justifiques** qué hiciste con los datos dudosos (en el `WORKLOG.md`).

> 💡 **Cómo sabés que vas bien:** si un KPI da algo que **no tiene sentido** (un porcentaje
> imposible, o una tarjeta que cuenta más cosas de las que esperarías), algo se está colando.
> Antes de tocar código, **mirá los datos crudos** y hacete una idea de cuánto *debería* dar.
> Esa es la mitad del ejercicio.

---

## 🧰 Setup

Necesitás **Docker** y **Node 18+**.

```bash
# 1) Base de datos (se crea y se seedea sola la primera vez)
docker compose up -d

# 2) Front
cd app
cp ../.env.example .env.local      # o exportá DATABASE_URL
npm install
npm run dev                        # abrí http://localhost:3000
```

DB en `localhost:5544` · user / pass / db = `challenge` / `challenge` / `retail`.
Esquema en `db/01_schema.sql`, datos en `db/02_seed.sql` — miralos libremente (psql, DBeaver, etc.).

---

## 📋 Tu checklist

### Básico — lo que esperamos
- [ ] **DN da bien** — revisá la fórmula y la query.
- [ ] **Disp da bien.**
- [ ] **El filtro de Canal funciona** (seleccioná uno y fijate si el resultado es coherente).
- [ ] **El filtro de Marca funciona.**
- [ ] **Datos sucios manejados con criterio** — qué filas excluís/corregís y **por qué** (al WORKLOG).

### Extra — opcional (elegí 1 o 2, no hace falta todo)
- [ ] Un corte o KPI más: ej. **DN por canal**, o **quiebre** (presente pero con stock 0 — alerta típica en retail).
- [ ] Tests, validación de inputs, o un endpoint que muestre **qué filas se excluyeron y por qué**.

---

## 📦 Entregable
- [ ] Tu código con los cambios. Podés tocar **lo que quieras** (endpoints, front, queries, e incluso el esquema si lo justificás).
- [ ] **`WORKLOG.md` completo** — cuenta tanto como el código: qué encontraste, qué cambiaste y **por qué**, qué supuestos tomaste, qué dejarías para después. Si algo te suena raro, anotalo aunque no lo arregles.

## ⏱️ Tiempo
**~2-3 horas.** No buscamos algo perfecto y completo: buscamos ver cómo **pensás**, qué **notás**
en los datos y cómo **justificás** lo que hacés.

## 🛠️ Stack
Next.js (App Router) + Postgres (driver `pg`). No hace falta sumar librerías; si lo hacés,
contanos por qué en el WORKLOG.

---

> ¿Algo del setup no levanta (Docker, el front)? Anotalo en el WORKLOG y seguí con lo que
> puedas — también nos sirve ver cómo manejás un blocker.
