// ─────────────────────────────────────────────────────────────
// api.js — comunicación con Google Sheets via Apps Script
// ─────────────────────────────────────────────────────────────
// Usamos mode: 'no-cors' + form-encoded body. Es el patrón estándar
// para Apps Script: no podemos leer la respuesta, pero la fila se
// escribe en el Sheet. Si necesitas confirmación, usa modo "demo"
// abajo para ver la consola.
// ─────────────────────────────────────────────────────────────

(function (global) {
  const cfg = global.PPGJ_CONFIG || {};

  async function sendToSheet(action, payload) {
    const url = cfg.webhookUrl;
    const body = {
      action,
      token: cfg.adminToken,
      payload,
      ts: Date.now(),
    };

    // Modo demo: no hay URL configurada — solo log, no envía.
    if (!url) {
      console.log('[PPGJ:demo]', action, body);
      return { ok: true, demo: true };
    }

    try {
      // FormData evita preflight CORS — Apps Script lee con e.parameter
      const fd = new FormData();
      fd.append('payload', JSON.stringify(body));
      await fetch(url, {
        method: 'POST',
        body: fd,
        mode: 'no-cors',
      });
      return { ok: true };
    } catch (err) {
      console.error('[PPGJ:error]', err);
      return { ok: false, error: String(err) };
    }
  }

  global.PPGJ = {
    sendToSheet,
    register: (member) => sendToSheet('register', member),
    visit:    (visit)  => sendToSheet('visit', visit),
    config:   cfg,
  };
})(window);
