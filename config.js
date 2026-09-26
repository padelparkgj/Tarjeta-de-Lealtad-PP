// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN — Padel Park Gran Jardín
// ─────────────────────────────────────────────────────────────
// Aquí solo va lo público: el nombre del club y cómo llegar a la base. Nada de
// contraseñas ni tokens — este archivo lo descarga cualquiera que abra la página.
// ─────────────────────────────────────────────────────────────

window.PPGJ_CONFIG = {
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
