/**
 * Padel Park Gran Jardín — Apps Script para registro de socios y visitas
 * ──────────────────────────────────────────────────────────────────────
 *
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheet (crea uno nuevo si es necesario).
 * 2. En el menú: Extensiones → Apps Script.
 * 3. Borra el código que viene por defecto y pega TODO este archivo.
 * 4. Cambia ADMIN_TOKEN abajo por algo único.
 *    Pega el MISMO valor en config.js (cfg.adminToken).
 * 5. Guarda (Ctrl/Cmd + S) y dale un nombre al proyecto.
 * 6. Click en Implementar → Nueva implementación.
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién tiene acceso: Cualquier persona
 * 7. Copia la URL (termina en /exec) y pégala en config.js (cfg.webhookUrl).
 * 8. Haz commit a GitHub. ¡Listo!
 *
 * Hojas que crea automáticamente:
 *   - "Socios"   → catálogo de socios (1 fila por socio)
 *   - "Visitas"  → log de visitas (1 fila por scan)
 */

const ADMIN_TOKEN = 'padelpark-2026'; // <-- CAMBIA esto. Debe coincidir con config.js

// ──────────────────────────────────────────────────────────────
// Webhook POST — recibe registros y visitas desde la landing/admin
// ──────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.parameter.payload || '{}');
    if (body.token !== ADMIN_TOKEN) {
      return json({ ok: false, error: 'unauthorized' });
    }
    if (body.action === 'register') {
      return json(handleRegister(body.payload));
    }
    if (body.action === 'visit') {
      return json(handleVisit(body.payload));
    }
    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ──────────────────────────────────────────────────────────────
// Registro de socio nuevo
// ──────────────────────────────────────────────────────────────
function handleRegister(p) {
  const sheet = getOrCreateSheet('Socios', [
    'ID Socio', 'Nombre', 'Email', 'Teléfono', 'Cumpleaños',
    'Nivel', 'Fecha registro'
  ]);
  // Evita duplicados por ID
  if (findRow(sheet, 1, p.id)) {
    return { ok: true, duplicate: true };
  }
  sheet.appendRow([
    p.id || '',
    p.name || '',
    p.email || '',
    p.phone || '',
    p.birth || '',
    p.level || '',
    p.joinedAt ? new Date(p.joinedAt) : new Date(),
  ]);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────
// Registro de visita (escaneo de QR desde el panel admin)
// ──────────────────────────────────────────────────────────────
function handleVisit(p) {
  const sheet = getOrCreateSheet('Visitas', [
    'Fecha', 'ID Socio', 'Nombre', 'Cancha'
  ]);
  sheet.appendRow([
    p.scannedAt ? new Date(p.scannedAt) : new Date(),
    p.memberId || '',
    p.name || '',
    p.court || '',
  ]);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────
// Utilidades
// ──────────────────────────────────────────────────────────────
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0e1d57')
      .setFontColor('#b8f24a');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRow(sheet, col, value) {
  const data = sheet.getRange(2, col, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(value)) return i + 2; // 1-indexed + header
  }
  return null;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────────────────────
// Endpoint GET opcional — para verificar que el deploy funciona
// Pruébalo en el navegador: tu_url_exec?ping=1
// ──────────────────────────────────────────────────────────────
function doGet(e) {
  return json({ ok: true, service: 'PadelPark GJ', ts: new Date().toISOString() });
}
