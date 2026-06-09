import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Filas que los KPIs están considerando (mismos filtros que /api/kpis).
// Con ?excluidas=1 devuelve en cambio las observaciones excluidas manualmente.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canal = searchParams.get('canal');
    const marca = searchParams.get('marca');
    const excluidas = searchParams.get('excluidas');
    const tenant = 'contoso';

    const cols = `o.id, t.nombre AS tienda, t.canal, t.activa,
              p.nombre AS producto, m.nombre AS marca,
              to_char(o.fecha, 'YYYY-MM-DD') AS fecha,
              o.presente, o.stock_unidades, o.tenant_id`;

    if (excluidas) {
      const rows = await query(
        `SELECT ${cols}
           FROM observaciones o
           JOIN tiendas t   ON t.id = o.tienda_id
           JOIN productos p ON p.id = o.producto_id
           JOIN marcas m    ON m.id = p.marca_id
          WHERE o.tenant_id = $1 AND o.excluida
          ORDER BY o.id`,
        [tenant]
      );
      return NextResponse.json({ rows });
    }

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
         WHERE tenant_id = $1 AND NOT excluida
         ORDER BY tienda_id, producto_id, fecha DESC, id DESC
       )
       SELECT ${cols}
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

// Marca o desmarca una observación como excluida del KPI.
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    const excluida = Boolean(body?.excluida);
    const tenant = 'contoso';

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const rows = await query(
      'UPDATE observaciones SET excluida = $2 WHERE id = $1 AND tenant_id = $3 RETURNING id, excluida',
      [id, excluida, tenant]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'observación no encontrada' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
