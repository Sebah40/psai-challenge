import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// KPIs de Perfect Store:
//   - Distribución Numérica (DN): % de tiendas que tienen el producto.
//   - Disponibilidad (Disp): % de lo que está presente que además tiene stock.
//
// Acepta filtros opcionales: ?canal=<canal>&marca=<marcaId>
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canal = searchParams.get('canal');
    const marca = searchParams.get('marca');
    const tenant = 'contoso';
    // tienda 10 = PRUEBA QA, dato de prueba conocido del mirror; en produccion
    // seria un flag en la fuente, no un id hardcodeado
    const conds: string[] = ['o.tenant_id = $1', 't.activa = true', 't.id <> 10'];
    const tiendasConds: string[] = ['tenant_id = $1', 'activa = true', 'id <> 10'];
    const params: any[] = [tenant];

    if (canal) {
      params.push(canal);
      conds.push(`lower(t.canal) = lower($${params.length})`);
      tiendasConds.push(`lower(canal) = lower($${params.length})`);
    }
    if (marca) {
      params.push(marca);
      conds.push(`m.id = $${params.length}`);
    }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    // La exclusión corre antes del DISTINCT ON: si se excluye una observación,
    // la anterior de esa tienda+producto vuelve a ser el estado actual.
    const cteWhere = 'WHERE tenant_id = $1 AND NOT excluida';

    // --- Distribución Numérica ---
    const dnRows = await query<{ con: string; total: string }>(
      `WITH ultimas AS (
     SELECT DISTINCT ON (tienda_id, producto_id) *
     FROM observaciones
     ${cteWhere}
     ORDER BY tienda_id, producto_id, fecha DESC, id DESC
   )
   SELECT
     (SELECT count(DISTINCT o.tienda_id)
        FROM ultimas o
        JOIN tiendas t   ON t.id = o.tienda_id
        JOIN productos p ON p.id = o.producto_id
        JOIN marcas m    ON m.id = p.marca_id
        ${where ? where + ' AND' : 'WHERE'} o.presente = true) AS con,
     (SELECT count(*) FROM tiendas WHERE ${tiendasConds.join(' AND ')}) AS total`,
      params
    );

    // --- Disponibilidad ---
    const dispRows = await query<{ con_stock: string; presentes: string }>(
      `WITH ultimas AS (
     SELECT DISTINCT ON (tienda_id, producto_id) *
     FROM observaciones
     ${cteWhere}
     ORDER BY tienda_id, producto_id, fecha DESC, id DESC
   )
   SELECT
     count(*) FILTER (WHERE o.presente = true AND o.stock_unidades > 0) AS con_stock,
     count(*) FILTER (WHERE o.presente = true)     AS presentes
   FROM ultimas o
   JOIN tiendas t   ON t.id = o.tienda_id
   JOIN productos p ON p.id = o.producto_id
   JOIN marcas m    ON m.id = p.marca_id
   ${where}`,
      params
    );

    const con = Number(dnRows[0]?.con ?? 0);
    const total = Number(dnRows[0]?.total ?? 0);
    const conStock = Number(dispRows[0]?.con_stock ?? 0);
    const presentes = Number(dispRows[0]?.presentes ?? 0);

    return NextResponse.json({
      dn: total ? (con / total) * 100 : null,
      disp: presentes ? (conStock / presentes) * 100 : null,
      tiendas: total,
      observaciones: presentes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
