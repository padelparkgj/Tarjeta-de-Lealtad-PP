# Pendientes — Tarjeta de Lealtad

Lo que falta, con quién lo hace. Las reglas vigentes están en `CLAUDE.md`; lo que pasó, con fecha,
en `docs/BITACORA.md`.

## Los torneos, fuera de la lealtad (v3.6)

- ✅ ~~Retirar de la base `tournaments`, `tournament_pairs` y `tournament_matches`~~: **retiradas el 7
  de octubre de 2026.** Edgar corrió en producción el SQL de Cowork, que las respaldó y las borró en ese
  orden y sin cascade: respaldo **`tournaments` 1, `tournament_pairs` 1, `tournament_matches` 0**
  —los conteos leídos el 6 y el 7—; las tres «borrada»; siguen 8 avisos y 2 inscripciones. El SQL y
  el veredicto con el respaldo están en el POS (`docs/evidencia/migracion-retirar-torneos-socios-2026-10-07.sql`
  y `veredicto-…csv`). Por la API, las tres contestan ahora `404 PGRST205` con cualquier cuenta, y
  `politicas.mjs` del POS lo afirma (22 tablas con su regla, y las tres retiradas que no deben
  existir). La app de socios publicada (v3.7.1), medida ese día: ninguna petición a las tres, ninguna
  respuesta ≥ 400, ningún error en consola, y la inscripción a un aviso sigue leyendo `signups` (200).
- **`signups` NO se retira**: es la inscripción a cualquier aviso con `allow_signup`, no solo a
  torneos, y la usan los avisos con inscripción («Clase muestra», tipo `precio`). El 7 de octubre de
  2026 tiene **2 filas, las dos de avisos de tipo torneo**; de **8 avisos**, 5 son torneo, 2 precio y
  1 info, y 6 tienen `allow_signup` (desglose del 6, el total releído el 7). Qué hacer con las 2
  inscripciones viejas a torneos lo decide Edgar: la app ya no las enseña (un aviso de torneo no
  tiene botón), y el POS sí las lista.
- ⚠️ **Un aviso de tipo torneo con `allow_signup` ya no enseña botón en la app.** El POS todavía
  deja marcar la casilla en un torneo; la casilla no hace nada visible para el socio. No se tocó el
  POS: es de otro repo y no se pidió.

## El panel viejo (`Admin.html`)

- ✅ ~~Apagar el panel~~: **apagado en la v3.7** (7 de octubre de 2026). Las cuatro cosas que el POS
  no hacía el 6 —la lista de socios y buscar por correo, el historial «Todo», las visitas una por
  una con su premio y los contadores, «Miembro desde» y el mes de cumpleaños— las ganó el POS en
  `bfd4c98`. `Admin.html` es una página sin Supabase que manda al POS. El inventario, en la bitácora.
- ✅ ~~La sesión de personal del panel seguía guardada en los aparatos que lo usaron~~: desde la
  v3.7.1 (7 de octubre de 2026) `Admin.html` la borra al abrirse —`pp-lealtad-recepcion-auth` y sus
  llaves con ese prefijo, y `pp_gj_admin_auth_v1`—, por nombre, sin tocar la sesión de la app de
  socios. Medido en la bitácora. ⚠️ Solo en el aparato que vuelva a abrir `Admin.html`: uno que no
  la abra nunca conserva la llave, y su token se renueva solo mientras alguien lo use.
- ✅ ~~Los documentos del POS todavía hablaban del panel en futuro~~: puestos al día el 7 de octubre
  de 2026, en su rama `rediseno-v4`.

## La cancha de una visita

- 🕐 **Quitar el default de `visits.court`, para que quede nulo cuando no se sabe.** Desde la v3.4
  la app ya no manda `court` al registrar una visita (mandaba `'01'`, un dato falso: nadie sabe en
  qué cancha fue). Pero la columna todavía tiene `default '01'`, así que **la visita sigue
  guardando `'01'`, ahora puesto por la base**, y el historial de las dos apps sigue diciendo
  «Cancha 01» de cada visita registrada desde el panel. Falta el SQL que quite el default —algo
  como `alter table visits alter column court drop default`—, y **ese SQL lo manda Edgar**: no se
  corre desde aquí ni se arregla desde el código. Las visitas viejas con `'01'` siguen diciendo eso;
  qué hacer con ellas es otra decisión.

## La promoción

- ✅ ~~La bienvenida y Beneficios escribían la regla a mano~~: desde la v3.5 (5 de octubre de 2026) la
  leen de `regla_vigente()`, y si falla dicen «Pregunta en recepción por la promoción vigente.», sin
  números. ⚠️ **Beneficios se midió con la misma sustitución que la tarjeta** (la sesión de personal
  con la ficha de un socio real): es una pestaña de la app con sesión, y ninguna cuenta de prueba
  es socio. La bienvenida, sin sesión, es de verdad.
- 🕐 **La tarjeta del socio y la pantalla de visita registrada se verificaron sin una cuenta de
  socio de prueba** (5 de octubre de 2026): ninguna de las dos cuentas de `.env.controles` tiene
  ficha, y registrar una visita escribe para siempre en la ficha de un socio de verdad. La tarjeta
  se midió con la sesión de personal y la lectura de «mi ficha» sustituida por la de un socio real;
  la visita registrada, con el INSERT interceptado (contestó el id de la última visita real del
  socio, sin escribir nada). Todo lo demás —`promocion_de`, el conteo, la pantalla— fue de verdad.
  Medirlas de punta a punta pide una cuenta que sea socio de prueba, y crearla es decisión de
  Edgar: ⚠️ no con la cuenta «fuera» del POS, que sus controles de RLS usan como «con sesión y sin
  ficha».
- **El caso que el contraste no ejerce**: en los 12 socios de hoy el total de visitas y las que
  cuentan coinciden (nadie tiene visitas anteriores a `vinculado_en`), hay una sola regla y nadie
  pasa de 6 visitas. `scripts/contraste-promocion.mjs` dio 12 de 12, pero esos casos no los mide; la
  copia ya no existe, y el POS los midió por su lado con su SQL de comparación.

## Visto al pasar

- ✅ ~~El cumpleaños salía un día antes en el perfil del socio~~: desde la v3.5 toda fecha sin
  hora pasa por `PPSb.fechaSinHora`, que separa año, mes y día. Medido el 5 de octubre de 2026: el
  mismo socio, «29-mar» en su perfil y en el panel.
