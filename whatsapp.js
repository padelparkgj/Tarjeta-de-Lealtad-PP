// ─────────────────────────────────────────────────────────────
// WhatsApp helper — wa.me pre-filled links (no API account needed yet)
// Padel Park Gran Jardín
// ─────────────────────────────────────────────────────────────
(function () {
  function normalizePhone(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 10) return '52' + digits;
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    return digits.length >= 10 ? digits : null;
  }

  function buildLink(phone, message) {
    const n = normalizePhone(phone);
    return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
  }

  function signupMessage({ playerName, tournamentTitle, eventDateLabel, partnerName }) {
    return `Hola ${playerName}! Quedaste inscrito(a) al torneo "${tournamentTitle}"${eventDateLabel ? ' el ' + eventDateLabel : ''}.` +
      (partnerName ? ` Tu pareja: ${partnerName}.` : ' Aún no tienes pareja asignada — te avisamos en cuanto la tengas.') +
      ` — Padel Park Gran Jardín`;
  }

  function matchReminderMessage({ playerName, court, timeLabel, partnerName, opponent1, opponent2 }) {
    return `Hola ${playerName}! Tu partido es a las ${timeLabel} en la cancha ${court}, junto con ${partnerName || 'tu pareja'}, ` +
      `contra ${opponent1} / ${opponent2}. ¡Suerte! — Padel Park Gran Jardín`;
  }

  function nextUpMessage({ playerName, court, partnerName, opponent1, opponent2 }) {
    return `Hola ${playerName}! Ya casi es tu turno en la cancha ${court} junto con ${partnerName || 'tu pareja'}, ` +
      `contra ${opponent1} / ${opponent2}. Preséntate en unos minutos. — Padel Park Gran Jardín`;
  }

  // Single send call site — swap this body for a real API (Meta Cloud API /
  // Twilio) later without touching any of the callers.
  function sendWhatsApp(phone, message) {
    const link = buildLink(phone, message);
    if (!link) return { ok: false, reason: 'invalid_phone' };
    window.open(link, '_blank');
    return { ok: true };
  }

  window.PPWhatsApp = { normalizePhone, buildLink, signupMessage, matchReminderMessage, nextUpMessage, sendWhatsApp };
})();
