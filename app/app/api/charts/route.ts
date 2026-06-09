import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Agregados para los charts, sobre el estado actual y el universo limpio
// (tenant contoso, tiendas activas, sin la de QA, sin excluidas). Acepta ?marca.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marca = searchParams.get('marca');
    const tenant = 'contoso';

    const params: any[] = [tenant];
    let marcaCond = '';
    if (marca) {
      params.push(marca);
      marcaCond = ` AND m.id = $${params.length}`;
    }

    // DN por canal: tiendas con el producto presente / total de tiendas del canal.
    const dnPorCanal = await query<{ canal: string; tiendas: string; con: string }>(
      `WITH ultimas AS (
         SELECT DISTINCT ON (tienda_id, producto_id) *
         FROM observaciones
         WHERE tenant_id = $1 AND NOT excluida
         ORDER BY tienda_id, producto_id, fecha DESC, id DESC
       ),
       presentes AS (
         SELECT DISTINCT u.tienda_id
         FROM ultimas u
         JOIN productos p ON p.id = u.producto_id
         JOIN marcas m    ON m.id = p.marca_id
         WHERE u.presente = true${marcaCond}
       )
       SELECT lower(t.canal) AS canal,
              count(*) AS tiendas,
              count(*) FILTER (WHERE pr.tienda_id IS NOT NULL) AS con
         FROM tiendas t
         LEFT JOIN presentes pr ON pr.tienda_id = t.id
        WHERE t.tenant_id = $1 AND t.activa = true AND t.id <> 10
        GROUP BY lower(t.canal)
        ORDER BY canal`,
      params
    );

    // Estado de stock del estado actual (solo presentes).
    const stockRows = await query<{ ok: string; bajo: string; quiebre: string; sindato: string }>(
      `WITH ultimas AS (
         SELECT DISTINCT ON (tienda_id, producto_id) *
         FROM observaciones
         WHERE tenant_id = $1 AND NOT excluida
         ORDER BY tienda_id, producto_id, fecha DESC, id DESC
       )
       SELECT
         count(*) FILTER (WHERE o.stock_unidades > 5)              AS ok,
         count(*) FILTER (WHERE o.stock_unidades BETWEEN 1 AND 5)  AS bajo,
         count(*) FILTER (WHERE o.stock_unidades <= 0)             AS quiebre,
         count(*) FILTER (WHERE o.stock_unidades IS NULL)          AS sindato
       FROM ultimas o
       JOIN tiendas t   ON t.id = o.tienda_id
       JOIN productos p ON p.id = o.producto_id
       JOIN marcas m    ON m.id = p.marca_id
      WHERE o.tenant_id = $1 AND t.activa = true AND t.id <> 10 AND o.presente = true${marcaCond}`,
      params
    );

    const s = stockRows[0] ?? { ok: '0', bajo: '0', quiebre: '0', sindato: '0' };

    return NextResponse.json({
      dnPorCanal: dnPorCanal.map(r => ({
        canal: r.canal,
        tiendas: Number(r.tiendas),
        dn: Number(r.tiendas) ? (Number(r.con) / Number(r.tiendas)) * 100 : 0,
      })),
      stock: {
        ok: Number(s.ok),
        bajo: Number(s.bajo),
        quiebre: Number(s.quiebre),
        sindato: Number(s.sindato),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
