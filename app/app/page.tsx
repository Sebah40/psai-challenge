'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Combobox from './Combobox';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const STOCK_COLORS = ['#16a34a', '#d97706', '#dc2626', '#94a3b8'];

type Kpis = { dn: number | null; disp: number | null; tiendas: number; observaciones: number };
type Marca = { id: number; nombre: string };
type Row = {
  id: number; tienda: string; canal: string; activa: boolean;
  producto: string; marca: string; fecha: string;
  presente: boolean; stock_unidades: number | null; tenant_id: string;
};
type DnCanal = { canal: string; tiendas: number; dn: number };
type StockBreak = { ok: number; bajo: number; quiebre: number; sindato: number };
type Charts = { dnPorCanal: DnCanal[]; stock: StockBreak };

export default function Page() {
  const [canales, setCanales] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [canal, setCanal] = useState('');
  const [marca, setMarca] = useState('');
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('id');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [excluidos, setExcluidos] = useState<Row[]>([]);
  const [modal, setModal] = useState(false);
  const [version, setVersion] = useState(0);
  const [marcaQ, setMarcaQ] = useState('');
  const [marcaQDeb, setMarcaQDeb] = useState('');
  const [canalQ, setCanalQ] = useState('');
  const [canalQDeb, setCanalQDeb] = useState('');
  const cacheRef = useRef<Map<string, { rows: Row[]; total: number }>>(new Map());
  const marcasCacheRef = useRef<Map<string, Marca[]>>(new Map());
  const canalesCacheRef = useRef<Map<string, string[]>>(new Map());
  const [kpisLoading, setKpisLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
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
    setKpisLoading(true);
    setChartsLoading(true);
    fetch('/api/kpis?' + qs.toString())
      .then(r => r.json())
      .then(d => { if (d.error) { setErr(d.error); setKpis(null); } else setKpis(d); })
      .catch(e => setErr(String(e)))
      .finally(() => setKpisLoading(false));
    fetch('/api/observaciones?excluidas=1')
      .then(r => r.json())
      .then(d => setExcluidos(d.rows ?? []))
      .catch(() => setExcluidos([]));
    fetch('/api/charts' + (marca ? '?marca=' + marca : ''))
      .then(r => r.json())
      .then(d => { if (!d.error) setCharts(d); })
      .catch(() => setCharts(null))
      .finally(() => setChartsLoading(false));
  }, [canal, marca, version]);

  // Al cambiar un filtro, el orden o los datos, vuelvo a la primera página.
  useEffect(() => { setPage(1); }, [canal, marca, sort, dir, version]);

  // Ordenar por columna: si es la misma, alterna asc/desc; si es otra, empieza asc.
  const toggleSort = (key: string) => {
    if (sort === key) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setDir('asc'); }
  };

  // Tabla paginada. Cachea por filtros+orden+página para no repetir requests; el
  // cache se invalida al excluir/reincorporar (sube version → se limpia).
  const PAGE_SIZE = 20;
  useEffect(() => {
    const qs = new URLSearchParams();
    if (canal) qs.set('canal', canal);
    if (marca) qs.set('marca', marca);
    qs.set('sort', sort);
    qs.set('dir', dir);
    qs.set('page', String(page));
    qs.set('pageSize', String(PAGE_SIZE));
    const key = qs.toString();

    const cached = cacheRef.current.get(key);
    if (cached) { setRows(cached.rows); setTotal(cached.total); return; }
    setTableLoading(true);
    fetch('/api/observaciones?' + key)
      .then(r => r.json())
      .then(d => {
        const rs = d.rows ?? [];
        cacheRef.current.set(key, { rows: rs, total: d.total ?? 0 });
        setRows(rs);
        setTotal(d.total ?? 0);
      })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setTableLoading(false));
  }, [canal, marca, sort, dir, page, version]);

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

  // Color de la fila según el stock: gris sin dato, rojo agotado/negativo,
  // ámbar bajo, verde sano.
  const stockClass = (s: number | null) => {
    if (s === null) return 'st-null';
    if (s <= 0) return 'st-quiebre';
    if (s <= 5) return 'st-bajo';
    return 'st-ok';
  };

  const dnCanal = charts?.dnPorCanal ?? [];
  const st = charts?.stock;
  const stockTotal = st ? st.ok + st.bajo + st.quiebre + st.sindato : 0;

  return (
    <div className="wrap">
      <header className="hero">
        <div className="badge-brand">Perfect Store</div>
        <h1>Retail KPIs</h1>
        <p className="sub">Disponibilidad y Distribución Numérica por canal y marca.</p>
      </header>

      <div className="filters">
        <Combobox
          label="Canal"
          placeholder="(todos)"
          value={canalQ}
          onChange={setCanalQ}
          options={canales}
          onPick={c => { setCanalQ(c); setCanal(c); }}
        />
        <Combobox
          label="Marca"
          placeholder="(todas)"
          value={marcaQ}
          onChange={setMarcaQ}
          options={marcas.map(m => m.nombre)}
          onPick={name => {
            setMarcaQ(name);
            const m = marcas.find(x => x.nombre === name);
            setMarca(m ? String(m.id) : '');
          }}
        />
      </div>

      {err && <div className="err">Error del endpoint: {err}</div>}

      <div className="cards">
        <div className="card card--primary">
          <div className="name">Distribución Numérica</div>
          <div className="kpi">{kpisLoading ? <span className="skeleton" /> : pct(kpis?.dn)}</div>
          <div className="desc">% de tiendas que tienen el producto</div>
        </div>
        <div className="card card--primary">
          <div className="name">Disponibilidad</div>
          <div className="kpi">{kpisLoading ? <span className="skeleton" /> : pct(kpis?.disp)}</div>
          <div className="desc">% de lo presente que tiene stock</div>
        </div>
        <div className="card">
          <div className="name">Tiendas</div>
          <div className="kpi">{kpisLoading ? <span className="skeleton" /> : (kpis?.tiendas ?? '—')}</div>
          <div className="desc">en el denominador</div>
        </div>
        <div className="card">
          <div className="name">Observaciones</div>
          <div className="kpi">{kpisLoading ? <span className="skeleton" /> : (kpis?.observaciones ?? '—')}</div>
          <div className="desc">consideradas</div>
        </div>
      </div>

      <div className="charts">
        <div className="chart">
          <div className="chartTitle">Distribución Numérica por canal</div>
          <div className="chartBox">
            {chartsLoading ? <div className="spinner" /> : dnCanal.length ? (
              <Bar
                data={{
                  labels: dnCanal.map(c => c.canal),
                  datasets: [{
                    label: 'DN',
                    data: dnCanal.map(c => c.dn),
                    backgroundColor: '#4f46e5',
                    borderRadius: 6,
                    maxBarThickness: 56,
                  }],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => `DN ${(c.raw as number).toFixed(1)}%` } },
                  },
                  scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
                  },
                }}
              />
            ) : <div className="chartEmpty">Sin datos</div>}
          </div>
        </div>

        <div className="chart">
          <div className="chartTitle">Estado de stock (última observación)</div>
          <div className="chartBox">
            {chartsLoading ? <div className="spinner" /> : stockTotal ? (
              <Doughnut
                data={{
                  labels: ['En stock', 'Bajo', 'Agotado', 'Sin dato'],
                  datasets: [{
                    data: [st!.ok, st!.bajo, st!.quiebre, st!.sindato],
                    backgroundColor: STOCK_COLORS,
                    borderColor: '#fff',
                    borderWidth: 2,
                    hoverOffset: 6,
                  }],
                }}
                options={{
                  maintainAspectRatio: false,
                  cutout: '62%',
                  plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, padding: 14 } },
                    tooltip: {
                      callbacks: {
                        label: c => {
                          const v = c.raw as number;
                          return ` ${c.label}: ${v} (${((v / stockTotal) * 100).toFixed(0)}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            ) : <div className="chartEmpty">Sin datos</div>}
          </div>
        </div>
      </div>

      <p className="foot">
        Challenge — los números de arriba no necesariamente están bien. Leé el README.
      </p>

      <div className="tableBar">
        <div>
          <h2 className="tableTitle">Filas consideradas por las queries</h2>
          <span className="tableCount">{total} observaciones</span>
        </div>
        <div className="tableActions">
          <button
            className="btn"
            disabled={sort === 'id' && dir === 'asc'}
            onClick={() => { setSort('id'); setDir('asc'); }}
          >
            ↺ Restaurar orden
          </button>
          <button className="btn" onClick={() => setModal(true)}>
            Excluidos ({excluidos.length})
          </button>
        </div>
      </div>

      <div className="legend">
        <span className="leg st-ok"><i />stock &gt; 5</span>
        <span className="leg st-bajo"><i />stock bajo (1–5)</span>
        <span className="leg st-quiebre"><i />agotado / negativo</span>
        <span className="leg st-null"><i />sin dato</span>
      </div>

      <div className="tableWrap">
        {tableLoading && <div className="tableOverlay"><div className="spinner" /></div>}
        <table className="data">
          <thead>
            <tr>
              {['id','tienda','canal','activa','producto','marca','fecha','presente','stock','tenant'].map(col => (
                <th
                  key={col}
                  className={'sortable' + (sort === col ? ' active' : '')}
                  onClick={() => toggleSort(col)}
                >
                  {col}
                  <span className="arrow">{sort === col ? (dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className={stockClass(r.stock_unidades)}>
                <td className="muted">{r.id}</td>
                <td>{r.tienda}</td>
                <td>{r.canal}</td>
                <td>{r.activa
                  ? <span className="tag tag-on">activa</span>
                  : <span className="tag tag-off">inactiva</span>}</td>
                <td>{r.producto}</td>
                <td>{r.marca}</td>
                <td className="muted">{r.fecha}</td>
                <td>{r.presente
                  ? <span className="tag tag-on">sí</span>
                  : <span className="tag tag-off">no</span>}</td>
                <td><span className="stockPill">{r.stock_unidades ?? 'NULL'}</span></td>
                <td className="muted">{r.tenant_id}</td>
                <td><button className="btn btn-ghost" onClick={() => excluirFila(r)}>Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="pager">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Anterior
          </button>
          <span className="pagerInfo">
            Página {page} de {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            className="btn"
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

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
                    <tr key={r.id} className={stockClass(r.stock_unidades)}>
                      <td className="muted">{r.id}</td>
                      <td>{r.tienda}</td>
                      <td>{r.producto}</td>
                      <td className="muted">{r.fecha}</td>
                      <td>{r.presente
                        ? <span className="tag tag-on">sí</span>
                        : <span className="tag tag-off">no</span>}</td>
                      <td><span className="stockPill">{r.stock_unidades ?? 'NULL'}</span></td>
                      <td><button className="btn btn-ghost" onClick={() => quitarExclusion(r.id)}>Quitar</button></td>
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
