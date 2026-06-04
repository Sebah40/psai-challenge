# Challenge — Retail KPIs (Perfect Store)

Mini-tablero de KPIs de retail. Hay una base de datos con tiendas, productos y
**observaciones** (visitas a tienda donde se chequeó si un producto estaba presente
y cuánto stock tenía), y un front simple con 2 tarjetas de KPI y dos filtros.

**El front y los endpoints ya están armados y conectados. Pero los números que muestra
están mal.** Tu trabajo es entender por qué y dejarlos bien.

---

## Los 2 KPIs (definiciones — esto es la verdad)

- **Distribución Numérica (DN):** de las tiendas (reales/activas), ¿en qué porcentaje
  está **presente** el producto?
  `DN = tiendas con el producto presente / total de tiendas` × 100

- **Disponibilidad (Disp):** de lo que está **presente**, ¿qué porcentaje además tiene
  **stock disponible**?
  `Disp = observaciones con stock > 0 / observaciones presentes` × 100

Ambos deben poder filtrarse por **canal** y por **marca**.

---

## Setup

Necesitás Docker y Node 18+.

```bash
# 1) Base de datos (se crea y se seedea sola la primera vez)
docker compose up -d

# 2) Front
cd app
cp ../.env.example .env.local      # o exportá DATABASE_URL
npm install
npm run dev                        # http://localhost:3000
```

La DB queda en `localhost:5544` (user/pass/db = `challenge` / `challenge` / `retail`).
El esquema y los datos están en `db/`. Mirá la data libremente (psql, DBeaver, lo que uses).

---

## Lo que tenés que hacer

### Básico (lo esperado)
1. **DN y Disp tienen que dar bien.** Revisá las queries de `app/app/api/kpis/route.ts`.
2. **El filtro de Canal tiene que funcionar.**
3. **El filtro de Marca tiene que funcionar.**
4. **Los datos vienen "de campo", con ruido** (como un mirror real: cosas inactivas,
   pruebas de QA, filas inconsistentes). Parte del challenge es **darte cuenta de qué
   hay que excluir o manejar** para que los KPIs sean correctos. No te vamos a decir qué;
   se descubre mirando los datos y los números.

### Extras (si te queda tiempo — elegí 1 o 2, no hace falta todo)
- Un corte o KPI más (ej. **DN por canal**, o **quiebre** = presente pero con stock 0).
- Tests, validación de inputs, manejo de errores, o un endpoint que liste **qué filas se
  excluyeron y por qué** (transparencia del dato).

No hay un "número objetivo" secreto: si tu criterio para tratar un dato es razonable y
está **justificado en el WORKLOG**, lo damos por válido aunque difiera del nuestro.

---

## Entregable
- El código con tus cambios (podés tocar lo que quieras: endpoints, front, queries, hasta
  el esquema si lo justificás).
- **`WORKLOG.md` completo** (es parte de la evaluación tanto como el código): qué
  encontraste, qué cambiaste y **por qué**, qué supuestos tomaste, qué dejarías para después.

## Tiempo
Pensado para **~2-3 horas**. No buscamos que esté "perfecto y completo": queremos ver
cómo investigás, qué notás en los datos, y cómo justificás tus decisiones. Si algo te
parece raro, anotalo en el WORKLOG aunque no lo arregles.

## Stack
Next.js (App Router) + Postgres (`pg`). No hace falta agregar librerías; si lo hacés,
justificá por qué.
