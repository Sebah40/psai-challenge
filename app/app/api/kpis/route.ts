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

    const conds: string[] = [];
    const params: any[] = [];

    if (canal) {
      params.push(canal);
      conds.push(`lower(t.canal) = lower($${params.length})`);
    }
    if (marca) {
      params.push(marca);
      conds.push(`m.nombre = $${params.length}`);
    }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    // --- Distribución Numérica ---
    const dnRows = await query<{ con: string; total: string }>(
      `SELECT
         (SELECT count(DISTINCT o.tienda_id)
            FROM observaciones o
            JOIN tiendas t   ON t.id = o.tienda_id
            JOIN productos p ON p.id = o.producto_id
            JOIN marcas m    ON m.id = p.marca_id
            ${where ? where + ' AND' : 'WHERE'} o.presente = true) AS con,
         (SELECT count(*) FROM tiendas) AS total`,
      params
    );

    // --- Disponibilidad ---
    const dispRows = await query<{ con_stock: string; presentes: string }>(
      `SELECT
         count(*) FILTER (WHERE o.stock_unidades <> 0) AS con_stock,
         count(*) FILTER (WHERE o.presente = true)     AS presentes
       FROM observaciones o
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
