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
// TopBar
// ──────────────────────────────────────────────────────────────
function TopBar({ right }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo-pill">
          <img src="assets/logo-navy.jpg" alt="Padel Park Gran Jardín" />
        </div>
      </div>
      <div className="right">{right || ''}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Welcome screen
// ──────────────────────────────────────────────────────────────
function Welcome({ onStart, onResume, hasMember }) {
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
          <div className="label">4 niveles</div>
          <div className="sub">De Bronze a Legend. Sube y suma beneficios.</div>
        </div>
      </div>

      <div className="cta-row">
        <button className="btn btn-primary" onClick={onStart}>
          {hasMember ? 'Crear otra tarjeta' : 'Crear mi tarjeta'}
          <span className="arrow"><Ic.arrow style={{width:18,height:18}} /></span>
        </button>
        {hasMember && (
          <button className="btn btn-ghost" onClick={onResume}>Ver mi tarjeta</button>
        )}
        <div style={{textAlign:'center', fontSize: 11.5, color:'rgba(14,29,87,0.5)', marginTop: 4}}>
          ¿Ya eres miembro? <span style={{color:'var(--navy)', fontWeight:600, cursor:'pointer'}} onClick={hasMember ? onResume : onStart}>Inicia sesión</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Registration form
// ──────────────────────────────────────────────────────────────
function RegisterForm({ onBack, onSubmit }) {
  const [data, setData] = useState({
    name: '', email: '', phone: '', birth: '', level: 'Intermedio', terms: false
  });
  const [errors, setErrors] = useState({});

  function set(k, v) { setData(d => ({...d, [k]: v})); setErrors(e => ({...e, [k]: null})); }

  function submit(e) {
    e.preventDefault();
    const err = {};
    if (!data.name.trim() || data.name.trim().length < 2) err.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) err.email = true;
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
            <input type="email" value={data.email} onChange={e=>set('email', e.target.value)} placeholder="maria@correo.com" style={errors.email ? {borderColor:'#d44'} : null} />
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

  return (
    <div className="qr-modal">
      <button className="close" onClick={onClose}><Ic.close /></button>
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
function CardScreen({ member, cardStyle, onOpenQr }) {
  const qrSvgWallet = useMemo(() =>
    generateQrSvg(`PPGJ|${member.id}|${member.name}`, { dark: '#0e1d57', light: '#ffffff', size: 360 }),
  [member.id, member.name]);

  const qrSvgThumb = useMemo(() =>
    generateQrSvg(`PPGJ|${member.id}|${member.name}`, { dark: '#0e1d57', light: '#ffffff', size: 120 }),
  [member.id, member.name]);

  const walletRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

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

        <div className="hint-note">
          <Ic.download style={{width:14, height:14, opacity:0.5}} />
          Guarda tu tarjeta en Fotos para tenerla siempre a la mano.
        </div>

        <div className="qr-section">
          <div className="qr-thumb" dangerouslySetInnerHTML={{__html: qrSvgThumb}} />
          <div className="qr-meta">
            <div className="ttl">Tu QR personal</div>
            <div className="sub">Muéstralo en recepción para registrar tu visita.</div>
          </div>
          <button onClick={onOpenQr}>ABRIR</button>
        </div>

        <div className="benefits-preview">
          <div className="bp-row">
            <Ic.gift style={{width:18, height:18}} />
            <span>Tu tarjeta abre los beneficios del programa de lealtad.</span>
          </div>
        </div>
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
    { ic: 'gift',   t: 'Bienvenida al club',         s: 'Acceso al programa y comunidad de socios Padel Park.' },
    { ic: 'bolt',   t: 'Reservas prioritarias',      s: 'Apartado anticipado de canchas para socios activos.' },
    { ic: 'trophy', t: 'Torneos y clínicas',         s: 'Notificación temprana y descuentos en torneos del club.' },
    { ic: 'ball',   t: 'Renta de raqueta',           s: 'Acceso a raquetas Bullpadel cuando lo necesites.' },
    { ic: 'gift',   t: 'Sorpresas en tu cumpleaños', s: 'El club celebra contigo en el mes de tu cumpleaños.' },
    { ic: 'trophy', t: 'Recompensas por constancia', s: 'Beneficios especiales para los socios más constantes.' },
  ];
  return (
    <div className="scroll fade-in">
      <TopBar right="BENEFICIOS" />
      <div className="rewards-screen">
        <h2>Beneficios del programa</h2>
        <div className="sub">Lo que recibes como socio de Padel Park Gran Jardín.</div>
        {rewards.map((r, i) => (
          <div key={i} className="benefit-card">
            <div className="bc-ic">{Ic[r.ic]({ style: { width: 22, height: 22 } })}</div>
            <div className="bc-body">
              <div className="bc-ttl">{r.t}</div>
              <div className="bc-sub">{r.s}</div>
            </div>
          </div>
        ))}
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

  // Screen: welcome | form | generating | main
  const [screen, setScreen] = useState('welcome');
  const [tab, setTab] = useState('card');
  const [pendingForm, setPendingForm] = useState(null);
  const [member, setMember] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);

  // Load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMember(JSON.parse(raw));
    } catch(e) {}
  }, []);

  // Persist member
  useEffect(() => {
    if (member) localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  }, [member]);

  function handleStart()  { setScreen('form'); }
  function handleResume() { setScreen('main'); setTab('card'); }
  function handleSubmitForm(data) {
    setPendingForm(data);
    setScreen('generating');
  }
  function handleGenDone() {
    const now = Date.now();
    const id = memberIdFrom(pendingForm.name, pendingForm.email);
    const m = {
      ...pendingForm,
      id,
      joinedAt: now,
    };
    setMember(m);
    setScreen('main');
    setTab('card');
    // Persist registration to Google Sheet (only — staff will see this in the Sheet)
    if (window.PPGJ) {
      window.PPGJ.register({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        birth: m.birth,
        level: m.level,
        joinedAt: m.joinedAt,
      });
    }
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setMember(null);
    setScreen('welcome');
    setTab('card');
  }

  return (
    <div className="app-shell">
      <div className="phone">
        {screen === 'welcome'    && <Welcome onStart={handleStart} onResume={handleResume} hasMember={!!member} />}
        {screen === 'form'       && <RegisterForm onBack={()=>setScreen('welcome')} onSubmit={handleSubmitForm} />}
        {screen === 'generating' && <Generating formData={pendingForm} onDone={handleGenDone} />}

        {screen === 'main' && member && (
          <>
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
