import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Filas que los KPIs están considerando (mismos filtros que /api/kpis).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canal = searchParams.get('canal');
    const marca = searchParams.get('marca');
    const tenant = 'contoso';
    const conds: string[] = ['o.tenant_id = $1'];
    const params: any[] = [tenant];

    if (canal) {
      params.push(canal);
      conds.push(`lower(t.canal) = lower($${params.length})`);
    }
    if (marca) {
      params.push(marca);
      conds.push(`m.id = $${params.length}`);
    }

    const rows = await query(
      `WITH ultimas AS (
         SELECT DISTINCT ON (tienda_id, producto_id) *
         FROM observaciones
         WHERE tenant_id = $1
         ORDER BY tienda_id, producto_id, fecha DESC, id DESC
       )
       SELECT o.id, t.nombre AS tienda, t.canal, t.activa,
              p.nombre AS producto, m.nombre AS marca,
              to_char(o.fecha, 'YYYY-MM-DD') AS fecha,
              o.presente, o.stock_unidades, o.tenant_id
         FROM ultimas o
         JOIN tiendas t   ON t.id = o.tienda_id
         JOIN productos p ON p.id = o.producto_id
         JOIN marcas m    ON m.id = p.marca_id
        WHERE ${conds.join(' AND ')}
        ORDER BY o.id`,
      params
    );
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
