import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Opciones para los dropdowns de la UI.
export async function GET() {
  try {
    const tenant = 'contoso';
    const canales = await query<{ canal: string }>(
      'SELECT DISTINCT lower(canal) AS canal FROM tiendas WHERE tenant_id = $1 ORDER BY canal',
      [tenant]
    );
    const marcas = await query<{ id: number; nombre: string }>(
      'SELECT id, nombre FROM marcas ORDER BY nombre'
    );
    return NextResponse.json({
      canales: canales.map(c => c.canal),
      marcas,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
