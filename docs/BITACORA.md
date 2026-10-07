# Bitácora — Tarjeta de Lealtad

Qué se hizo y qué se midió, con fecha. Las reglas vigentes están en `CLAUDE.md`; lo pendiente, en
`docs/PROMPTS.md`. Las entradas anteriores a esta viven en los mensajes de commit y en `PRUEBAS.md`.

## v3.7 · 7 de octubre de 2026 — el panel se apaga

**El porqué.** El 6 el panel se quedó por cuatro cosas que el POS no hacía. El POS las ganó en
`bfd4c98` —la lista de socios con búsqueda por correo, el historial «Todo», las visitas con su
premio y los contadores de ganados y aplicados, «Miembro desde» y el mes de cumpleaños—, publicado
en `main` y con el Ready confirmado por Edgar. Con eso, el paso 3 del 6 se hace tal cual.

**La comprobación, antes de apagar.** `admin.jsx` de la v3.6 leído entero, función por función,
contra el código del POS en `bfd4c98` (`src/modules/socios/`):

| El panel (v3.6) | En el POS publicado |
|---|---|
| Entrar con cuenta de personal y `es_personal()` | La puerta del POS, que pregunta lo mismo |
| Escanear el QR con la cámara o teclear la credencial | Socios → Registrar visita: la cámara (`LectorQR`, `jsqr`) o «Credencial, QR o nombre», que además busca por nombre o teléfono |
| Antes de confirmar: visitas, «esta será su N.ª» y el premio de esta visita | «Lleva N en la promoción. Si la registras, será la N.ª, y es …»; los sellos, en la ficha |
| «🎂 Mes de cumpleaños» al escanear | `AvisoCumple` en la confirmación |
| Visita guardada: su número releído y la próxima con premio | «Fue la N.ª de la promoción … La próxima con premio es la N.ª», releído |
| «Visitas hoy» | Historial → Hoy, con el total que cuenta la base |
| Historial Hoy / Semana / Mes / Todo con su total; el renglón abre la ficha | Historial de visitas, los cuatro periodos, por partes, con el total de la base; el nombre abre la ficha |
| Socios: todos, con el total, y buscar por nombre, ID o correo | La lista por nombre, 25 por parte con el total; `buscar_socios` por nombre, credencial, teléfono y correo |
| Ficha: cumpleaños, teléfono, correo, «Miembro desde», mes de cumpleaños, total y en la promoción, canchas gratis y visitas Silver, sellos, siguiente y próxima con premio, inscripciones a avisos, cada visita con su número y su premio | `FichaSocio`: todo eso, y además ganados contra aplicados en caja, lo pagado y editar |
| Avisos: tipo, imagen, título, mensaje, fecha del evento, «mostrar hasta», inscripción; publicar, editar, borrar; los inscritos | Socios → Avisos: lo mismo, más activar y desactivar y la cifra de lo que se lleva un borrado |
| Ajustes: conexión, club, versión, instrucciones, cerrar sesión, ir a la página de socios | No son trabajo de recepción; cerrar sesión, en el POS |

**Lo que no estaba en el inventario del 6, mirado ahora.** Ninguno es trabajo de recepción que el
POS no haga, así que no detuvo el apagado; quedan dichos:

- **Instalable como app «PP Recepción»** (`admin-manifest.json`, icono de pantalla de inicio). El POS
  no tiene manifiesto. Un aparato con ese icono abre ahora la página mínima, y desde ella el POS en
  el navegador.
- **La cancha de cada visita** («Cancha 01») en el historial y la ficha. El POS no la enseña, a
  propósito: es el default de la base, no un dato.
- **Vibración y confeti** al registrar una visita con premio. El POS lo dice con texto.
- **Borrar la bandera vieja del PIN** (`pp_gj_admin_auth_v1`) al abrir: limpieza, no una función.

**Lo borrado**: `admin.jsx`, `admin.css`, `admin-manifest.json`, `icons/admin-180.png`,
`admin-192.png` y `admin-512.png`; en `supabase-client.js`, lo que solo el panel llamaba
—`esPersonal`, `getMemberByMemberId`, `getAllMembers`, `logVisit`, `getAllVisits`,
`getAnnouncementsByIds`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`,
`uploadAnnouncementImage`, `getEventSignups`— y la llave de sesión aparte (`PP_AUTH_STORAGE_KEY`);
la tercera persona de `lineaConteo`, que solo usaba el panel; y en `styles.css` la sección «Member
panel (admin.jsx)», 124 líneas de clases que ningún otro archivo nombra (`.member-panel`, `.mp-*`,
`.cycle-dot`, `.cd-*`, `.sr-next`). **Lo que se quedó por compartido**: `styles.css` (la página mínima
y la app), `assets/logo-navy.jpg` (las dos), `config.js` y `supabase-client.js` (la app), `sw.js`
(controla todo el sitio, la página mínima incluida) e `icons/icon-*` (la app; la página mínima usa
el de 192 de favicon). `getUser`, que no llama nadie, tampoco lo llamaba el panel: no se tocó.

**`Admin.html`** es una tarjeta con el estilo del login del panel —logo, «Panel de Recepción»,
«Padel Park Gran Jardín»— con estilos en línea sobre `styles.css`. Cero scripts, sin Supabase, sin
sesión, sin manifiesto.

**El caché.** `sw.js` es network-first y guarda en `ppgj-v3` todo GET del mismo origen que contesta
200: un aparato que abrió el panel tiene ahí `Admin.html`, `admin.jsx`, `admin.css`,
`supabase-client.js`, `config.js`, `admin-manifest.json` y un icono, y sin red los sirve. `CACHE`
pasa a `ppgj-v4`: al activarse, el SW nuevo borra todo caché con otro nombre. **Medido** con Chrome
por Playwright, un perfil en disco y el mismo origen (`localhost:5599`): la v3.6 (worktree de
`4bd76be`) abierta dos veces deja `ppgj-v3` con 9 archivos; se cierra, se sirve la v3.7 y se vuelve a
abrir `Admin.html`:

| | Con `ppgj-v4` | Con el `sw.js` viejo (el rojo) |
|---|---|---|
| Primera carga | la página mínima; no pide `admin.jsx` ni Supabase | la página mínima |
| Cachés tras el arranque | ninguno; tras recargar, `ppgj-v4` con `Admin.html`, `styles.css` y el logo | `ppgj-v3` con los 9, `admin.jsx` incluido |
| Sin red, `Admin.html` | la página mínima, del caché | la página mínima |
| Sin red, `admin.jsx` | falla | **200** |

La primera carga ya sale bien con el SW viejo porque es network-first; lo que el cambio de nombre
arregla es lo que el aparato **guarda**. ⚠️ **Sin medir**: un aparato que arranca **sin red** con el
SW viejo todavía activo ve el panel viejo del caché —sin Supabase no hace nada— hasta su siguiente
arranque con red.

**Las referencias al panel.** La app (`app.jsx`): ningún enlace; dos comentarios lo nombraban y se
corrigieron, y los textos que dicen «recepción» hablan del mostrador, no del panel. `Landing
Page.html`, `index.html` y `manifest.json`: ninguna. `ios-app/`: ninguna (solo «recepción» como
lugar). `supabase-client.js` y `styles.css`: las que se fueron con lo borrado. `PRUEBAS.md`: los
casos 1–6 y 13 lo usaban; se dejan con su historia y se suman el 14 y el 15. `README.md` lo describe
entero, pero es el de la versión de Google Sheets y ya estaba anotado como desactualizado: no se
tocó.

**En el navegador**, la carpeta servida en local (Chrome por Playwright): `Admin.html`, 0 scripts,
`window.supabase` sin definir, 0 errores en consola —el único que salía era `/favicon.ico` 404, que
la v3.6 también daba; ahora lleva icono—, `admin.jsx` y `admin.css` 404. La app de socios, con la
cuenta de personal y «mi ficha» sustituida por la de PP-26-5917, y toda escritura abortada (no salió
ninguna): Inicio «… PP-26-5917 … 6 VISITAS 🎉 ¡Cancha GRATIS desbloqueada! Tu siguiente visita, la
7.ª, es completamente gratis … MIEMBRO DESDE 29 jun 2026 …», 0 errores, 0 respuestas ≥ 400, y el
huevo «v3.7 · Tarjeta de Lealtad». Un `pageerror` que salió al bloquear los service workers en la
prueba («reading 'addEventListener'») sale igual en la v3.6 con el SW bloqueado y no sale con el SW
permitido: es de la prueba, no de la app.

**La base, solo leyendo** (cuenta de personal, `HEAD` con `count=exact`): `tournaments` 1,
`tournament_pairs` 1, `tournament_matches` 0, `signups` 2, `announcements` 8 —lo mismo que el 6—.
Retirar las tres primeras queda en `docs/PROMPTS.md`.

## v3.6 · 6 de octubre de 2026 — los torneos se van; el panel se queda

**El porqué.** Decisión de Edgar: los torneos de socios se juegan en otra app. En ésta solo se
anuncian, como cualquier aviso. Y el panel viejo se apagaría, porque los torneos eran lo único que
lo mantenía vivo… si el POS ya hiciera todo lo demás. No lo hace: el panel se queda.

**El inventario, antes de borrar.** Lo que tocaba las tres tablas de torneo vivía todo en
`supabase-client.js` (15 líneas): `getTournamentConfig` / `saveTournamentConfig` (`tournaments`),
`getTournamentPairs`, `assignPartner`, `upsertPair`, `unassignPartner` (`tournament_pairs`),
`saveTournamentSchedule`, `getTournamentMatches`, `recordMatchWinner`, `markReminderSent`,
`markNextPingSent` (`tournament_matches`), `signUpForTournament` (`signups` + `tournament_pairs`) y
`getMembersByMemberIds` (teléfonos para WhatsApp). Las llamaban: en la app, `AnnCard` —inscripción
con pareja (`PartnerPickerModal`), «Tu partido», «Tus resultados» y el campeón con
`PPTournament.computeStandings`— y la pestaña «Torneos» (`TournamentsScreen`); en el panel, la
pestaña «Torneos» y `TournamentModal` con sus tres pestañas —configuración, parejas
(`MemberPickerModal`, aviso por WhatsApp) y rol (`PPTournament`: round-robin, horario, siguiente
por cancha, posiciones; resultados; recordatorios por WhatsApp)—. Más `tournament-logic.js` y
`whatsapp.js`. `signups` lo usaban, además, la inscripción **sin pareja** de cualquier aviso con
`allow_signup` (`signUpForEvent`, `cancelSignup`, `getMemberSignups`), la lista de inscritos del
panel (`getEventSignups`, `AnnSignupsModal`) y la ficha del socio en el panel.

**La base, solo leyendo** (cuenta de personal): 8 avisos —5 torneo, 2 precio, 1 info—, 6 con
`allow_signup`, **ninguno visible hoy** (los 8 vencieron); `signups` 2 filas, las dos de avisos de
torneo; `tournaments` 1, `tournament_pairs` 1, `tournament_matches` 0. Como «Clase muestra» (tipo
`precio`) tiene inscripción, **`signups` tiene otro uso y se queda intacto**.

**Lo que se quitó.** En la app: el selector de pareja, el bloque de partido, resultados y campeón,
la pestaña «Torneos» y `tournament-logic.js` de la página. Un aviso de torneo ahora sale en Inicio
con los demás —antes Inicio los excluía y vivían en su pestaña— y **no tiene botón aunque tenga
`allow_signup`**. Los demás avisos con inscripción la conservan. En el panel: la pestaña «Torneos»,
`TournamentModal` y sus tres pestañas, `MemberPickerModal`; el contador de inscritos de un aviso de
torneo abre la lista simple, como el de cualquier aviso; «Torneos inscritos» de la ficha pasa a
«Inscripciones a avisos». Borrados `tournament-logic.js` y `whatsapp.js`, que solo los usaban los
torneos. Y en `supabase-client.js`, todas las funciones de torneo con sus ayudantes (`SEL_PAREJA`,
`pareja`, `companero`).

**La búsqueda.** Antes: 15 líneas que nombran `tournaments`, `tournament_pairs` o
`tournament_matches`, todas en `supabase-client.js`, y lógica de torneo en seis archivos (`app.jsx`
5, `admin.jsx` 14, `supabase-client.js` 27, las dos páginas 1 cada una, `tournament-logic.js` 1).
Después: **0 accesos**; las 2 líneas que quedan son el comentario de `supabase-client.js` que dice
que nada las toca. `ios-app/` no las toca: solo dice «Torneos y clínicas» como beneficio. Los
estilos de los bloques de torneo (`.ann-match-block`, `.trn-*`, `.pp-modal`) se quedan en
`styles.css` y `admin.css`: no leen nada, y no se pidió.

**El panel no se apagó.** Funciones del panel y dónde viven en el POS: escanear o teclear la
credencial con la promoción y registrar la visita → Socios → Registrar visita; historial Hoy /
Semana / Mes → Historial de visitas; avisos (crear, editar, imagen, fecha, vencimiento,
inscripción, borrar, inscritos) → Socios → Avisos, que además activa y desactiva; ficha con datos,
total, ciclo e inscripciones → la ficha del socio. **Cuatro que el POS no hace**: la lista de todos
los socios y buscar por correo; el historial «Todo»; las visitas una por una con su premio y los
contadores de premios dados; «Miembro desde» y «Mes de cumpleaños». Quedan en `docs/PROMPTS.md`, y
`Admin.html` sigue siendo el panel.

**Probado en el navegador** (Playwright sin cabeza, la carpeta servida en local, la base real, solo
lectura: toda escritura se habría abortado y no salió ninguna). Cuenta de personal, con «mi ficha»
sustituida por la de PP-26-5917, porque no hay cuenta de socio de prueba. Como ningún aviso está
visible, **se interceptó la lectura de avisos**: dos avisos reales con el vencimiento movido al 31 de
diciembre, «Torneo» (torneo, con inscripción) y «Clase muestra» (precio, con inscripción). Pestañas:
«Tarjeta · Beneficios · Perfil». Inicio: «… 6 VISITAS 🎉 ¡Cancha GRATIS desbloqueada! … TORNEO Torneo
Inscríbete ya PRECIO ESPECIAL Clase muestra Ven a nuestra clase gratis Inscribirme → …». La tarjeta del
torneo, con su imagen y **sin botón**; la de la clase, con «Inscribirme →». El panel: «Escanear ·
Historial · Socios · Avisos · Ajustes», sin Torneos; Ajustes, «v3.6 · base del POS».

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
