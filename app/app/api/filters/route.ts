import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Opciones para los dropdowns de la UI.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const tenant = 'contoso';
    // Busqueda insensible a mayusculas (ILIKE) y acentos (unaccent), con % y _
    // escapados para que no se inyecten wildcards. Filtra canales y marcas.
    const patron = q ? '%' + q.replace(/[\\%_]/g, '\\$&') + '%' : null;

    const canales = await query<{ canal: string }>(
      patron
        ? 'SELECT DISTINCT lower(canal) AS canal FROM tiendas WHERE tenant_id = $1 AND unaccent(canal) ILIKE unaccent($2) ORDER BY canal'
        : 'SELECT DISTINCT lower(canal) AS canal FROM tiendas WHERE tenant_id = $1 ORDER BY canal',
      patron ? [tenant, patron] : [tenant]
    );
    const marcas = await query<{ id: number; nombre: string }>(
      patron
        ? 'SELECT id, nombre FROM marcas WHERE unaccent(nombre) ILIKE unaccent($1) ORDER BY nombre'
        : 'SELECT id, nombre FROM marcas ORDER BY nombre',
      patron ? [patron] : []
    );
    return NextResponse.json({
      canales: canales.map(c => c.canal),
      marcas,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
