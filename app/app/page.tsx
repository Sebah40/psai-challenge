'use client';
import { useEffect, useRef, useState } from 'react';

type Kpis = { dn: number | null; disp: number | null; tiendas: number; observaciones: number };
type Marca = { id: number; nombre: string };
type Row = {
  id: number; tienda: string; canal: string; activa: boolean;
  producto: string; marca: string; fecha: string;
  presente: boolean; stock_unidades: number | null; tenant_id: string;
};

export default function Page() {
  const [canales, setCanales] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [canal, setCanal] = useState('');
  const [marca, setMarca] = useState('');
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [excluidos, setExcluidos] = useState<Row[]>([]);
  const [modal, setModal] = useState(false);
  const [version, setVersion] = useState(0);
  const [marcaQ, setMarcaQ] = useState('');
  const [marcaQDeb, setMarcaQDeb] = useState('');
  const [canalQ, setCanalQ] = useState('');
  const [canalQDeb, setCanalQDeb] = useState('');
  const cacheRef = useRef<Map<string, Row[]>>(new Map());
  const marcasCacheRef = useRef<Map<string, Marca[]>>(new Map());
  const canalesCacheRef = useRef<Map<string, string[]>>(new Map());
  const [err, setErr] = useState('');

  // Debounce: las búsquedas recién disparan 300ms después de la última tecla.
  useEffect(() => {
    const t = setTimeout(() => setMarcaQDeb(marcaQ.trim()), 300);
    return () => clearTimeout(t);
  }, [marcaQ]);
  useEffect(() => {
    const t = setTimeout(() => setCanalQDeb(canalQ.trim()), 300);
    return () => clearTimeout(t);
  }, [canalQ]);

  // Sugerencias de marca y canal, con cache por búsqueda (el server matchea
  // sin acentos ni mayúsculas).
  useEffect(() => {
    const key = marcaQDeb;
    const cached = marcasCacheRef.current.get(key);
    if (cached) { setMarcas(cached); return; }
    fetch('/api/filters' + (key ? '?q=' + encodeURIComponent(key) : ''))
      .then(r => r.json())
      .then(d => { const ms = d.marcas ?? []; marcasCacheRef.current.set(key, ms); setMarcas(ms); })
      .catch(() => {});
  }, [marcaQDeb]);
  useEffect(() => {
    const key = canalQDeb;
    const cached = canalesCacheRef.current.get(key);
    if (cached) { setCanales(cached); return; }
    fetch('/api/filters' + (key ? '?q=' + encodeURIComponent(key) : ''))
      .then(r => r.json())
      .then(d => { const cs = d.canales ?? []; canalesCacheRef.current.set(key, cs); setCanales(cs); })
      .catch(() => {});
  }, [canalQDeb]);

  // El filtro aplicado a los KPIs: el texto tiene que coincidir con una opción
  // (sin importar mayúsculas ni acentos); vacío o sin match = todas/todos.
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  useEffect(() => {
    if (!marcaQDeb) { setMarca(''); return; }
    const m = marcas.find(x => norm(x.nombre) === norm(marcaQDeb));
    setMarca(m ? String(m.id) : '');
  }, [marcaQDeb, marcas]);
  useEffect(() => {
    if (!canalQDeb) { setCanal(''); return; }
    const c = canales.find(x => norm(x) === norm(canalQDeb));
    setCanal(c ?? '');
  }, [canalQDeb, canales]);


  useEffect(() => {
    const qs = new URLSearchParams();
    if (canal) qs.set('canal', canal);
    if (marca) qs.set('marca', marca);
    setErr('');
    fetch('/api/kpis?' + qs.toString())
      .then(r => r.json())
      .then(d => { if (d.error) { setErr(d.error); setKpis(null); } else setKpis(d); })
      .catch(e => setErr(String(e)));
    fetch('/api/observaciones?excluidas=1')
      .then(r => r.json())
      .then(d => setExcluidos(d.rows ?? []))
      .catch(() => setExcluidos([]));
  }, [canal, marca, version]);

  // Tabla: misma consulta con búsqueda opcional. Cachea por query string para no
  // repetir requests; el cache se invalida al excluir/reincorporar.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (canal) qs.set('canal', canal);
    if (marca) qs.set('marca', marca);
    const key = qs.toString();

    const cached = cacheRef.current.get(key);
    if (cached) { setRows(cached); return; }
    fetch('/api/observaciones?' + key)
      .then(r => r.json())
      .then(d => { const rs = d.rows ?? []; cacheRef.current.set(key, rs); setRows(rs); })
      .catch(() => setRows([]));
  }, [canal, marca, version]);

  const setExcluida = (id: number, excluida: boolean) =>
    fetch('/api/observaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, excluida }),
    }).then(() => {
      cacheRef.current.clear();
      setVersion(v => v + 1);
    });

  const excluirFila = (r: Row) => setExcluida(r.id, true);
  const quitarExclusion = (id: number) => setExcluida(id, false);

  const pct = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : v.toFixed(1) + '%';

  return (
    <div className="wrap">
      <h1>Retail KPIs — Perfect Store</h1>
      <p className="sub">Disponibilidad y Distribución Numérica por canal y marca.</p>

      <div className="filters">
        <label>
          Canal
          <input
            list="canales-list"
            placeholder="(todos)"
            value={canalQ}
            onChange={e => setCanalQ(e.target.value)}
          />
          <datalist id="canales-list">
            {canales.map(c => <option key={c} value={c} />)}
          </datalist>
        </label>
        <label>
          Marca
          <input
            list="marcas-list"
            placeholder="(todas)"
            value={marcaQ}
            onChange={e => setMarcaQ(e.target.value)}
          />
          <datalist id="marcas-list">
            {marcas.map(m => <option key={m.id} value={m.nombre} />)}
          </datalist>
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

      <div className="tableBar">
        <h2 className="tableTitle">Filas consideradas por las queries ({rows.length})</h2>
        <button className="btn" onClick={() => setModal(true)}>
          Excluidos ({excluidos.length})
        </button>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>id</th><th>tienda</th><th>canal</th><th>activa</th><th>producto</th>
            <th>marca</th><th>fecha</th><th>presente</th><th>stock</th><th>tenant</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.tienda}</td>
              <td>{r.canal}</td>
              <td>{r.activa ? 'sí' : 'no'}</td>
              <td>{r.producto}</td>
              <td>{r.marca}</td>
              <td>{r.fecha}</td>
              <td>{r.presente ? 'sí' : 'no'}</td>
              <td>{r.stock_unidades ?? 'NULL'}</td>
              <td>{r.tenant_id}</td>
              <td><button className="btn" onClick={() => excluirFila(r)}>Excluir</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="modalOverlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modalHead">
              <h2 className="tableTitle">Observaciones excluidas ({excluidos.length})</h2>
              <button className="btn" onClick={() => setModal(false)}>Cerrar</button>
            </div>
            {excluidos.length === 0 ? (
              <p className="sub">No hay observaciones excluidas.</p>
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>id</th><th>tienda</th><th>producto</th><th>fecha</th>
                    <th>presente</th><th>stock</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {excluidos.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.tienda}</td>
                      <td>{r.producto}</td>
                      <td>{r.fecha}</td>
                      <td>{r.presente ? 'sí' : 'no'}</td>
                      <td>{r.stock_unidades ?? 'NULL'}</td>
                      <td><button className="btn" onClick={() => quitarExclusion(r.id)}>Quitar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
