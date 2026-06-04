'use client';
import { useEffect, useState } from 'react';

type Kpis = { dn: number | null; disp: number | null; tiendas: number; observaciones: number };
type Marca = { id: number; nombre: string };

export default function Page() {
  const [canales, setCanales] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [canal, setCanal] = useState('');
  const [marca, setMarca] = useState('');
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/filters')
      .then(r => r.json())
      .then(d => { setCanales(d.canales ?? []); setMarcas(d.marcas ?? []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (canal) qs.set('canal', canal);
    if (marca) qs.set('marca', marca);
    setErr('');
    fetch('/api/kpis?' + qs.toString())
      .then(r => r.json())
      .then(d => { if (d.error) { setErr(d.error); setKpis(null); } else setKpis(d); })
      .catch(e => setErr(String(e)));
  }, [canal, marca]);

  const pct = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : v.toFixed(1) + '%';

  return (
    <div className="wrap">
      <h1>Retail KPIs — Perfect Store</h1>
      <p className="sub">Disponibilidad y Distribución Numérica por canal y marca.</p>

      <div className="filters">
        <label>
          Canal
          <select value={canal} onChange={e => setCanal(e.target.value)}>
            <option value="">(todos)</option>
            {canales.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Marca
          <select value={marca} onChange={e => setMarca(e.target.value)}>
            <option value="">(todas)</option>
            {marcas.map(m => <option key={m.id} value={String(m.id)}>{m.nombre}</option>)}
          </select>
        </label>
      </div>

      {err && <div className="err">Error del endpoint: {err}</div>}

      <div className="cards">
        <div className="card">
          <div className="name">Distribución Numérica</div>
          <div className="kpi">{pct(kpis?.dn)}</div>
          <div className="desc">% de tiendas que tienen el producto</div>
        </div>
        <div className="card">
          <div className="name">Disponibilidad</div>
          <div className="kpi">{pct(kpis?.disp)}</div>
          <div className="desc">% de lo presente que tiene stock</div>
        </div>
        <div className="card">
          <div className="name">Tiendas</div>
          <div className="kpi">{kpis?.tiendas ?? '—'}</div>
          <div className="desc">en el denominador</div>
        </div>
        <div className="card">
          <div className="name">Observaciones</div>
          <div className="kpi">{kpis?.observaciones ?? '—'}</div>
          <div className="desc">consideradas</div>
        </div>
      </div>

      <p className="foot">
        Challenge — los números de arriba no necesariamente están bien. Leé el README.
      </p>
    </div>
  );
}
