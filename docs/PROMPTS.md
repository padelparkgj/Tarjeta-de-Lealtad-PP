# Pendientes — Tarjeta de Lealtad

Lo que falta, con quién lo hace. Las reglas vigentes están en `CLAUDE.md`; lo que pasó, con fecha,
en `docs/BITACORA.md`.

## Los torneos, fuera de la lealtad (v3.6)

- 🕐 **Retirar de la base `tournaments`, `tournament_pairs` y `tournament_matches`.** Desde la v3.6
  ninguna app las lee ni las escribe (búsqueda en `docs/BITACORA.md`), y desde la v3.7 el panel de
  recepción ya no existe. **Conteos del 7 de octubre de 2026**, leídos por la API con
  la cuenta de personal (`HEAD` con `count=exact`, sin escribir): **`tournaments` 1,
  `tournament_pairs` 1, `tournament_matches` 0** —los mismos del 6—. El torneo es el del aviso
  «Torneo» (`360e075a-…`); el POS los borra en cascada al borrar su aviso (`sonda-matches.mjs` del
  POS). **El SQL lo escribe Claude en Cowork**, no se corre desde aquí. ⚠️ `politicas.mjs` del POS
  mide las tres con un torneo de la lealtad sembrado (`torneo-lealtad.mjs`): retirarlas pide
  quitarlas también de ese control, o bajará de 25 de 25.
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
  `bfd4c98`. `Admin.html` es una página sin scripts que manda al POS. El inventario, en la bitácora.
- 🕐 **La sesión de personal del panel sigue guardada en los aparatos que lo usaron**, en
  `localStorage` con la llave `pp-lealtad-recepcion-auth` (y la bandera vieja del PIN,
  `pp_gj_admin_auth_v1`, donde no se borró). Ya nada la lee: la página mínima no carga Supabase y
  la app de socios usa la llave por defecto. No se limpió porque la página mínima no lleva scripts,
  como se pidió. Si se quiere borrar, son dos `removeItem` por nombre en `Admin.html`; y lo que de
  verdad la invalida es cerrar la sesión de esa cuenta en Supabase. Lo decide Edgar.
- 🕐 **Los documentos del POS todavía hablan del panel en futuro**: su `CLAUDE.md` («El módulo
  Socios reemplaza al panel de Admin.html, por etapas») y su `docs/PROMPTS.md § Dejar Admin.html`.
  Son de otro repo y desde aquí solo se leen: se ponen al día en una sesión del POS.

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
