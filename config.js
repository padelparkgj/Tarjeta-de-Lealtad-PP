// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN — Padel Park Gran Jardín
// ─────────────────────────────────────────────────────────────
// 1. Crea tu Google Sheet siguiendo el README.
// 2. Pega aquí la URL del Web App de Google Apps Script (termina en /exec).
// 3. Guarda y haz commit. Listo.
// ─────────────────────────────────────────────────────────────

window.PPGJ_CONFIG = {
  // URL del webhook (Google Apps Script Web App). Déjala vacía para correr en modo demo (no escribe al Sheet).
  webhookUrl: "",

  // Token simple para que solo el admin pueda escribir desde la página admin.
  // Cámbialo por algo único y pégalo IGUAL en apps-script.gs (constante ADMIN_TOKEN).
  adminToken: "padelpark-2026",

  // Configuración del club
  club: {
    name: "Padel Park",
    sub:  "Gran Jardín",
    city: "León, Gto",
  },
};
