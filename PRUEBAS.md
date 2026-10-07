# Verificación a mano — la lealtad contra la base del POS

Este repo no tiene batería de pruebas, a propósito: la app se va a absorber en el POS y
no vale la inversión. Lo que hay es este procedimiento. Se siguió por primera vez el 25 de
septiembre de 2026, con la v3.0; los resultados de esa vez van al final.

## Montaje

1. Servir la carpeta en local con cualquier servidor estático, por ejemplo en
   `http://localhost:5500` (no hay compilación: el navegador carga los `.jsx` con Babel).
2. `config.js` apunta al proyecto del POS. Nada más que configurar.
3. Cuentas: una de **personal** del POS (la reconoce `es_personal()`) y otra **sin papel**.
   Las dos de prueba del POS sirven: están en `.env.controles` del repo del POS.
4. Todo lo que se cree al probar se nombra `PRUEBA … (borrar)`, para que se vea y se borre.

## Casos

⚠️ **Desde la v3.7 (7 de octubre de 2026) el panel de recepción no existe**: `Admin.html` es una
página sin scripts que manda al POS. Los casos 1 a 6 y el 13 lo usaban; se dejan como estaban porque
sus resultados de abajo los nombran, y **lo que hacían se prueba en el POS** (Socios), con sus
controles. Lo que queda de `Admin.html` lo prueban el 14 y el 15.


| # | Qué | Cómo | Qué tiene que pasar |
|---|---|---|---|
| 1 | Panel sin sesión | Abrir `Admin.html` sin haber entrado | Solo el formulario de correo y contraseña. Desde la consola, `PPSb.getAllMembers()` y `PPSb.getAllVisits()` devuelven 0 filas, y `PPSb.logVisit(...)` da `42501` |
| 2 | Panel con sesión de personal | Entrar con la cuenta de personal | Se abre el panel |
| 3 | Buscar un socio | Socios → buscar «PRUEBA» | Aparece la ficha con su credencial |
| 4 | Registrar una visita | Escanear → escribir la credencial en «¿No lee el QR?» → Buscar → Confirmar visita | Pantalla de visita guardada; en la base, una fila nueva en `visits` con `creado_por` = la cuenta que entró |
| 5 | La visita en la ficha | Socios → abrir la ficha | «1 Visitas» y la visita en el historial |
| 6 | Aviso vigente sin sesión | Avisos → publicar uno con vigencia a futuro; abrir `Landing Page.html` en una ventana sin sesión | El aviso se ve en la bienvenida. Después se borra |
| 7 | Enlace: ficha existente + teléfono correcto | Crear con la sesión de personal una ficha sin cuenta (correo desechable, teléfono de 10 dígitos) y registrarle una visita; registrarse en la app con ese correo y ese teléfono **en otro formato** (`+52 477 …`) | Entra directo a la tarjeta con la **misma credencial** y la visita; en la base, la ficha tiene `user_id`. Ninguna ficha nueva |
| 8 | Enlace: teléfono equivocado | Igual, con otro teléfono | «Revisa tu teléfono», con el campo marcado; **leyendo la base, la ficha sigue sin cuenta**. Corregir el teléfono ahí mismo y «Enlazar mi tarjeta» enlaza, sin registrarse otra vez |
| 9 | Correo nuevo | Registrarse con un correo que no tiene ficha | Entra directo a la tarjeta, con una credencial **generada por la base** (`PP-AA-NNNNN`) |
| 10 | Registro y login seguidos | Tras el caso 9, Perfil → Cerrar sesión, e Iniciar sesión | Ninguna pantalla habla de correos; entra a la misma tarjeta |
| 11 | Mostrador | Ficha sin teléfono (o dos fichas con el mismo correo) y registrarse con ese correo | «Pasa al mostrador», sin culpar, con «Ya me atendieron, intentar de nuevo» y «Cerrar sesión»; la ficha sigue sin cuenta |
| 12 | Login | Contraseña mala; y sin red (modo avión) | «Correo o contraseña incorrectos.» · «No hay conexión con el club…» |
| 13 | La regla de visitas | Un socio de prueba con cuenta; registrar sus visitas una a una desde el panel. Antes de cada una, leer lo que anuncia la tarjeta del socio y lo que anuncia el panel; después, lo que dice «visita registrada». Al final, el historial de las dos apps y el contador de la ficha | Coinciden con la lista de Edgar, escrita tal cual en la prueba (no con la función): 4.ª y 11.ª Silver, 7.ª y 14.ª gratis, el resto sin premio. Los sellos vuelven a cero tras la 7.ª |
| 14 | La página mínima | Abrir `Admin.html`, sin sesión y con la consola abierta | «El panel de recepción se mudó al POS del club…» y el botón «Abrir el POS» a `https://app-padel-park.vercel.app`. Cero `<script>`, `window.supabase` sin definir, ningún error en consola; `admin.jsx` y `admin.css` dan 404 |
| 15 | El panel guardado en un aparato | Con un perfil de navegador que abrió el panel de la v3.6 (el caché `ppgj-v3` guarda `admin.jsx`), servir la versión nueva en el mismo origen y volver a abrir `Admin.html`; después, sin red | La primera carga ya es la página mínima; tras el arranque solo queda `ppgj-v4`, sin `admin.jsx`; sin red, `Admin.html` sale del caché como página mínima y `admin.jsx` falla. Con el `sw.js` viejo, `admin.jsx` se sigue sirviendo sin red: ése es el rojo |
| — | Si se vuelve a encender la confirmación por correo | Registrarse | «Revisa tu correo»; la tarjeta se crea en el primer inicio de sesión con los datos del registro. Hoy no se puede probar: la confirmación está apagada |

⚠️ **Nunca se prueba con el correo de un socio real**, ni se registra una visita a la
credencial de un socio real: una visita cuenta para su cancha gratis.

## Resultados del 25 de septiembre de 2026

Los pasos con contraseña los ejecutó un navegador sin cabeza (Playwright, con Chrome) que
leía las cuentas de `.env.controles`; los demás, Chrome a mano.

- 1 ✅: login solo; 0 socios, 0 visitas; la escritura de una visita sin sesión, `42501`.
- 2–5 ✅: ficha `PP-26-10000` encontrada, visita registrada (0 → 1 en la base, con
  `creado_por`), y la ficha del panel dice 1.
- 6 ✅: el aviso de prueba se vio sin sesión (dos veces: la bienvenida pinta los avisos
  arriba y abajo, y ya era así) y se borró.
- 7 ✅: la cuenta de prueba de personal enlazó `PP-26-10000` con su visita; una sola ficha
  con esa cuenta.
- 8 ✅: la cuenta sin papel recibió `PP-26-10001`, generada por la base. Con su sesión,
  `members` devuelve solo su propia fila.
- 9 ⚠️ **a medias**: el registro dice «Revisa tu correo» y el correo llega. El siguiente
  registro chocó con **el límite de correos del proyecto** («email rate limit exceeded»),
  así que confirmar y entrar con los datos del registro **no se probó**. La parte que crea
  la ficha es la misma llamada del caso 8.
- 10 ✅: «ese correo no es válido» (`@example.com`) y «el club alcanzó el límite de
  correos de confirmación por hora».

## Resultados del 26 de septiembre de 2026 (v3.1, confirmación por correo apagada)

Mismo método: Playwright con Chrome para lo que lleva contraseña, en local contra la base real.

- 7 ✅: `PP-26-10002` (teléfono `4770001111`, registrado como `+52 477 000 1111`) enlazó con su
  visita; una sola ficha con ese correo.
- 8 ✅: con `4779999999`, «Revisa tu teléfono» y `PP-26-10003` **sigue sin cuenta** leyendo la
  base; corregido a `477-000-2222` en la misma pantalla, enlazó.
- 9 ✅: `PP-26-10005`, generada por la base, con su teléfono.
- 10 ✅: salir y entrar lleva a la misma tarjeta; ninguna pantalla del camino habla de correos.
- 11 ✅ (sin teléfono): «Pasa al mostrador» y `PP-26-10004` sigue sin cuenta. El de dos fichas
  con el mismo correo no se probó.
- 12 ✅: las dos frases.

## Resultados del 26 de septiembre de 2026 (v3.2, la regla de visitas)

Socio de prueba `PP-26-10006`, 15 visitas registradas desde el panel, en local contra la base real.

- 15 de 15 visitas cuadran en tarjeta, panel y pantalla guardada: Silver en la 4.ª y la 11.ª,
  gratis en la 7.ª y la 14.ª, las otras once sin premio. Sellos antes de cada visita:
  0-1-2-3-4-5-6, y vuelven a 0 en la 8.ª y la 15.ª.
- Historial: 15 filas en cada app, 0 discrepancias.
- Contador de la ficha con 15 visitas: 2 gratis y 2 Silver (con la división de antes, 2 y 5).

## Resultados del 30 de septiembre de 2026 (v3.3: el QR sin nombre, las visitas que cuentan, sin borrar)

**Sin escribir en producción.** Allí solo hay los 12 socios reales, y una ficha de prueba se quedaría
en la base (Edgar lo descartó el 29 de septiembre). Así que las dos páginas se sirvieron en local y
un navegador sin cabeza (Playwright, Chrome) contestó las llamadas a Supabase con dos fichas en
memoria: «PRUEBA Ana Registrada Tarde (borrar)», con cuenta y 5 visitas, 2 de antes de registrarse
hace 3 días; y «PRUEBA Beto Mostrador (borrar)», sin `vinculado_en`, con 2. El guion no se versionó en
ninguno de los dos repos (aquí no hay batería, a propósito, y el POS no se tocó en esta vuelta).

- **Tarjeta**: 3 «visitas en la promoción», la siguiente Silver (4.ª), y la línea «Llevas 5 visitas.
  Para la promoción cuentan 3…». El conteo son dos `HEAD` con `count`, el segundo con
  `visited_at=gte.<vinculado_en>`; ninguna fila de visitas viaja para contar.
- **QR**: decodificado de la pantalla, `PPGJ|PP-26-90001`, 25×25 módulos con un nombre de 36
  caracteres.
- **Mis visitas**: las 3 que cuentan numeradas 3-2-1, las 2 de antes sin número, y la explicación.
- **Panel**: el lector acepta `PPGJ|cred` y `PPGJ|cred|nombre`; al escanear a Ana, 5 y 3 con la
  línea y Silver para esta visita; confirmada, «Visita #4 de la promoción», releída; Beto, «Aún no
  participa», sin premio; el historial ya no tiene botón de borrar; el perfil de Ana, 6 visitas y 4
  en la promoción, una Silver, y el historial numerado 4-3-2-1 y dos sin número.
- **El mismo guion contra la v3.2** (con `git stash`): rojo en la tarjeta —5 visitas y la siguiente
  «normal», donde la regla del POS da la 4.ª Silver—.
- **Contra la base real, solo lectura** (cuenta de personal): la misma consulta de conteo sobre las
  12 fichas da 18 visitas y 18 que cuentan; en ninguna difieren hoy. La de Edgar, 1 y 1.
- **No probado**: la cámara leyendo el QR nuevo en un aparato (la prueba Edgar contra lo publicado),
  y el conteo con la sesión de un socio (la RLS de `visits` para el socio) —la del personal sí—.
