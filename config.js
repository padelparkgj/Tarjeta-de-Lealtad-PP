// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN — Padel Park Gran Jardín
// ─────────────────────────────────────────────────────────────
// 1. Crea tu Google Sheet siguiendo el README.
// 2. Pega aquí la URL del Web App de Google Apps Script (termina en /exec).
// 3. Guarda y haz commit. Listo.
// ─────────────────────────────────────────────────────────────

window.PPGJ_CONFIG = {
  // URL del webhook (Google Apps Script Web App). Déjala vacía para correr en modo demo (no escribe al Sheet).
  webhookUrl: "https://script.google.com/macros/s/AKfycbwhc3OOGuHj0QPzvjUqwINDEWzQLwfpD54pm-vtVDGj_L4OTHgpW6_g6JwJJ1w2zTi5yg/exec",

  // Token simple para que solo el admin pueda escribir desde la página admin.
  // Cámbialo por algo único y pégalo IGUAL en apps-script.gs (constante ADMIN_TOKEN).
  adminToken: "padelpark-2026",

  // Configuración del club
  club: {
    name: "Padel Park",
    sub:  "Gran Jardín",
    city: "León, Gto",
  },

  // Supabase (auth + base de datos de socios)
  supabaseUrl: "https://fsuqslgmilyqkutyvvdl.supabase.co",
  supabaseKey: "sb_publishable_znGU1rUioJvgnUD-FmsxIw_kEaJFMW6",
};
