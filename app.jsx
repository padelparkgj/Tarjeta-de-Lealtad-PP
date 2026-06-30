/* global React, ReactDOM, qrcode */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const STORAGE_KEY = 'pp_gj_member_v1';

// ──────────────────────────────────────────────────────────────
// Small util — deterministic hash from a string
// ──────────────────────────────────────────────────────────────
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function memberIdFrom(name, email) {
  const seed = hashStr((name || '') + '|' + (email || '') + '|' + Date.now());
  const part = (seed % 9000 + 1000).toString();
  const yr = new Date().getFullYear().toString().slice(-2);
  return `PP-${yr}-${part}`;
}

function tierFor(visits) {
  if (visits >= 50) return { key: 'legend', label: 'Legend' };
  if (visits >= 25) return { key: 'gold',   label: 'Gold'  };
  if (visits >= 10) return { key: 'silver', label: 'Silver'};
  return { key: 'bronze', label: 'Bronze' };
}

function fmtDate(ts) {
  const d = new Date(ts);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ──────────────────────────────────────────────────────────────
// QR code generation — returns SVG string
// ──────────────────────────────────────────────────────────────
function generateQrSvg(text, opts = {}) {
  const { dark = '#0e1d57', light = '#ffffff', size = 240, margin = 1 } = opts;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const cells = qr.getModuleCount();
    const cellSize = size / (cells + margin * 2);
    let rects = '';
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${dark}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${light}"/>${rects}</svg>`;
  } catch (e) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${light}"/><text x="50%" y="50%" text-anchor="middle" font-family="monospace" font-size="14" fill="${dark}">QR ${text.slice(0,8)}</text></svg>`;
  }
}

// ──────────────────────────────────────────────────────────────
// Tiny icons
// ──────────────────────────────────────────────────────────────
const Ic = {
  ball: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3.5 9c4 2 13 2 17 0M3.5 15c4-2 13-2 17 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
    </svg>
  ),
  gift: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 12v8h18v-8M2 8h20v4H2zM12 8v12M8 8c-2 0-3-1.5-3-3s2-3 4-2 3 5 3 5M16 8c2 0 3-1.5 3-3s-2-3-4-2-3 5-3 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  trophy: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M7 4h10v5a5 5 0 01-10 0V4zM5 5H3v2a3 3 0 003 3M19 5h2v2a3 3 0 01-3 3M9 17h6l1 4H8l1-4zM12 14v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  qr: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  card: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="2" y="6" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 10h20M6 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  list: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

// ──────────────────────────────────────────────────────────────
// Winners carousel — auto-rotating tournament photos
// ──────────────────────────────────────────────────────────────
const WINNERS = [
  'assets/winners/w1.png',
  'assets/winners/w2.png',
  'assets/winners/w3.png',
  'assets/winners/w4.png',
  'assets/winners/w5.png',
  'assets/winners/w6.png',
];

function WinnersCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % WINNERS.length), 3800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="winners-carousel">
      {WINNERS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Ganadores torneo ${i+1}`}
          className={`wc-img ${i === idx ? 'is-active' : ''}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      <div className="wc-dots">
        {WINNERS.map((_, i) => (
          <button
            key={i}
            className={`wc-dot ${i === idx ? 'is-active' : ''}`}
            onClick={() => setIdx(i)}
            aria-label={`Foto ${i+1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Easter egg modal
// ──────────────────────────────────────────────────────────────
function EasterEgg({ onClose }) {
  return (
    <div className="ee-overlay" onClick={onClose}>
      <div className="ee-card" onClick={e => e.stopPropagation()}>
        <div className="ee-logo">
          <img src="assets/logo-navy.jpg" alt="PP" />
        </div>
        <div className="ee-name">Padel Park Gran Jardín</div>
        <div className="ee-version">v2.0 · Tarjeta de Lealtad</div>
        <div className="ee-divider" />
        <div className="ee-made">Desarrollado por</div>
        <div className="ee-creator">ProcesaLab</div>
        <div className="ee-sub">by EAJDR</div>
        <button className="ee-close" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TopBar
// ──────────────────────────────────────────────────────────────
function TopBar({ right }) {
  const [taps,    setTaps]    = useState(0);
  const [showEgg, setShowEgg] = useState(false);
  const resetRef = useRef(null);

  function handleLogoTap() {
    clearTimeout(resetRef.current);
    const next = taps + 1;
    if (next >= 6) {
      setTaps(0);
      setShowEgg(true);
    } else {
      setTaps(next);
      resetRef.current = setTimeout(() => setTaps(0), 1800);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="logo-pill" onClick={handleLogoTap} style={{cursor:'pointer'}}>
            <img src="assets/logo-navy.jpg" alt="Padel Park Gran Jardín" />
          </div>
        </div>
        <div className="right">{right || ''}</div>
      </div>
      {showEgg && <EasterEgg onClose={() => setShowEgg(false)} />}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Loading screen (while checking Supabase session)
// ──────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="generating">
      <div className="preview-card" style={{animation:'pulse 1.5s ease-in-out infinite'}} />
      <h3>Cargando...</h3>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Login form
// ──────────────────────────────────────────────────────────────
function LoginForm({ onBack, onSuccess }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [busy,     setBusy]     = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setError(null);

    const { data, error: err } = await window.PPSb.signIn(email.trim().toLowerCase(), password);
    if (err) {
      setError('Correo o contraseña incorrectos.');
      setBusy(false);
      return;
    }

    const { data: row } = await window.PPSb.getMember(data.user.id);
    onSuccess(row ? { ...row, id: row.member_id } : null);
  }

  return (
    <div className="scroll fade-in">
      <TopBar right="ACCESO" />
      <div className="form-wrap">
        <div className="step">Bienvenido de vuelta</div>
        <h2>Inicia<br/>sesión.</h2>
        <p className="sub">Usa el correo y contraseña que registraste al crear tu tarjeta.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="maria@correo.com" autoComplete="email" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={busy}>
            {busy ? 'Entrando…' : 'Iniciar sesión'}
            {!busy && <span className="arrow"><Ic.arrow style={{width:18,height:18}} /></span>}
          </button>
          <button type="button" className="btn btn-ghost" style={{width:'100%',marginTop:10}} onClick={onBack}>
            Regresar
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PWA install prompt
// ──────────────────────────────────────────────────────────────
const INSTALL_DISMISS_KEY = 'pp_install_dismissed';
const INSTALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredEvt, setDeferredEvt] = useState(null);

  const isIOS       = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true
                    || window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    if (isStandalone) return;

    // Check cooldown
    const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < INSTALL_COOLDOWN_MS) return;

    if (isIOS) {
      const t = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(t);
    }

    // Android / desktop Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredEvt(e);
      const t = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(t);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (deferredEvt) {
      deferredEvt.prompt();
      const { outcome } = await deferredEvt.userChoice;
      if (outcome === 'accepted') setDeferredEvt(null);
    }
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="install-prompt">
      <img src="icons/icon-192.png" className="install-icon" alt="icono" />
      <div className="install-text">
        <strong>Agrega la app a tu inicio</strong>
        {isIOS
          ? <span>Toca <span className="install-share-icon">↑</span> y luego <em>"Agregar a pantalla de inicio"</em></span>
          : <span>Úsala como app — sin abrir el navegador.</span>
        }
      </div>
      {!isIOS && deferredEvt && (
        <button className="install-btn" onClick={install}>Agregar</button>
      )}
      <button className="install-close" onClick={dismiss} aria-label="Cerrar">✕</button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Welcome screen
// ──────────────────────────────────────────────────────────────
function Welcome({ onStart, onLogin }) {
  return (
    <div className="scroll fade-in">
      <TopBar right="LEÓN ·" />
      <div className="hero">
        <span className="eyebrow"><span className="dot"></span>Programa de Lealtad</span>
        <h1>
          Cada visita<br />
          te <span className="accent">acerca</span><br />
          a la cancha.
        </h1>
        <p className="lead">Tu tarjeta personal, generada al instante. Acumula visitas, sube de nivel y desbloquea horas gratis en Padel Park Gran Jardín.</p>
      </div>

      <AnnouncementBanner member={null} />

      <div className="photo-card">
        <WinnersCarousel />
        <div className="badge">CAMPEONES PP</div>
        <div className="ribbon">
          <div>Únete hoy<br /><strong>DISFRUTA LOS BENEFICIOS</strong></div>
          <div style={{textAlign:'right', opacity: 0.8, fontSize: 11}}>Cancha 01<br/>León, Gto</div>
        </div>
      </div>

      <div className="perks">
        <div className="perk">
          <div className="icon"><Ic.bolt /></div>
          <div className="label">Tarjeta única</div>
          <div className="sub">Diseño y código generados solo para ti.</div>
        </div>
        <div className="perk">
          <div className="icon"><Ic.qr /></div>
          <div className="label">QR de visita</div>
          <div className="sub">Escanéalo en recepción cada vez que juegues.</div>
        </div>
        <div className="perk">
          <div className="icon"><Ic.gift /></div>
          <div className="label">Recompensas</div>
          <div className="sub">Hora gratis, raqueta y torneo VIP.</div>
        </div>
        <div className="perk">
          <div className="icon"><Ic.trophy /></div>
          <div className="label">Visita gratis</div>
          <div className="sub">Cada 6 visitas, la siguiente es completamente gratis.</div>
        </div>
      </div>

      <div className="cta-row">
        <button className="btn btn-primary" onClick={onStart}>
          Crear mi tarjeta
          <span className="arrow"><Ic.arrow style={{width:18,height:18}} /></span>
        </button>
        <button className="btn btn-ghost" onClick={onLogin}>Iniciar sesión</button>
      </div>

      <AnnouncementBanner member={null} />

      <footer className="landing-footer">
        <a
          href="https://www.instagram.com/padel_park_granjardin?igsh=NGpvMjRsbHZ2eTRl&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-ig"
        >
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.7"/>
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
          </svg>
          @padel_park_granjardin
        </a>
        <a
          href="https://wa.me/524773944948"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-wa"
        >
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.41A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d="M8.5 9.5c.5 1 1.5 3 3.5 4.5s3.5 1.5 4 1.5c0-.5-.5-1.5-1-2l-1-.5c-.5 0-1 .5-1.5.5C11 13 10 11.5 9.5 10.5L9 9.5C9 9 9.5 8.5 9.5 8s-.5-1-.5-1.5C8 6.5 7.5 8 7.5 8.5s.5.5 1 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          477 394 4948
        </a>
        <div className="footer-copy">© {new Date().getFullYear()} Padel Park Gran Jardín · León, Gto</div>
      </footer>
      <InstallPrompt />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Registration form
// ──────────────────────────────────────────────────────────────
function RegisterForm({ onBack, onSubmit, authError }) {
  const [data, setData] = useState({
    name: '', email: '', password: '', phone: '', birth: '', level: 'Intermedio', terms: false
  });
  const [errors, setErrors] = useState({});

  function set(k, v) { setData(d => ({...d, [k]: v})); setErrors(e => ({...e, [k]: null})); }

  function submit(e) {
    e.preventDefault();
    const err = {};
    if (!data.name.trim() || data.name.trim().length < 2) err.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) err.email = true;
    if (!data.password || data.password.length < 6) err.password = true;
    if (!/^\+?\d[\d\s\-]{7,}$/.test(data.phone)) err.phone = true;
    if (!data.terms) err.terms = true;
    setErrors(err);
    if (Object.keys(err).length === 0) onSubmit(data);
  }

  return (
    <div className="scroll fade-in">
      <TopBar right="02 / 04" />
      <div className="form-wrap">
        <div className="step">Paso 1 de 2</div>
        <h2>Cuéntanos<br/>quién eres.</h2>
        <p className="sub">Con estos datos generamos tu tarjeta única — diseño, número y QR personal.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Nombre completo</label>
            <input value={data.name} onChange={e=>set('name', e.target.value)} placeholder="María Fernández" style={errors.name ? {borderColor:'#d44'} : null} />
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input type="email" value={data.email} onChange={e=>set('email', e.target.value)} placeholder="maria@correo.com" autoComplete="email" style={errors.email ? {borderColor:'#d44'} : null} />
          </div>
          <div className="field">
            <label>Contraseña <span style={{opacity:0.5,fontWeight:400}}>(mín. 6 caracteres)</span></label>
            <input type="password" value={data.password} onChange={e=>set('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" style={errors.password ? {borderColor:'#d44'} : null} />
            {errors.password && <span className="field-error-inline">Mínimo 6 caracteres</span>}
          </div>
          <div className="field-row">
            <div className="field">
              <label>Teléfono</label>
              <input value={data.phone} onChange={e=>set('phone', e.target.value)} placeholder="+52 81 ..." style={errors.phone ? {borderColor:'#d44'} : null} />
            </div>
            <div className="field">
              <label>Cumpleaños</label>
              <input type="date" value={data.birth} onChange={e=>set('birth', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Nivel de juego</label>
            <div className="level-row">
              {['Principiante','Intermedio','Avanzado'].map(lvl => (
                <button type="button" key={lvl} className={`level-pill ${data.level===lvl?'active':''}`} onClick={()=>set('level', lvl)}>{lvl}</button>
              ))}
            </div>
          </div>

          <label className="terms">
            <input type="checkbox" checked={data.terms} onChange={e=>set('terms', e.target.checked)} />
            <span>Acepto recibir comunicación de Padel Park Gran Jardín y los <a href="#">términos del programa</a>.</span>
          </label>

          {authError && <p className="field-error">{authError}</p>}

          <button type="submit" className="btn btn-primary" style={{width:'100%'}}>
            Generar mi tarjeta
            <span className="arrow"><Ic.arrow style={{width:18,height:18}} /></span>
          </button>
          <button type="button" className="btn btn-ghost" style={{width:'100%', marginTop: 10}} onClick={onBack}>Regresar</button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Generating screen — animated card creation
// ──────────────────────────────────────────────────────────────
function Generating({ onDone, formData }) {
  const steps = [
    'Reservando número de socio',
    'Componiendo diseño único',
    'Generando código QR personal',
    'Activando tu primera visita'
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= steps.length) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx(i => i + 1), 700 + Math.random()*300);
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div className="generating">
      <div className="preview-card" />
      <h3>Creando tu tarjeta</h3>
      <p className="gen-sub">Esto toma solo un momento, {(formData.name||'jugador').split(' ')[0]}.</p>
      <div className="gen-steps">
        {steps.map((s, i) => (
          <div key={i} className={`gen-step ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}>
            <div className="tick">{i < idx ? <Ic.check style={{width:12,height:12}} /> : null}</div>
            <div>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Loyalty Card visual
// ──────────────────────────────────────────────────────────────
function LoyaltyCard({ member, style = 'classic', onClick }) {
  const since = new Date(member.joinedAt).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
  return (
    <div className={`loyalty-card style-${style}`} onClick={onClick}>
      <div className="lc-bg" />
      <div className="lc-pattern" />
      <div className="lc-grain" />
      <div className="lc-content">
        <div className="lc-top">
          <div className="lc-brand">
            PADEL PARK
            <span className="sub">Gran Jardín</span>
          </div>
          <div className="lc-chip" />
        </div>
        <div className="lc-mid">
          {member.id}
        </div>
        <div className="lc-bottom">
          <div>
            <div className="lc-member">Miembro</div>
            <div className="lc-name">{member.name.toUpperCase()}</div>
          </div>
          <div className="lc-tier">
            <div className="lbl">Desde</div>
            <div className="val">{since.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// QR modal — full screen QR for receptionist to scan
// ──────────────────────────────────────────────────────────────
function QrModal({ member, onClose }) {
  const qrSvg = useMemo(() =>
    generateQrSvg(`PPGJ|${member.id}|${member.name}`, { dark: '#0e1d57', light: '#ffffff', size: 280 }),
  [member.id, member.name]);

  const tapRef = useRef(null);
  function handleTap() {
    if (tapRef.current) {
      clearTimeout(tapRef.current);
      tapRef.current = null;
      onClose();
    } else {
      tapRef.current = setTimeout(() => { tapRef.current = null; }, 350);
    }
  }

  return (
    <div className="qr-modal" onDoubleClick={onClose} onClick={handleTap}>
      <button className="close" onClick={e => { e.stopPropagation(); onClose(); }}><Ic.close /></button>
      <div className="qr-box">
        <div dangerouslySetInnerHTML={{__html: qrSvg}} />
      </div>
      <div className="mtitle">{member.id}</div>
      <div className="msub">Muéstrale este código al recepcionista para registrar tu visita.</div>
      <div className="qr-hint-row">
        <span className="qr-hint-dot" />
        Listo para escanear
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Wallet Card — Apple Wallet-style downloadable image
// ──────────────────────────────────────────────────────────────
function WalletCard({ member, qrSvg, innerRef }) {
  const cfg = (typeof window !== 'undefined' && window.PPGJ_CONFIG) || {};
  const since = new Date(member.joinedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div ref={innerRef} className="wallet-card">
      <div className="wc-band">
        <div className="wc-logo">
          <img src="assets/logo-navy.jpg" alt="" />
        </div>
        <div className="wc-band-text">
          <div className="wc-brand">PADEL PARK</div>
          <div className="wc-script">Gran Jardín</div>
        </div>
        <div className="wc-tag">SOCIO</div>
      </div>

      <div className="wc-name-row">
        <div className="wc-name-lbl">Nombre</div>
        <div className="wc-name">{member.name.toUpperCase()}</div>
      </div>

      <div className="wc-meta-row">
        <div>
          <div className="wc-meta-lbl">Socio</div>
          <div className="wc-meta-val">{member.id}</div>
        </div>
        <div>
          <div className="wc-meta-lbl">Nivel</div>
          <div className="wc-meta-val">{(member.level || 'Intermedio').toUpperCase()}</div>
        </div>
        <div>
          <div className="wc-meta-lbl">Miembro desde</div>
          <div className="wc-meta-val">{since}</div>
        </div>
      </div>

      <div className="wc-qr-wrap">
        <div className="wc-qr" dangerouslySetInnerHTML={{__html: qrSvg}} />
        <div className="wc-qr-hint">Muestra este código<br/>en recepción</div>
      </div>

      <div className="wc-foot">
        <div className="wc-foot-arc" />
        <div className="wc-foot-text">
          <strong>PADEL PARK · GRAN JARDÍN</strong>
          <span>{(cfg.club && cfg.club.city) || 'León, Gto'}</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Card screen — tarjeta visual + descarga wallet + QR
// ──────────────────────────────────────────────────────────────
function isBirthdayMonth(birth) {
  if (!birth || birth.length < 7) return false;
  const parts = birth.split('-');
  const m = parseInt(parts[1] || '0');
  return m === new Date().getMonth() + 1;
}

function CardScreen({ member, cardStyle, onOpenQr }) {
  const qrSvgWallet = useMemo(() =>
    generateQrSvg(`PPGJ|${member.id}|${member.name}`, { dark: '#0e1d57', light: '#ffffff', size: 360 }),
  [member.id, member.name]);

  const walletRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // ── Visits from Supabase ──
  const [visits, setVisits] = useState([]);
  const [visitsReady, setVisitsReady] = useState(false);

  useEffect(() => {
    const mid = member.member_id || member.id;
    if (!window.PPSb || !mid) { setVisitsReady(true); return; }
    window.PPSb.getMemberVisits(mid).then(({ data }) => {
      setVisits(data || []);
      setVisitsReady(true);
    });
  }, [member.member_id, member.id]);

  const totalVisits = visits.length;
  const nextVisit   = totalVisits + 1;
  const nextPromo   = nextVisit % 6 === 0 ? 'free' : nextVisit % 3 === 0 ? 'silver' : null;
  const birthday    = isBirthdayMonth(member.birth);
  const cycleFilled = totalVisits % 6;

  async function downloadWallet() {
    if (!walletRef.current || !window.htmlToImage) return;
    setDownloading(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const dataUrl = await window.htmlToImage.toPng(walletRef.current, {
        pixelRatio: 3,
        backgroundColor: null,
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tarjeta-padelpark-${member.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2400);
    } catch (e) {
      console.error(e);
      alert('No se pudo descargar la tarjeta. Intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="scroll fade-in">
      <TopBar right="MI TARJETA" />
      <div className="card-screen">
        <div className="welcome-line"><span className="hi">¡Hola</span></div>
        <div className="member-name">{member.name.split(' ')[0].toUpperCase()}</div>

        <LoyaltyCard member={member} style={cardStyle} onClick={onOpenQr} />

        <div className="card-actions">
          <button className="btn btn-primary" onClick={downloadWallet} disabled={downloading}>
            {downloading ? 'Generando…' : (downloaded ? '¡Descargada!' : 'Descargar tarjeta')}
            {!downloading && !downloaded && <Ic.download style={{width:16,height:16}} />}
            {downloaded && <Ic.check style={{width:16,height:16}} />}
          </button>
          <button className="btn btn-ghost" onClick={onOpenQr}>
            <Ic.qr style={{width:16,height:16}} />
            Ver QR
          </button>
        </div>

        <div className="notice-box">
          <Ic.shield style={{width:18, height:18, flexShrink:0}} />
          <div>
            <strong>Guardada en la nube.</strong> Accede desde cualquier dispositivo con tu correo y contraseña.
          </div>
        </div>

        {/* ── Visits & promotions ── */}
        {visitsReady && (
          <div className="visits-block">
            <div className="vb-top">
              <div className="vb-count">
                <span className="vb-n">{totalVisits}</span>
                <span className="vb-label">visitas</span>
              </div>
              <div className="vb-cycle">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i}
                    className={`vdot ${i<=cycleFilled?'filled':''} ${i===3?'mark-s':''} ${i===6?'mark-f':''}`}
                  />
                ))}
              </div>
            </div>

            {nextPromo === 'free' && (
              <div className="vb-milestone milestone-free">
                🎉 <strong>¡Cancha GRATIS desbloqueada!</strong><br/>
                <span>Tu siguiente visita es completamente gratis</span>
              </div>
            )}
            {nextPromo === 'silver' && (
              <div className="vb-milestone milestone-silver">
                ⚡ <strong>¡Precio Silver desbloqueado!</strong><br/>
                <span>Tu siguiente visita tiene tarifa preferencial</span>
              </div>
            )}
            {!nextPromo && totalVisits > 0 && (
              <div className="vb-next">
                {3 - (totalVisits % 3)} visita{3-(totalVisits%3)!==1?'s':''} para precio Silver ·{' '}
                {6 - (totalVisits % 6)} para cancha gratis
              </div>
            )}
            {totalVisits === 0 && (
              <div className="vb-next">Presenta tu QR en recepción para registrar tu primera visita</div>
            )}

            {birthday && (
              <div className="vb-promo promo-birthday">
                🎂 ¡Tienes una sorpresa este mes de cumpleaños!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Off-screen, full-quality wallet card used for the PNG export */}
      <div className="wallet-export-stage">
        <WalletCard member={member} qrSvg={qrSvgWallet} innerRef={walletRef} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Rewards / Beneficios — static list, no visit dependency
// ──────────────────────────────────────────────────────────────
function RewardsScreen() {
  const rewards = [
    {
      ic: 'bolt',
      t: 'Precio Silver cada 3 visitas',
      s: 'En tu 3ª visita acumulada disfrutas tarifa preferencial Silver.',
      tag: 'VISITA 3',
    },
    {
      ic: 'gift',
      t: 'Visita gratis cada 6 visitas',
      s: 'En tu 6ª visita acumulada la cancha es completamente gratis.',
      tag: 'VISITA 6',
    },
    {
      ic: 'trophy',
      t: 'Torneos y clínicas',
      s: 'Notificación temprana y descuentos en torneos del club.',
      tag: null,
    },
    {
      ic: 'gift',
      t: 'Sorpresas en tu cumpleaños',
      s: 'El club celebra contigo en el mes de tu cumpleaños.',
      tag: null,
    },
  ];
  return (
    <div className="scroll fade-in">
      <TopBar right="BENEFICIOS" />
      <div className="rewards-screen">
        <h2>Beneficios del programa</h2>
        <div className="sub">Acumula visitas y desbloquea recompensas en Padel Park Gran Jardín.</div>
        {rewards.map((r, i) => (
          <div key={i} className="benefit-card">
            <div className="bc-ic">{Ic[r.ic]({ style: { width: 22, height: 22 } })}</div>
            <div className="bc-body">
              <div className="bc-ttl">
                {r.t}
                {r.tag && <span className="bc-tag">{r.tag}</span>}
              </div>
              <div className="bc-sub">{r.s}</div>
            </div>
          </div>
        ))}

        <div className="rewards-note">
          <div className="rn-title">¿Cómo funciona el conteo?</div>
          <p>Cada visita que realizas acumula un sello. Al llegar a <strong>3 sellos</strong> la siguiente visita tiene <strong>precio Silver</strong>; al llegar a <strong>6 sellos</strong> la siguiente visita es <strong>completamente gratis</strong>.</p>
          <p>La visita con precio Silver (la 4ª) y la visita gratis (la 7ª) <strong>no suman sello</strong> al ciclo. El conteo continúa desde donde terminó el ciclo anterior.</p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Profile tab
// ──────────────────────────────────────────────────────────────
function ProfileScreen({ member, onReset }) {
  return (
    <div className="scroll fade-in">
      <TopBar right="PERFIL" />
      <div className="card-screen">
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'var(--navy)', margin:'14px 0 16px'}}>Mi perfil</h2>
        <div style={{background:'white', border:'1px solid var(--line)', borderRadius:16, padding:18}}>
          <div style={{display:'flex', alignItems:'center', gap:14, marginBottom: 14}}>
            <div style={{width:56, height:56, borderRadius:'50%', background:'var(--navy)', color:'var(--lime)', display:'grid', placeItems:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:22}}>
              {member.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div>
              <div style={{fontWeight:700, fontSize:16, color:'var(--navy)'}}>{member.name}</div>
              <div style={{fontSize:12, color:'rgba(14,29,87,0.55)'}}>{member.email}</div>
            </div>
          </div>
          {[
            ['Socio', member.id],
            ['Juego', member.level],
            ['Teléfono', member.phone],
            ['Cumpleaños', member.birth ? new Date(member.birth).toLocaleDateString('es-MX', {day:'2-digit', month:'short'}) : '—'],
            ['Miembro desde', new Date(member.joinedAt).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'})],
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--line)', fontSize:13}}>
              <span style={{color:'rgba(14,29,87,0.6)'}}>{k}</span>
              <span style={{color:'var(--navy)', fontWeight:600}}>{v || '—'}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" style={{width:'100%', marginTop:14}} onClick={onReset}>Cerrar sesión</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Announcement banner — shows active club announcements
// ──────────────────────────────────────────────────────────────
const ANN_COLORS = {
  torneo: { bg: 'rgba(14,29,87,0.97)',    border: 'rgba(184,242,74,0.3)',  badge: '#b8f24a', badgeText: '#0e1d57' },
  precio: { bg: 'rgba(10,40,60,0.97)',    border: 'rgba(122,220,240,0.3)', badge: '#7adcf0', badgeText: '#00263a' },
  info:   { bg: 'rgba(40,20,10,0.96)',    border: 'rgba(255,180,100,0.3)', badge: '#ffb464', badgeText: '#3a1a00' },
};
const ANN_LABELS = { torneo: 'TORNEO', precio: 'PRECIO ESPECIAL', info: 'AVISO' };

function useCountdown(eventDate) {
  const calc = () => {
    if (!eventDate) return null;
    const diff = new Date(eventDate) - new Date();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [rem, setRem] = useState(calc);
  useEffect(() => {
    if (!eventDate) return;
    const t = setInterval(() => setRem(calc()), 1000);
    return () => clearInterval(t);
  }, [eventDate]);
  return rem;
}

function AnnCard({ ann, member, onDismiss }) {
  const c   = ANN_COLORS[ann.type] || ANN_COLORS.info;
  const rem = useCountdown(ann.event_date);
  const [signedUp, setSignedUp] = useState(false);
  const [sigBusy,  setSigBusy]  = useState(false);

  useEffect(() => {
    if (!ann.allow_signup || !member || !window.PPSb) return;
    window.PPSb.getMemberSignups(member.member_id || member.id).then(({ data }) => {
      if (data && data.some(s => s.announcement_id === ann.id)) setSignedUp(true);
    });
  }, [ann.id]);

  async function toggleSignup() {
    if (!member || !window.PPSb) return;
    setSigBusy(true);
    const mid = member.member_id || member.id;
    if (signedUp) {
      await window.PPSb.cancelSignup(ann.id, mid);
      setSignedUp(false);
    } else {
      await window.PPSb.signUpForEvent(ann.id, mid, member.name);
      setSignedUp(true);
    }
    setSigBusy(false);
  }

  return (
    <div className="ann-card" style={{ borderColor: c.border }}>
      {ann.image_url && (
        <img src={ann.image_url} className="ann-card-img" alt={ann.title} />
      )}
      <div className="ann-card-body" style={{ background: c.bg }}>
        <div className="ann-card-top">
          <span className="ann-card-badge" style={{ background: c.badge, color: c.badgeText }}>
            {ANN_LABELS[ann.type] || 'AVISO'}
          </span>
          <button className="ann-card-close" onClick={onDismiss}>
            <Ic.close style={{width:13,height:13}} />
          </button>
        </div>
        <div className="ann-card-title">{ann.title}</div>
        <div className="ann-card-text">{ann.body}</div>

        {rem && (
          <div className="ann-countdown">
            {rem.d > 0 && <div className="ann-cd-unit"><span>{rem.d}</span><em>días</em></div>}
            <div className="ann-cd-unit"><span>{String(rem.h).padStart(2,'0')}</span><em>hrs</em></div>
            <div className="ann-cd-unit"><span>{String(rem.m).padStart(2,'0')}</span><em>min</em></div>
            <div className="ann-cd-unit"><span>{String(rem.s).padStart(2,'0')}</span><em>seg</em></div>
          </div>
        )}

        {ann.allow_signup && (
          <button className={`ann-signup-btn ${signedUp ? 'signed' : ''}`}
            onClick={toggleSignup} disabled={sigBusy}>
            {sigBusy ? '…' : signedUp ? '✓ Inscrito — cancelar' : 'Inscribirme →'}
          </button>
        )}
      </div>
    </div>
  );
}

function AnnouncementBanner({ member }) {
  const [items,     setItems]     = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (!window.PPSb) return;
    window.PPSb.getAnnouncements().then(({ data }) => setItems(data || []));
  }, []);

  const visible = items.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="ann-banner-stack">
      {visible.map(a => (
        <AnnCard key={a.id} ann={a} member={member}
          onDismiss={() => setDismissed(s => new Set([...s, a.id]))} />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Tab bar
// ──────────────────────────────────────────────────────────────
function TabBar({ tab, setTab }) {
  const tabs = [
    { k: 'card',     l: 'Tarjeta',    ic: <Ic.card /> },
    { k: 'rewards',  l: 'Beneficios', ic: <Ic.gift /> },
    { k: 'profile',  l: 'Perfil',     ic: <Ic.user /> },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.k} className={`tab ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>
          {t.ic}
          <span>{t.l}</span>
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "cardStyle": "classic"
}/*EDITMODE-END*/;

function App() {
  // Tweaks
  const [tweaks, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);

  // Screen: loading | welcome | login | form | generating | main
  const [screen, setScreen] = useState('loading');
  const [tab, setTab] = useState('card');
  const [pendingForm, setPendingForm] = useState(null);
  const [member, setMember] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check Supabase session on mount
  useEffect(() => {
    if (!window.PPSb) { setScreen('welcome'); return; }

    window.PPSb.getSession().then(({ data: { session } }) => {
      if (session) {
        window.PPSb.getMember(session.user.id).then(({ data }) => {
          if (data) {
            setMember({ ...data, id: data.member_id });
            setScreen('main');
          } else {
            setScreen('welcome');
          }
        });
      } else {
        setScreen('welcome');
      }
    });

    const { data: { subscription } } = window.PPSb.onAuthChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setMember(null);
        setScreen('welcome');
        setTab('card');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleStart() { setAuthError(null); setScreen('form'); }
  function handleLogin() { setAuthError(null); setScreen('login'); }

  function handleLoginSuccess(memberData) {
    if (memberData) {
      setMember(memberData);
      setScreen('main');
    } else {
      setScreen('welcome');
    }
  }

  function handleSubmitForm(data) {
    setPendingForm(data);
    setScreen('generating');
  }

  async function handleGenDone() {
    const now = new Date().toISOString();
    const id  = memberIdFrom(pendingForm.name, pendingForm.email);

    if (window.PPSb) {
      const { data: authData, error: authErr } = await window.PPSb.signUp(
        pendingForm.email.trim().toLowerCase(),
        pendingForm.password
      );
      if (authErr) {
        setAuthError(authErr.message);
        setScreen('form');
        return;
      }
      if (authData.user) {
        await window.PPSb.saveMember(authData.user.id, {
          member_id:  id,
          name:       pendingForm.name,
          email:      pendingForm.email.trim().toLowerCase(),
          phone:      pendingForm.phone,
          birth:      pendingForm.birth,
          level:      pendingForm.level,
          joined_at:  now,
        });
      }
    }

    const m = {
      id,
      member_id: id,
      name:      pendingForm.name,
      email:     pendingForm.email,
      phone:     pendingForm.phone,
      birth:     pendingForm.birth,
      level:     pendingForm.level,
      joined_at: now,
    };
    setMember(m);
    setScreen('main');
    setTab('card');

    if (window.PPGJ) window.PPGJ.register({ id, ...m, joinedAt: now });
  }

  async function handleReset() {
    if (window.PPSb) await window.PPSb.signOut();
    setMember(null);
    setScreen('welcome');
    setTab('card');
  }

  return (
    <div className="app-shell">
      <div className="phone">
        {screen === 'loading'    && <LoadingScreen />}
        {screen === 'welcome'    && <Welcome onStart={handleStart} onLogin={handleLogin} />}
        {screen === 'login'      && <LoginForm onBack={()=>setScreen('welcome')} onSuccess={handleLoginSuccess} />}
        {screen === 'form'       && <RegisterForm onBack={()=>setScreen('welcome')} onSubmit={handleSubmitForm} authError={authError} />}
        {screen === 'generating' && <Generating formData={pendingForm} onDone={handleGenDone} />}

        {screen === 'main' && member && (
          <>
            <AnnouncementBanner member={member} />
            {tab === 'card'     && <CardScreen member={member} cardStyle={tweaks.cardStyle} onOpenQr={()=>setQrOpen(true)} />}
            {tab === 'rewards'  && <RewardsScreen />}
            {tab === 'profile'  && <ProfileScreen member={member} onReset={handleReset} />}
            <TabBar tab={tab} setTab={setTab} />
          </>
        )}

        {qrOpen && member && (
          <QrModal member={member} onClose={()=>setQrOpen(false)} />
        )}
      </div>

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Tarjeta" />
          <window.TweakSelect
            label="Estilo"
            value={tweaks.cardStyle}
            onChange={v => setTweak('cardStyle', v)}
            options={[
              { value: 'classic', label: 'Classic Navy' },
              { value: 'neon',    label: 'Neon Court' },
              { value: 'court',   label: 'Court Grid' },
              { value: 'lime',    label: 'Lime Bold' },
            ]}
          />
          <window.TweakSection label="Demo" />
          <window.TweakButton label="Reiniciar demo" onClick={handleReset} />
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
