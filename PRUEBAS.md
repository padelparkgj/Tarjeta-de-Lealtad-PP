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

| # | Qué | Cómo | Qué tiene que pasar |
|---|---|---|---|
| 1 | Panel sin sesión | Abrir `Admin.html` sin haber entrado | Solo el formulario de correo y contraseña. Desde la consola, `PPSb.getAllMembers()` y `PPSb.getAllVisits()` devuelven 0 filas, y `PPSb.logVisit(...)` da `42501` |
| 2 | Panel con sesión de personal | Entrar con la cuenta de personal | Se abre el panel |
| 3 | Buscar un socio | Socios → buscar «PRUEBA» | Aparece la ficha con su credencial |
| 4 | Registrar una visita | Escanear → escribir la credencial en «¿No lee el QR?» → Buscar → Confirmar visita | Pantalla de visita guardada; en la base, una fila nueva en `visits` con `creado_por` = la cuenta que entró |
| 5 | La visita en la ficha | Socios → abrir la ficha | «1 Visitas» y la visita en el historial |
| 6 | Aviso vigente sin sesión | Avisos → publicar uno con vigencia a futuro; abrir `Landing Page.html` en una ventana sin sesión | El aviso se ve en la bienvenida. Después se borra |
| 7 | Enlace a una ficha que ya existía | Crear una ficha sin cuenta con el correo de una cuenta de prueba (no el de un socio real) y registrarle una visita; entrar en `Landing Page.html` con esa cuenta | La tarjeta sale con la **misma credencial** y la visita; en la base, `user_id` es la cuenta. Ninguna ficha nueva |
| 8 | Ficha nueva | Entrar en la página de socios con una cuenta sin ficha | Si la cuenta no trae datos de registro, sale «Completa tu ficha»; al enviarla, la tarjeta sale con una credencial **generada por la base** (`PP-AA-NNNNN`) |
| 9 | Registro con correo desechable | «Crear mi tarjeta» con un correo de mailinator | Sale «Revisa tu correo». Llega «Confirm Your Signup». Al confirmar y entrar, la ficha se crea con nombre, teléfono y cumpleaños del registro |
| 10 | El fallo se dice | Registrarse con un correo inválido, o con el límite de correos agotado | El motivo, en español, sobre el formulario; nunca la bienvenida muda |

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
