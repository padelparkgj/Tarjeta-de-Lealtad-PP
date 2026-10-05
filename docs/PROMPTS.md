# Pendientes — Tarjeta de Lealtad

Lo que falta, con quién lo hace. Las reglas vigentes están en `CLAUDE.md`; lo que pasó, con fecha,
en `docs/BITACORA.md`.

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
