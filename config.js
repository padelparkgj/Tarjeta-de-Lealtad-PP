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

  // Token del Google Sheet: lo lee SOLO api.js, que lo manda al Apps Script.
  // ⚠️ Es público —viaja en este archivo— y no protege nada del panel: el panel entra
  // con una cuenta de personal de Supabase. Si el envío al Sheet sigue o se apaga lo
  // decide Edgar; mientras, debe ser IGUAL a ADMIN_TOKEN en apps-script.gs.
  sheetToken: "padelpark-2026",

  // Configuración del club
  club: {
    name: "Padel Park",
    sub:  "Gran Jardín",
    city: "León, Gto",
  },

  // Supabase: el proyecto del POS, donde vive la lealtad desde septiembre de 2026.
  // La clave es la publicable: lo que puede hacer quien la tenga lo deciden las
  // políticas de la base, no este archivo.
  supabaseUrl: "https://mhnwbbfgrpysejuekeau.supabase.co",
  supabaseKey: "sb_publishable_Ri78Wgu10at80A-m0rW62w_AvjWaya3",
};
