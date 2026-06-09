import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

// Requiere la app y la DB corriendo con el seed original.
// Las exclusiones manuales no se tienen en cuenta durante los tests: el before()
// las reincorpora para medir siempre contra el mismo estado y el after() las
// vuelve a dejar como estaban.
// Correr con: npm test (desde app/)
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

let excluidasPrevias = [];

async function getKpis(qs = '') {
  const res = await fetch(`${BASE}/api/kpis${qs ? '?' + qs : ''}`);
  assert.equal(res.status, 200);
  return res.json();
}

async function setExcluida(id, excluida) {
  const res = await fetch(`${BASE}/api/observaciones`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, excluida }),
  });
  assert.equal(res.status, 200);
}

const aprox = (real, esperado) =>
  assert.ok(Math.abs(real - esperado) < 0.01, `esperaba ${esperado}, dio ${real}`);

before(async () => {
  const res = await fetch(`${BASE}/api/observaciones?excluidas=1`);
  const { rows } = await res.json();
  excluidasPrevias = rows.map(r => r.id);
  for (const id of excluidasPrevias) await setExcluida(id, false);
});

after(async () => {
  for (const id of excluidasPrevias) await setExcluida(id, true);
});

test('general: tenant contoso, estado actual', async () => {
  const kpi = await getKpis();
  // 10 tiendas de contoso (quedan afuera las 2 de acme)
  assert.equal(kpi.tiendas, 10);
  // 31 observaciones presentes: 38 de contoso menos 2 huerfanas (tienda/producto
  // inexistente), menos 3 revisitas viejas pisadas por una mas nueva, menos 2 con
  // presente = false
  assert.equal(kpi.observaciones, 31);
  // las 10 tiendas tienen al menos un producto presente
  assert.equal(kpi.dn, 100);
  // con stock > 0: 26 de 31 (3 con stock 0, 1 con stock -2, 1 con NULL)
  aprox(kpi.disp, (26 / 31) * 100);
});

test('marca=3 Goicoechea: estado actual por fecha', async () => {
  const kpi = await getKpis('marca=3');
  // presente en 5 tiendas de 10. Soriana NO cuenta: su ultima observacion
  // (2026-05-15) dice presente = false, aunque la del 05-13 decia true
  assert.equal(kpi.dn, 50);
  // de las 5 presentes, 3 con stock > 0 (dos estan en 0)
  assert.equal(kpi.disp, 60);
  assert.equal(kpi.observaciones, 5);
});

test('marca=2 Suerox: stock negativo no cuenta como disponible', async () => {
  const kpi = await getKpis('marca=2');
  // presente en 6 tiendas de 10
  assert.equal(kpi.dn, 60);
  // 10 observaciones presentes, 8 con stock > 0: el stock -2 (Walmart Norte)
  // y el stock 0 (Walmart Centro) no cuentan
  assert.equal(kpi.observaciones, 10);
  assert.equal(kpi.disp, 80);
});

test('canal=farmacias: el denominador respeta el canal', async () => {
  const kpi = await getKpis('canal=farmacias');
  // 2 farmacias en el universo, no 10
  assert.equal(kpi.tiendas, 2);
  assert.equal(kpi.dn, 100);
  // 6 observaciones presentes, 4 con stock > 0 (una en 0 y una NULL)
  assert.equal(kpi.observaciones, 6);
  aprox(kpi.disp, (4 / 6) * 100);
});

test('canal: el casing no separa tiendas', async () => {
  const a = await getKpis('canal=autoservicios');
  const b = await getKpis('canal=AUTOSERVICIOS');
  // 6 tiendas de autoservicios sin importar el casing del parametro
  assert.equal(a.tiendas, 6);
  assert.deepEqual(a, b);
});

test('exclusion manual: al excluir resurge la observacion anterior', async () => {
  // excluyo la obs 35 (Soriana + Goicoechea, presente=false del 05-15):
  // la del 05-13 (presente=true) vuelve a ser el estado actual
  await setExcluida(35, true);
  const conExclusion = await getKpis('marca=3');
  assert.equal(conExclusion.dn, 60);
  // reincorporo y vuelve el valor original
  await setExcluida(35, false);
  const sinExclusion = await getKpis('marca=3');
  assert.equal(sinExclusion.dn, 50);
});
