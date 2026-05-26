# Padel Park Gran Jardín · Tarjeta de Lealtad

Landing page para socios + panel de recepción (admin) con scanner de QR.
Todo el stack es **estático en GitHub Pages + Google Sheets** vía Apps Script. No requiere servidor.

---

## Estructura

```
├─ Landing Page.html   ← Página pública (registro + tarjeta + QR)
├─ Admin.html          ← Panel de recepción (scanner)
├─ app.jsx             ← Lógica de la landing
├─ admin.jsx           ← Lógica del panel admin
├─ styles.css          ← Estilos compartidos
├─ admin.css           ← Estilos del panel admin
├─ api.js              ← Helper para enviar datos al Sheet
├─ config.js           ← Configuración (URL del webhook, token, ciudad…)
├─ apps-script.gs      ← Código para pegar en Google Apps Script
└─ assets/             ← Logo, fotos de torneos
```

---

## Cómo funciona

### 1. Cliente (socio)

1. Abre `Landing Page.html` en su teléfono.
2. Llena el formulario de registro.
3. La página le **genera una tarjeta única** con su número de socio y un **QR personal**.
4. Puede **descargar la tarjeta** como imagen tipo Apple Wallet y guardarla en sus fotos.
5. En cada visita, muestra el QR al recepcionista para que lo escanee.

> El cliente NO ve contadores de visitas en su teléfono. Eso lo lleva el club en su Google Sheet.

### 2. Recepcionista (admin)

1. Abre `Admin.html` en una tablet/teléfono dedicado del club.
2. Ingresa el PIN configurado en `config.js`.
3. Selecciona la cancha en la que se está jugando.
4. La cámara queda lista para escanear. Apunta al QR del socio.
5. Cada escaneo agrega automáticamente una fila a la pestaña **"Visitas"** del Google Sheet.

### 3. Google Sheet (club)

Se crean dos pestañas automáticamente la primera vez que se reciben datos:
- **Socios** — un renglón por persona registrada.
- **Visitas** — un renglón por cada QR escaneado. Aquí el club lleva el conteo y puede hacer reportes con Pivot Tables, filtros, gráficas…

---

## Setup paso a paso

### A) Google Sheet + Apps Script (10 min)

1. Crea una nueva [Google Sheet](https://sheets.new). Ponle el nombre que quieras.
2. Ve a **Extensiones → Apps Script**.
3. Borra el código del editor y pega TODO el contenido de `apps-script.gs`.
4. Cambia el valor de `ADMIN_TOKEN` por una cadena única (ej. `padel-leon-2026`).
5. Guarda (Ctrl/Cmd + S) y ponle un nombre al proyecto.
6. Click en **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo** (tu cuenta)
   - Quién tiene acceso: **Cualquier persona**
7. Acepta los permisos. Copia la URL que termina en **/exec**.

### B) Configurar el código (2 min)

Abre `config.js` y actualiza:

```js
window.PPGJ_CONFIG = {
  webhookUrl: "https://script.google.com/macros/s/.../exec",  // ← la URL del paso A.7
  adminToken: "padel-leon-2026",                              // ← debe ser EXACTAMENTE igual al ADMIN_TOKEN del Apps Script
  club: {
    name: "Padel Park",
    sub:  "Gran Jardín",
    city: "León, Gto",
  },
};
```

### C) Publicar en GitHub Pages (5 min)

1. Crea un repositorio público en GitHub. Sube todos los archivos.
2. Ve a **Settings → Pages**.
3. En "Source" elige la rama `main` (o `master`), folder `/ (root)`.
4. Click en Save. En 1-2 minutos te dará una URL pública.

Ya está. La URL pública es para los socios. La URL `tu-sitio.github.io/Admin.html` es para el club.

---

## Recomendaciones

- **No publiques `config.js` con tu `adminToken` real si tu repo es público.** El token previene que personas externas le agreguen renglones a tu Sheet. Si tu repo es público, cualquiera que mire el código verá tu token. Opciones:
  - Marca el repo como privado (GitHub Pages funciona también con repos privados en cuentas Pro).
  - O acepta que el token es solo una barrera mínima y depende de la URL `/exec` ser desconocida.
- **El panel admin lo deja prendido el club** en su tablet de recepción. Pon la URL en favoritos / pantalla de inicio.
- **HTTPS es obligatorio** para que el navegador permita usar la cámara. GitHub Pages siempre sirve por HTTPS, así que no hay problema.
- **Permisos de cámara**: la primera vez que se abre el panel admin en un dispositivo, el navegador pedirá permiso para usar la cámara. Hay que aceptar.

---

## Personalización rápida

- **Logo y fotos** → reemplaza los archivos en `assets/`.
- **Ciudad y nombre del club** → `config.js` → `club: { … }`.
- **Beneficios mostrados al socio** → `app.jsx` → función `RewardsScreen()` → array `rewards`.
- **Estilo de la tarjeta** → 4 variantes incluidas: Classic Navy / Neon Court / Court Grid / Lime Bold. Cámbialo en `config.js` o desde el panel de Tweaks.

---

## Datos sensibles

El programa recopila: nombre, email, teléfono, fecha de nacimiento, nivel de juego.
- Estos datos solo se envían a tu Google Sheet.
- No se envían a ningún tercero.
- Asegúrate de tener la autorización de los socios para almacenarlos (avisa en el formulario).

---

## ¿Algo no funciona?

| Problema | Solución |
|---|---|
| El admin escanea pero no llega al Sheet | Revisa que `webhookUrl` en `config.js` esté completo, sin espacios, y que termine en `/exec`. |
| "Unauthorized" | El `adminToken` de `config.js` no coincide con `ADMIN_TOKEN` de Apps Script. |
| La cámara no abre | El sitio debe estar en `https://`. Acepta los permisos. En iOS funciona solo en Safari. |
| El QR no escanea | Asegúrate de que el cliente tenga su QR en pantalla a brillo alto, sin reflejos. |
| El cliente perdió su tarjeta | Que vuelva a entrar a la landing con el mismo email y nombre; le re-genera el mismo número de socio. |

---

Hecho con cariño para Padel Park Gran Jardín, León, Gto.
