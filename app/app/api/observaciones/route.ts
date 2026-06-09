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

    // tienda 10 = PRUEBA QA, dato de prueba conocido del mirror; en produccion
    // seria un flag en la fuente, no un id hardcodeado
    const conds: string[] = ['o.tenant_id = $1', 't.activa = true', 't.id <> 10'];
    const params: any[] = [tenant];

    if (canal) {
      params.push(canal);
      conds.push(`lower(t.canal) = lower($${params.length})`);
    }
    if (marca) {
      params.push(marca);
      conds.push(`m.id = $${params.length}`);
    }

    // Ordenamiento: los nombres de columna no se pueden parametrizar, asi que
    // mapeamos la clave del cliente a una expresion segura (whitelist). Cualquier
    // valor desconocido cae a o.id. El secundario por o.id hace la pagina determinista.
    const sortMap: Record<string, string> = {
      id: 'o.id', tienda: 't.nombre', canal: 't.canal', activa: 't.activa',
      producto: 'p.nombre', marca: 'm.nombre', fecha: 'o.fecha',
      presente: 'o.presente', stock: 'o.stock_unidades', tenant: 'o.tenant_id',
    };
    const sortCol = sortMap[searchParams.get('sort') ?? ''] ?? 'o.id';
    const dir = searchParams.get('dir') === 'desc' ? 'DESC' : 'ASC';

    // Paginacion: limita filas en la DB (no traemos miles de una) y devolvemos
    // el total con count(*) OVER() en la misma query, sin un round-trip extra.
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '20', 10) || 20, 1), 100);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
    params.push(pageSize);
    const limitParam = params.length;
    params.push((page - 1) * pageSize);
    const offsetParam = params.length;

    const rows = await query(
      `WITH ultimas AS (
         SELECT DISTINCT ON (tienda_id, producto_id) *
         FROM observaciones
         WHERE tenant_id = $1 AND NOT excluida
         ORDER BY tienda_id, producto_id, fecha DESC, id DESC
       )
       SELECT ${cols}, count(*) OVER() AS total
         FROM ultimas o
         JOIN tiendas t   ON t.id = o.tienda_id
         JOIN productos p ON p.id = o.producto_id
         JOIN marcas m    ON m.id = p.marca_id
        WHERE ${conds.join(' AND ')}
        ORDER BY ${sortCol} ${dir} NULLS LAST, o.id
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );
    const total = rows.length ? Number(rows[0].total) : 0;
    return NextResponse.json({ rows, total, page, pageSize });
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
