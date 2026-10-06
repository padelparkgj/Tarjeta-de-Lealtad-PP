# Pendientes — Tarjeta de Lealtad

Lo que falta, con quién lo hace. Las reglas vigentes están en `CLAUDE.md`; lo que pasó, con fecha,
en `docs/BITACORA.md`.

## Los torneos, fuera de la lealtad (v3.6)

- 🕐 **Retirar de la base `tournaments`, `tournament_pairs` y `tournament_matches`.** Desde la v3.6
  ninguna de las dos apps las lee ni las escribe (búsqueda en `docs/BITACORA.md`). Conteos del 6 de
  octubre de 2026, leídos con la cuenta de personal: **`tournaments` 1, `tournament_pairs` 1,
  `tournament_matches` 0**. El torneo es el del aviso «Torneo» (`360e075a-…`); el POS los borra en
  cascada al borrar su aviso (`sonda-matches.mjs` del POS). **El SQL lo escribe Claude en Cowork**,
  no se corre desde aquí. ⚠️ `politicas.mjs` del POS mide las tres con un torneo de la lealtad
  sembrado: retirarlas pide quitarlas también de ese control.
- **`signups` NO se retira**: es la inscripción a cualquier aviso con `allow_signup`, no solo a
  torneos. Hoy tiene **2 filas, las dos de avisos de tipo torneo**, y hay un aviso que no es torneo
  con inscripción («Clase muestra», tipo `precio`); de 8 avisos, 5 son torneo, 2 precio y 1 info, y
  6 tienen `allow_signup`. Qué hacer con las 2 inscripciones viejas a torneos lo decide Edgar: la app
  ya no las enseña (un aviso de torneo no tiene botón), y el POS y el panel sí las listan.
- ⚠️ **Un aviso de tipo torneo con `allow_signup` ya no enseña botón en la app.** El POS y el panel
  todavía dejan marcar la casilla en un torneo; la casilla no hace nada visible para el socio. No se
  tocó el POS: es de otro repo y no se pidió.

## Apagar el panel viejo (`Admin.html`) — no se apagó en la v3.6

Los torneos se fueron, pero **el panel todavía hace cuatro cosas que el POS no** (inventario del 6 de
octubre de 2026, función por función, en la bitácora). Mientras sigan, el panel se queda:

1. **La lista de todos los socios** sin escribir nada, y buscar por **correo**. El POS no tiene
   lista a propósito («no hay lista: se busca») y `buscar_socios` busca por nombre, credencial y
   teléfono, no por correo.
2. **El historial «Todo»** —todas las visitas del club— y el total. El POS tiene Hoy, Semana y Mes.
3. **En la ficha, las visitas una por una** con su número y su premio (GRATIS / SILVER), y los
   contadores de canchas gratis y visitas Silver dadas. El POS enseña totales, el ciclo, la última
   visita y los premios **aplicados en un cobro**, que no son lo mismo.
4. **En la ficha, «Miembro desde» (`joined_at`) y el aviso «🎂 Mes de cumpleaños».** El POS enseña
   el cumpleaños, no el mes, y no enseña `joined_at` (sí `vinculado_en`).

Edgar decide, para cada una, si el POS la gana o si se deja de hacer; con las cuatro resueltas, el
paso 3 de ese día —`Admin.html` como página mínima que manda al POS, sin cargar Supabase— se hace
tal cual.

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
