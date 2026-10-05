# Bitácora — Tarjeta de Lealtad

Qué se hizo y qué se midió, con fecha. Las reglas vigentes están en `CLAUDE.md`; lo pendiente, en
`docs/PROMPTS.md`. Las entradas anteriores a esta viven en los mensajes de commit y en `PRUEBAS.md`.

## v3.5 · 5 de octubre de 2026 — los textos de la regla leen la regla

**El porqué.** La bienvenida y Beneficios escribían la regla a mano (ciclo de 7, 4.ª Silver, 7.ª
gratis). Con la regla programable desde el POS, el día que Edgar la cambie esas pantallas
seguirían prometiendo la vieja. Edgar creó `regla_vigente()` en la base del POS.

**El contrato, contra la base** (llamada real, sin sesión, solo la clave publicable): `200` con
`[{"ciclo":7,"visita_silver":4,"visita_gratis":7,"vigente_desde":"2000-01-01"}]`, lo mismo por
POST y por GET; con un argumento, `404 PGRST202`. **Coincide con lo que dijo Edgar**, con un
matiz de forma: llega como **arreglo de una fila**, no como objeto; la app pide `.single()`.

**El inventario, antes.** Con un `grep -rnE` de ordinales, «ciclo(s) de N», «N visitas», «visita
N», `% N`, Silver y gratis sobre todo `.html`, `.jsx`, `.js` y `.json` (58 líneas, casi todas
etiquetas sin número), la regla escrita estaba en tres sitios de `app.jsx`: la tarjeta «Silver y
gratis» de la bienvenida, las dos tarjetas de Beneficios (título, texto y etiqueta `VISITA 4` /
`VISITA 7`) y la nota «¿Cómo funciona el conteo?». `Landing Page.html` no la menciona. **Después,
la misma búsqueda**: ningún número de visita fuera de dos comentarios.

**El cambio.** Los tres textos se arman con `regla_vigente()` (`useReglaVigente`). Si falla, dicen
«Pregunta en recepción por la promoción vigente.»: ningún 4 ni 7 de respaldo. La tarjeta del socio,
el panel y la visita registrada siguen en `promocion_de` → `ciclo_actual`: un socio a medio ciclo
lo termina con la regla con la que lo empezó, y Beneficios ahora lo dice.

**La prueba, en el navegador** (Chrome por Playwright, la carpeta servida en local):

| | Bienvenida (sin sesión) | Beneficios |
|---|---|---|
| Regla real | «En cada ciclo de 7 visitas, la 4.ª sale a precio Silver y la 7.ª es gratis.» | «Precio Silver en la 4.ª visita · VISITA 4 · … la 4.ª, 11.ª, 18.ª…» y «Cancha gratis en la 7.ª visita · VISITA 7 · … la 7.ª, 14.ª, 21.ª…» |
| Falsa interceptada (10, 5, 10) | «En cada ciclo de 10 visitas, la 5.ª sale a precio Silver y la 10.ª es gratis.» | «Precio Silver en la 5.ª visita · VISITA 5 · … la 5.ª, 15.ª, 25.ª…» y «Cancha gratis en la 10.ª visita · VISITA 10 · … la 10.ª, 20.ª, 30.ª…» |
| 503 interceptado | «Pregunta en recepción por la promoción vigente.» | una sola tarjeta «Promoción por visitas · Pregunta en recepción…», y la nota igual |

Con la regla falsa, la tarjeta del socio siguió diciendo «la 7.ª, es completamente gratis»: es
`promocion_de`, y no debía moverse. La bienvenida, de verdad sin sesión: la llamada salió con la
clave publicable como bearer, `200`, sin interceptar y sin ninguna sesión guardada en el
navegador. **Beneficios no se recorrió como lo vería un socio**: es una pestaña de la app con sesión
y ninguna cuenta de prueba es socio, así que, como en la v3.4, entró la cuenta de personal con la
lectura de «mi ficha» sustituida por la ficha real de PP-26-5917.

**El cumpleaños.** `new Date('YYYY-MM-DD')` es medianoche UTC, el día anterior en el club. Un solo
ayudante, `PPSb.fechaSinHora`, separa año, mes y día; lo usan el perfil y el panel (que sumaba
`T00:00:00` a mano). Es el único valor de solo fecha que se pinta: `event_date` y `expires_at`
son instantes, y `vigente_desde` no se enseña. Mismo socio (`birth` = 29 de marzo): **«29-mar»
en su perfil y «29-mar» en el panel** (antes, «28-mar» y «29-mar»).

**El contraste**, otra vez: 12 socios, 12 coinciden. Este cambio no lo movió, que era lo esperado.

## v3.4 · 5 de octubre de 2026 — el ciclo de visitas, solo en la base

**El porqué.** El ciclo de visitas existía dos veces: en la base, `promocion_de`, que usa el POS
desde el 30 de septiembre de 2026, y aquí, en `regla-visitas.js`, con la regla escrita (ciclo de 7,
4.ª Silver, 7.ª gratis) y sin saber nada de `reglas_promocion`. Un cambio de regla programado en la
base habría llegado al mostrador y no al celular del socio.

**El contrato, leído de la base y no supuesto.** La migración que creó `promocion_de` no está en
`docs/evidencia/` del POS: ahí solo está el SQL que la comparó. Así que la fuente fue la base, por
la API y sin escribir: la firma es `promocion_de(p_member_id)` —otra llave da `404 PGRST202`, un
socio inexistente `404 PT404`— y el jsonb trae `participa`, `vinculado_en`, `visitas_cuentan`,
`visitas[]`, `ciclo_actual`, `siguiente` y `proxima_con_premio`. **Una diferencia con el POS**: su
tipo (`FilaPromocion`, `services/promocion.ts`) no declara `vinculado_en`, que la base sí devuelve.
No rompe nada —el POS no la lee—; aquí se usa para la fecha de la línea que explica el conteo.

**El contraste, antes de borrar** (`scripts/contraste-promocion.mjs`, solo lee). Para cada socio de
la base, la copia del navegador —el código de `regla-visitas.js` leído de git (`8e3efbe`) y
ejecutado tal cual, sobre el conteo desde `vinculado_en` que hacían las pantallas— contra
`promocion_de`, con la cuenta de personal: lo que cuenta, los sellos del ciclo, la siguiente (número,
posición y premio), la próxima con premio y el premio de cada visita. **Rojo primero, dos veces**:
con `--falsear` (la copia con un ciclo de 6) difiere PP-26-5917 —6 visitas: la copia decía 0 en el
ciclo y la siguiente a tarifa normal; la base, 6 y la 7.ª gratis—, y con `--vacia` se niega por
tener 0 socios contra un mínimo de 10. **De verdad: 12 socios, 12 coinciden, 0 difieren**, 7 con
visitas que cuentan. La sospecha de que la copia contara desde antes de `vinculado_en` no se
confirmó: desde la v3.3 ya contaba desde ahí, y en los 12 socios el total y lo que cuenta son
iguales, así que ese caso no lo ejerce este contraste.

**Las pantallas.** La tarjeta del socio, «Mis visitas», el panel del escaneo, la pantalla de visita
registrada y la ficha del panel leen `PPSb.promocionDe` y pintan sus llaves: los sellos de
`ciclo_actual`, la siguiente de `siguiente`, el número y el premio de cada visita de `visitas` por
id, y lo que fue la visita recién guardada, **por el id que devolvió el INSERT**. Si la llamada
falla, dicen «No se pudo leer la promoción», sin ciclo en cero. `regla-visitas.js` se borró, con sus
dos etiquetas `<script>`.

**«Miembro desde»** leía `member.joinedAt`, que no existe. Antes, en el navegador, con el código de
la v3.3: «Invalid Date» en el perfil y en la tarjeta descargable. Después: «29 jun 2026» en los dos
(`joined_at` = 2026-06-30 00:45 UTC, el 29 en el club).

**La cancha.** El INSERT de una visita salía `{"member_id":"PP-26-5917","court":"01"}`; ahora sale
`{"member_id":"PP-26-5917"}` (capturado en el navegador). El selector de cancha del panel se fue. La
columna sigue con default `'01'`: pendiente de SQL de Edgar.

**La verificación, en navegador y sin escribir nada** (Playwright con Chrome, la carpeta servida en
local). Ninguna cuenta de `.env.controles` es socio —ninguna tiene ficha—, y registrar una visita
escribe para siempre en la ficha de un socio real, así que: el panel, de verdad con la cuenta de
personal; la tarjeta, con la sesión de personal y la lectura de «mi ficha» sustituida por la ficha
real del socio; la visita registrada, con el INSERT interceptado y contestado con el id de la última
visita real del socio. `promocion_de`, el conteo y lo pintado, de verdad. Dos socios:

| | PP-26-5917 (6 visitas) | PP-26-4076 (3 visitas) |
|---|---|---|
| Panel, al escanear | «6 visitas acumuladas · Esta será su 7.ª visita de la promoción · ¡Esta visita es GRATIS!» | «3 … su 4.ª visita … Aplica precio Silver en esta visita» |
| Visita registrada (la última real) | «Visita #6 de la promoción · Su 7.ª visita es GRATIS» | «Visita #3 … Su 4.ª visita es a precio Silver» |
| Tarjeta del socio | «6 visitas · ¡Cancha GRATIS desbloqueada! Tu siguiente visita, la 7.ª, es completamente gratis» | «3 visitas · ¡Precio Silver desbloqueado! Tu siguiente visita, la 4.ª, …» |
| Miembro desde | 29 jun 2026 | 29 jun 2026 |
| **El POS publicado** (Socios → ficha) | «La siguiente es la 7.ª, y es cancha gratis.» · 6 hechas | «La siguiente es la 4.ª, y es tarifa Silver.» · 3 hechas |

Cuadran. El POS no enseña «Miembro desde»; contra la base, `joined_at` da el 29 de junio en el
club. Con `promocion_de` caída (503 interceptado), el panel dijo «No se pudo leer la promoción» y
siguió dejando registrar la visita.
