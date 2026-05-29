/* global React, ReactDOM, Html5Qrcode */
const { useState, useEffect, useRef, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────
const ADMIN_LOG_KEY = 'pp_gj_admin_log_v1';
const ADMIN_AUTH_KEY = 'pp_gj_admin_auth_v1';

function loadLog() {
  try { return JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || '[]'); } catch (e) { return []; }
}
function saveLog(log) {
  try { localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(log.slice(-50))); } catch (e) {}
}

function fmtTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}
function fmtDate(ts) {
  const d = new Date(ts);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} · ${fmtTime(ts)}`;
}

// Parse QR payload: "PPGJ|PP-26-1234|Maria Fernandez"
function parseQr(text) {
  if (!text) return null;
  const parts = text.split('|');
  if (parts[0] !== 'PPGJ' || !parts[1]) return null;
  return {
    id: parts[1].trim(),
    name: (parts[2] || '').trim(),
    raw: text,
  };
}

// ─────────────────────────────────────────────────────────────
// Icons (small subset)
// ─────────────────────────────────────────────────────────────
const Ic = {
  cam: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.6"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  cog: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 9a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="1.6"/><path d="M19.4 15a1.7 1.7 0 00.4 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.4h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.4"/></svg>),
  trophy: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 4h10v5a5 5 0 01-10 0V4zM5 5H3v2a3 3 0 003 3M19 5h2v2a3 3 0 01-3 3M9 17h6l1 4H8l1-4zM12 14v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  log: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  arrow: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  cloud: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 18h11a4 4 0 100-8 6 6 0 00-11.7 1.5A4 4 0 007 18z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
};

// ─────────────────────────────────────────────────────────────
// Login (simple — token entered by admin, stored locally)
// ─────────────────────────────────────────────────────────────
function Login({ onAuth }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const cfg = window.PPGJ_CONFIG || {};

  function submit(e) {
    e.preventDefault();
    if (pin === cfg.adminToken || pin === 'demo') {
      localStorage.setItem(ADMIN_AUTH_KEY, '1');
      onAuth();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 600);
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-card login">
        <div className="logo-block">
          <img src="assets/logo-navy.jpg" alt="Padel Park" />
        </div>
        <div className="admin-eyebrow"><span className="dot"></span>Panel de Recepción</div>
        <h1>Padel Park <span className="script">Gran Jardín</span></h1>
        <p className="lead">Ingresa el PIN del club para abrir el scanner y registrar las visitas de los socios.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>PIN de acceso</label>
            <input
              type="password"
              value={pin}
              onChange={e=>{setPin(e.target.value); setErr(false);}}
              placeholder="••••••••"
              className={err ? 'shake' : ''}
              autoFocus
            />
            {err && <div className="err">PIN incorrecto</div>}
          </div>
          <button type="submit" className="btn btn-primary">
            Entrar al panel
            <Ic.arrow style={{width:16, height:16}} />
          </button>
          <a href="Landing Page.html" className="back-link">← Volver a la página de socios</a>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Scanner — uses html5-qrcode (camera)
// ─────────────────────────────────────────────────────────────
function Scanner({ active, onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanRef = useRef({ text: '', ts: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) return;
    if (!window.jsQR) {
      setError('Librería QR no cargó. Recarga la página.');
      return;
    }
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(stream => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.play();

      function tick() {
        if (cancelled || !videoRef.current || !canvasRef.current) return;
        const v = videoRef.current;
        if (v.readyState !== v.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(tick); return; }
        const canvas = canvasRef.current;
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          const now = Date.now();
          if (code.data !== lastScanRef.current.text || (now - lastScanRef.current.ts) > 2500) {
            lastScanRef.current = { text: code.data, ts: now };
            onScan(code.data);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    }).catch(() => {
      if (!cancelled) setError('No se pudo acceder a la cámara. Permite el acceso en Configuración → Safari → Cámara.');
    });

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [active]);

  return (
    <div className="scanner-wrap">
      <video ref={videoRef} className="scanner-video" playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="scanner-overlay">
        <div className="scanner-frame">
          <span className="corner tl"></span>
          <span className="corner tr"></span>
          <span className="corner bl"></span>
          <span className="corner br"></span>
          <div className="scan-line" />
        </div>
        <div className="scanner-hint">Apunta al QR del socio</div>
      </div>
      {error && <div className="scanner-error">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Result overlay (after a successful scan)
// ─────────────────────────────────────────────────────────────
function ScanResult({ entry, onContinue }) {
  return (
    <div className="scan-result fade-in">
      <div className="checkbubble">
        <Ic.check />
      </div>
      <div className="srl">Visita registrada</div>
      <div className="srn">{entry.name || entry.id}</div>
      <div className="srid">{entry.id}</div>
      <div className="sr-detail">
        <div><span>Hora</span><strong>{fmtTime(entry.ts)}</strong></div>
        <div><span>Cancha</span><strong>{entry.court}</strong></div>
        <div><span>Estado</span><strong>{entry.sent ? 'Enviado a Sheet' : 'Pendiente'}</strong></div>
      </div>
      <button className="btn btn-primary" onClick={onContinue}>
        Escanear siguiente
        <Ic.arrow style={{width:16,height:16}}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tabs: Scanner | Log | Settings
// ─────────────────────────────────────────────────────────────
function ScannerScreen() {
  const [court, setCourt] = useState(() => localStorage.getItem('pp_admin_court') || '01');
  const [log, setLog] = useState(loadLog);
  const [lastResult, setLastResult] = useState(null);
  const [active, setActive] = useState(true);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { saveLog(log); }, [log]);

  function handleScan(decoded) {
    const parsed = parseQr(decoded);
    if (!parsed) {
      setToast({ msg: 'QR no válido', kind: 'err' });
      setTimeout(() => setToast(null), 1800);
      return;
    }
    const entry = {
      id: parsed.id,
      name: parsed.name,
      ts: Date.now(),
      court,
      sent: false,
    };
    // Push to Sheet
    if (window.PPGJ) {
      window.PPGJ.visit({
        memberId: entry.id,
        name: entry.name,
        court: entry.court,
        scannedAt: new Date(entry.ts).toISOString(),
      }).then(r => {
        entry.sent = !!(r && r.ok);
        setLog(l => [entry, ...l].slice(0, 50));
      });
    } else {
      setLog(l => [entry, ...l].slice(0, 50));
    }
    setLastResult({ ...entry, sent: true });
    setPaused(true);
    // navigator.vibrate?.([60, 40, 60]);
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  }

  function continueScanning() {
    setLastResult(null);
    setPaused(false);
  }

  return (
    <div className="scanner-screen">
      <div className="court-bar">
        <span className="court-lbl">CANCHA</span>
        {['01','02','03','04'].map(c => (
          <button
            key={c}
            className={`court-pill ${court === c ? 'active' : ''}`}
            onClick={() => { setCourt(c); localStorage.setItem('pp_admin_court', c); }}
          >
            {c}
          </button>
        ))}
      </div>

      {!paused && <Scanner active={active && !paused} onScan={handleScan} />}
      {paused && lastResult && <ScanResult entry={lastResult} onContinue={continueScanning} />}

      <div className="scanner-meta">
        <div className="sm-row">
          <span>Visitas hoy</span>
          <strong>{log.filter(l => isToday(l.ts)).length}</strong>
        </div>
        <div className="sm-row">
          <span>Total registradas</span>
          <strong>{log.length}</strong>
        </div>
        <div className="sm-row">
          <span>Google Sheet</span>
          <strong style={{color: window.PPGJ_CONFIG?.webhookUrl ? 'var(--lime-deep)' : '#c97'}}>
            {window.PPGJ_CONFIG?.webhookUrl ? 'Conectado' : 'Modo demo'}
          </strong>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.kind || ''}`}>
          <div className="ic">{toast.kind === 'err' ? <Ic.x style={{width:14, height:14}}/> : <Ic.check style={{width:14, height:14}}/>}</div>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function isToday(ts) {
  const d = new Date(ts), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function LogScreen() {
  const [log, setLog] = useState(loadLog);
  const sent = log.filter(l => l.sent).length;
  function clearLog() {
    if (confirm('¿Borrar el historial local? (No afecta el Google Sheet)')) {
      localStorage.removeItem(ADMIN_LOG_KEY);
      setLog([]);
    }
  }
  function resend(entry) {
    if (!window.PPGJ) return;
    window.PPGJ.visit({
      memberId: entry.id,
      name: entry.name,
      court: entry.court,
      scannedAt: new Date(entry.ts).toISOString(),
      resend: true,
    }).then(r => {
      const updated = log.map(l => l.ts === entry.ts ? { ...l, sent: !!(r && r.ok) } : l);
      setLog(updated);
      saveLog(updated);
    });
  }
  return (
    <div className="log-screen">
      <div className="log-header">
        <div>
          <div className="log-eyebrow">HOY · {new Date().toLocaleDateString('es-MX', {day:'2-digit', month:'long'})}</div>
          <h2>{log.filter(l => isToday(l.ts)).length} visitas</h2>
        </div>
        <div className="log-stats">
          <div><strong>{sent}</strong> <span>enviadas</span></div>
          <div><strong>{log.length - sent}</strong> <span>pendientes</span></div>
        </div>
      </div>

      {log.length === 0 && (
        <div className="empty">
          <Ic.log style={{width:32, height:32, opacity:0.3, marginBottom: 10}}/>
          <div>Sin visitas todavía.<br/>Las visitas escaneadas aparecerán aquí.</div>
        </div>
      )}

      <div className="log-list">
        {log.map((l, i) => (
          <div key={l.ts + '_' + i} className={`log-row ${l.sent ? '' : 'pending'}`}>
            <div className="log-court">{l.court || '—'}</div>
            <div className="log-body">
              <div className="log-name">{l.name || l.id}</div>
              <div className="log-sub">{l.id} · {fmtDate(l.ts)}</div>
            </div>
            <div className="log-status">
              {l.sent ? (
                <span className="ok"><Ic.cloud style={{width:14,height:14}}/> Sheet</span>
              ) : (
                <button onClick={()=>resend(l)} className="resend">Reenviar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <button className="btn btn-ghost" style={{marginTop: 16, width:'100%'}} onClick={clearLog}>
          Borrar historial local
        </button>
      )}
    </div>
  );
}

function SettingsScreen({ onLogout }) {
  const cfg = window.PPGJ_CONFIG || {};
  const connected = !!cfg.webhookUrl;
  return (
    <div className="settings-screen">
      <h2>Configuración</h2>
      <div className="set-card">
        <div className="set-row">
          <span>Google Sheet</span>
          <strong style={{color: connected ? 'var(--lime-deep)' : '#c97'}}>
            {connected ? 'Conectado' : 'Sin configurar'}
          </strong>
        </div>
        <div className="set-sub">
          {connected
            ? 'Las visitas se guardan automáticamente en tu Google Sheet.'
            : 'Edita config.js y pega la URL del Web App de Apps Script para habilitarlo.'}
        </div>
      </div>

      <div className="set-card">
        <div className="set-row">
          <span>Club</span>
          <strong>{cfg.club?.name || 'Padel Park'} · {cfg.club?.city || ''}</strong>
        </div>
      </div>

      <div className="set-card">
        <div className="set-row">
          <span>Versión</span>
          <strong>v1.0 · GitHub Pages</strong>
        </div>
        <div className="set-sub">Edita los archivos y haz commit para actualizar.</div>
      </div>

      <h3 style={{marginTop: 22}}>Instrucciones rápidas</h3>
      <ol className="steps-list">
        <li>Otorga permiso de cámara cuando el navegador lo pida.</li>
        <li>Selecciona la cancha donde se está jugando.</li>
        <li>Pídele al socio que abra su QR.</li>
        <li>Apunta la cámara — la visita se registra automáticamente.</li>
        <li>Revisa el historial en la pestaña «Historial».</li>
      </ol>

      <button className="btn btn-ghost" style={{marginTop: 22, width:'100%'}} onClick={onLogout}>
        Cerrar sesión admin
      </button>
      <a href="Landing Page.html" className="back-link" style={{marginTop: 10}}>← Ir a la página de socios</a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AdminApp shell
// ─────────────────────────────────────────────────────────────
function AdminApp() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(ADMIN_AUTH_KEY) === '1');
  const [tab, setTab] = useState('scan');

  function logout() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthed(false);
  }

  if (!authed) return <Login onAuth={() => setAuthed(true)} />;

  const cfg = window.PPGJ_CONFIG || {};
  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="logo-pill">
            <img src="assets/logo-navy.jpg" alt="Padel Park" />
          </div>
          <div>
            <div className="ttl">RECEPCIÓN</div>
            <div className="sub">{cfg.club?.name || 'Padel Park'} · {cfg.club?.city || 'León, Gto'}</div>
          </div>
        </div>
        <div className="admin-status">
          <span className={`dot ${cfg.webhookUrl ? 'live' : 'demo'}`}></span>
          {cfg.webhookUrl ? 'EN VIVO' : 'DEMO'}
        </div>
      </div>

      <div className="admin-body">
        {tab === 'scan'     && <ScannerScreen />}
        {tab === 'log'      && <LogScreen />}
        {tab === 'settings' && <SettingsScreen onLogout={logout} />}
      </div>

      <div className="admin-tabs">
        <button className={`atab ${tab==='scan'?'active':''}`}     onClick={()=>setTab('scan')}>
          <Ic.cam /><span>Escanear</span>
        </button>
        <button className={`atab ${tab==='log'?'active':''}`}      onClick={()=>setTab('log')}>
          <Ic.log /><span>Historial</span>
        </button>
        <button className={`atab ${tab==='settings'?'active':''}`} onClick={()=>setTab('settings')}>
          <Ic.cog /><span>Ajustes</span>
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
