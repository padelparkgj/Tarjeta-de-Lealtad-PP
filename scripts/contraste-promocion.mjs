// ─────────────────────────────────────────────────────────────
// Contraste: el ciclo de visitas de regla-visitas.js contra promocion_de de la base
// ─────────────────────────────────────────────────────────────
//
//   node scripts/contraste-promocion.mjs              todos los socios, los dos lados
//   node scripts/contraste-promocion.mjs --falsear    el lado JS con un ciclo de 6: TIENE que salir rojo
//   node scripts/contraste-promocion.mjs --vacia      la lista de socios vacía: TIENE que salir rojo
//
// Se escribió el 5 de octubre de 2026, antes de borrar regla-visitas.js, para saber si la copia
// del navegador y la función de la base decían lo mismo. Solo lee: ninguna escritura.
//
// · El lado JS es lo que hacían las pantallas: contar en la base las visitas desde
//   members.vinculado_en (lo mismo que PPSb.contarVisitas) y pasar ese número por
//   reglaVisitas / premioDeVisita. El código de la regla NO va copiado aquí: se lee de git, del
//   último commit que tuvo el archivo (REGLA_REV), y se ejecuta tal cual. Así el contraste sigue
//   midiendo aquella copia aunque el archivo ya no exista.
// · El lado base es promocion_de(p_member_id), con la cuenta de personal (personal consulta a
//   cualquier socio; un socio, solo la suya).
// · Credenciales: .env.controles del repo del POS. No se imprimen.
//
// ⚠️ Con menos de MINIMO socios, o sin ninguna visita que cuente, NO pasa: un contraste sobre
// nada no mide nada.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_POS = 'C:/Users/lefie/app padel park/.env.controles';
const REGLA_REV = '8e3efbe';   // v3.3, el último commit con regla-visitas.js
const MINIMO = 10;              // hay 12 socios el 5 de octubre de 2026
const FALSEAR = process.argv.includes('--falsear');
const VACIA = process.argv.includes('--vacia');

// ── La regla del navegador, leída de git y ejecutada como en la página ──
let fuente = execFileSync('git', ['show', `${REGLA_REV}:regla-visitas.js`], { cwd: RAIZ, encoding: 'utf8' });
if (FALSEAR) {
  if (!fuente.includes('const CICLO = 7;')) throw new Error('--falsear: no encuentro «const CICLO = 7;» en la regla');
  fuente = fuente.replace('const CICLO = 7;', 'const CICLO = 6;');
}
const ventana = {};
vm.runInNewContext(fuente, { window: ventana });
const R = ventana.PPRegla;

// ── La base ──
const env = Object.fromEntries(fs.readFileSync(ENV_POS, 'utf8').split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const cfg = fs.readFileSync(path.join(RAIZ, 'config.js'), 'utf8');
const URL_ = cfg.match(/supabaseUrl:\s*"([^"]+)"/)[1];
const KEY = cfg.match(/supabaseKey:\s*"([^"]+)"/)[1];
const login = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: KEY, 'content-type': 'application/json' },
  body: JSON.stringify({ email: env.PP_PERSONAL_EMAIL, password: env.PP_PERSONAL_PASSWORD }),
});
const sesion = await login.json();
if (!sesion.access_token) { console.log(`\n  NO MEDIDO — no se pudo entrar con la cuenta de personal (${login.status})\n`); process.exit(2); }
const H = { apikey: KEY, authorization: `Bearer ${sesion.access_token}`, 'content-type': 'application/json' };
async function leer(ruta, extra = {}) {
  const r = await fetch(`${URL_}/rest/v1/${ruta}`, { headers: { ...H, ...extra } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
  return r;
}
// Como contarVisitas: count exacto, sin traer filas.
async function contar(memberId, desde) {
  const filtro = desde ? `&visited_at=gte.${encodeURIComponent(desde)}` : '';
  const r = await leer(`visits?select=id&member_id=eq.${encodeURIComponent(memberId)}${filtro}`, { Prefer: 'count=exact', Range: '0-0' });
  const total = Number((r.headers.get('content-range') || '').split('/')[1]);
  if (!Number.isFinite(total)) throw new Error(`sin conteo para ${memberId}`);
  return total;
}

let socios = await (await leer('members?select=member_id,vinculado_en&order=member_id')).json();
if (VACIA) socios = [];

// 'free' en el navegador, 'gratis' en la base: el mismo premio con dos nombres.
const premio = p => (p === 'free' ? 'gratis' : p ?? null);

function ladoJs(cuentan) {
  if (cuentan === null) return { participa: false };
  const s = R.reglaVisitas(cuentan);
  const hasta = Math.min(s.hastaSilver, s.hastaGratis);
  return {
    participa: true,
    visitas_cuentan: cuentan,
    hechas: s.enCiclo,
    siguiente: { numero: s.visita, posicion: s.posicion, premio: premio(s.premio) },
    proxima: { numero: cuentan + hasta, premio: premio(R.reglaVisitas(cuentan + hasta - 1).premio) },
    premios: Array.from({ length: cuentan }, (_, i) => premio(R.premioDeVisita(i + 1))),
  };
}
function ladoBase(j) {
  if (!j.participa) return { participa: false };
  return {
    participa: true,
    visitas_cuentan: j.visitas_cuentan,
    hechas: j.ciclo_actual.hechas,
    siguiente: { numero: j.siguiente.numero, posicion: j.siguiente.posicion, premio: j.siguiente.premio ?? null },
    proxima: j.proxima_con_premio ? { numero: j.proxima_con_premio.numero, premio: j.proxima_con_premio.premio } : null,
    premios: [...j.visitas].sort((a, b) => a.numero - b.numero).map(v => v.premio ?? null),
  };
}
const corto = o => !o.participa ? 'no participa'
  : `${o.visitas_cuentan} cuentan · ${o.hechas} en el ciclo · siguiente ${o.siguiente.numero}.ª (pos ${o.siguiente.posicion}, ${o.siguiente.premio ?? 'normal'})`
    + ` · próxima con premio ${o.proxima ? `${o.proxima.numero}.ª ${o.proxima.premio}` : '—'} · premios [${o.premios.map(p => p ?? '·').join(',')}]`;

console.log(`\n  El ciclo de visitas: regla-visitas.js (${REGLA_REV}${FALSEAR ? ', FALSEADO: ciclo de 6' : ''}) contra promocion_de`);
console.log('  ──────────────────────────────────────────────────────────────────────');
const filas = [];
let conVisitas = 0;
for (const s of socios) {
  const total = await contar(s.member_id, null);
  const cuentan = s.vinculado_en ? await contar(s.member_id, s.vinculado_en) : null;
  const r = await fetch(`${URL_}/rest/v1/rpc/promocion_de`, { method: 'POST', headers: H, body: JSON.stringify({ p_member_id: s.member_id }) });
  const j = await r.json();
  if (!r.ok) { filas.push({ id: s.member_id, ok: false, js: '—', base: `${r.status} ${j.code} ${j.message}` }); continue; }
  const js = ladoJs(cuentan), base = ladoBase(j);
  if (base.participa && base.visitas_cuentan > 0) conVisitas++;
  const ok = JSON.stringify(js) === JSON.stringify(base);
  filas.push({ id: s.member_id, ok, total, js: corto(js), base: corto(base) });
}
for (const f of filas) {
  console.log(`  ${f.ok ? 'OK   ' : 'FALLA'} ${f.id}  (${f.total ?? '?'} visitas en total)`);
  if (!f.ok) { console.log(`        js:   ${f.js}`); console.log(`        base: ${f.base}`); }
  else console.log(`        ${f.base}`);
}
const coinciden = filas.filter(f => f.ok).length;
console.log(`\n  ${filas.length} socio(s) comparados · ${coinciden} coinciden · ${filas.length - coinciden} difieren · ${conVisitas} con visitas que cuentan`);
if (filas.length < MINIMO) { console.log(`  ✗ menos de ${MINIMO} socios: un contraste sobre ${filas.length} no mide nada.\n`); process.exit(1); }
if (conVisitas === 0) { console.log('  ✗ ningún socio con visitas que cuenten: los dos lados coincidirían en cero sin medir el ciclo.\n'); process.exit(1); }
if (coinciden !== filas.length) { console.log('  ✗ los dos lados no dicen lo mismo.\n'); process.exit(1); }
console.log('  ✓ los dos lados dicen lo mismo para todos.\n');
