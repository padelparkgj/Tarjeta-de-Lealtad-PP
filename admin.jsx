/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const ADMIN_AUTH_KEY = 'pp_gj_admin_auth_v1';

function fmtTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function fmtDate(ts) {
  const d = new Date(ts);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} · ${fmtTime(ts)}`;
}
function isToday(ts) {
  const d = new Date(ts), n = new Date();
  return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
}
function initials(name) {
  return (name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || '?';
}
function isBirthdayMonth(birth) {
  if (!birth || birth.length < 7) return false;
  const m = parseInt((birth.split('-')[1] || birth.split('/')[1] || '0'));
  return m === new Date().getMonth() + 1;
}
// Promotion for visit number N
function promoFor(n) {
  if (n % 6 === 0) return 'free';
  if (n % 3 === 0) return 'silver';
  return null;
}
// Parse QR payload: "PPGJ|PP-26-1234|Maria Fernandez"
function parseQr(text) {
  if (!text) return null;
  const p = text.split('|');
  if (p[0] !== 'PPGJ' || !p[1]) return null;
  return { id: p[1].trim(), name: (p[2]||'').trim() };
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const Ic = {
  cam:    p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.6"/></svg>,
  mega:   p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M3 11v2M5 8.5C7.5 10 12 11 18 11v2c-6 0-10.5 1-13 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 8.5V16.5M5 8.5C5 7.7 5.7 7 6.5 7H7l11-3v14L7 15H6.5C5.7 15 5 14.3 5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 15l1 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  check:  p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x:      p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  cog:    p => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M19.4 15a1.7 1.7 0 00.4 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.4h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.4"/></svg>,
  log:    p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  arrow:  p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  gift:   p => <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="8" width="18" height="13" rx="1" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v13M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 8c0-2 1.5-4 3-4s2 1.5 0 4M12 8c0-2-1.5-4-3-4S7 5.5 9 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  bolt:   p => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  cake:   p => <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="2" y="10" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 10V8M12 10V8M17 10V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M7 6a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM17 6a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// Login
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
        <div className="logo-block"><img src="assets/logo-navy.jpg" alt="Padel Park" /></div>
        <div className="admin-eyebrow"><span className="dot"></span>Panel de Recepción</div>
        <h1>Padel Park <span className="script">Gran Jardín</span></h1>
        <p className="lead">Ingresa el PIN del club para abrir el scanner y registrar visitas.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>PIN de acceso</label>
            <input type="password" value={pin} onChange={e=>{setPin(e.target.value);setErr(false);}}
              placeholder="••••••••" className={err?'shake':''} autoFocus />
            {err && <div className="err">PIN incorrecto</div>}
          </div>
          <button type="submit" className="btn btn-primary">
            Entrar al panel <Ic.arrow style={{width:16,height:16}}/>
          </button>
          <a href="Landing Page.html" className="back-link">← Volver a la página de socios</a>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Camera QR Scanner
// ─────────────────────────────────────────────────────────────
function Scanner({ active, onScan }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const streamRef = useRef(null);
  const lastRef   = useRef({ text: '', ts: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) return;
    if (!window.jsQR) { setError('Librería QR no cargó. Recarga la página.'); return; }
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(stream => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      v.setAttribute('playsinline', true);
      v.play();

      function tick() {
        if (cancelled || !videoRef.current || !canvasRef.current) return;
        const v = videoRef.current;
        if (v.readyState !== v.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(tick); return; }
        const c = canvasRef.current;
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          const now = Date.now();
          if (code.data !== lastRef.current.text || now - lastRef.current.ts > 2500) {
            lastRef.current = { text: code.data, ts: now };
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
      <canvas ref={canvasRef} style={{display:'none'}} />
      <div className="scanner-overlay">
        <div className="scanner-frame">
          <span className="corner tl"/><span className="corner tr"/>
          <span className="corner bl"/><span className="corner br"/>
          <div className="scan-line"/>
        </div>
        <div className="scanner-hint">Apunta al QR del socio</div>
      </div>
      {error && <div className="scanner-error">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Member panel — shows after QR scan, before confirming visit
// ─────────────────────────────────────────────────────────────
function MemberPanel({ member, visitCount, court, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);

  const thisVisit  = visitCount + 1;
  const promo      = promoFor(thisVisit);
  const birthday   = isBirthdayMonth(member.birth);

  // 6-visit cycle progress (positions 1-6)
  const filled = visitCount % 6;

  async function confirm() {
    setBusy(true);
    await onConfirm();
  }

  return (
    <div className="member-panel fade-in">
      <div className="mp-avatar">{initials(member.name)}</div>
      <div className="mp-name">{member.name || member.member_id}</div>
      <div className="mp-meta">{member.member_id}{member.level ? ` · ${member.level}` : ''}</div>

      {/* Visit progress */}
      <div className="mp-visits-block">
        <div className="mp-visits-n">{visitCount}</div>
        <div className="mp-visits-label">visitas acumuladas</div>
        <div className="mp-cycle">
          {[1,2,3,4,5,6].map(i => (
            <div key={i}
              className={`cycle-dot ${i <= filled ? 'filled' : ''} ${i===3?'mark-silver':''} ${i===6?'mark-free':''}`}
              title={i===3?'Silver':i===6?'Gratis':''}
            />
          ))}
        </div>
        <div className="mp-cycle-legend">
          <span><span className="cd-silver"/>Silver</span>
          <span><span className="cd-free"/>Gratis</span>
        </div>
      </div>

      {/* Promotions for THIS visit */}
      {promo === 'free' && (
        <div className="mp-promo promo-free">
          <Ic.gift style={{width:16,height:16}}/> ¡Esta visita es <strong>GRATIS</strong>!
        </div>
      )}
      {promo === 'silver' && (
        <div className="mp-promo promo-silver">
          <Ic.bolt style={{width:16,height:16}}/> Aplica <strong>precio Silver</strong> en esta visita
        </div>
      )}
      {birthday && (
        <div className="mp-promo promo-birthday">
          <Ic.cake style={{width:16,height:16}}/> ¡Mes de <strong>cumpleaños</strong>! 🎂
        </div>
      )}

      <div className="mp-court-tag">Cancha {court}</div>

      <button className="btn btn-primary" onClick={confirm} disabled={busy} style={{width:'100%'}}>
        {busy ? 'Registrando…' : 'Confirmar visita'}
        {!busy && <Ic.check style={{width:16,height:16}}/>}
      </button>
      <button className="btn btn-ghost" onClick={onCancel} style={{width:'100%',marginTop:8}}>
        Cancelar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Saved screen — shown after confirming visit
// ─────────────────────────────────────────────────────────────
function SavedScreen({ member, newTotal, onContinue }) {
  const toFree   = 6 - (newTotal % 6);
  const toSilver = 3 - (newTotal % 3);
  const nextIsFree   = toFree <= toSilver;
  const nextLabel    = nextIsFree
    ? `${toFree} visita${toFree!==1?'s':''} para cancha GRATIS`
    : `${toSilver} visita${toSilver!==1?'s':''} para precio Silver`;

  return (
    <div className="scan-result fade-in">
      <div className="checkbubble"><Ic.check/></div>
      <div className="srl">¡Visita registrada!</div>
      <div className="srn">{member?.name || member?.member_id}</div>
      <div className="srid">Visita #{newTotal}</div>
      <div className="sr-next">{nextLabel}</div>
      <button className="btn btn-primary" onClick={onContinue}>
        Escanear siguiente <Ic.arrow style={{width:16,height:16}}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Scanner screen (main tab)
// ─────────────────────────────────────────────────────────────
function ScannerScreen() {
  const [court, setCourt]       = useState(() => localStorage.getItem('pp_admin_court') || '01');
  const [phase, setPhase]       = useState('scan'); // scan | lookup | confirm | saved
  const [parsed, setParsed]     = useState(null);
  const [memberInfo, setMember] = useState(null);
  const [visitCount, setCount]  = useState(0);
  const [todayCount, setToday]  = useState(0);
  const [toast, setToast]       = useState(null);

  // Load today's visit count
  useEffect(() => {
    if (!window.PPSb) return;
    window.PPSb.getAllVisits().then(({ data }) => {
      setToday((data||[]).filter(v => isToday(v.visited_at)).length);
    });
  }, []);

  function showToast(msg, kind='') {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2000);
  }

  async function handleScan(raw) {
    if (phase !== 'scan') return;
    const p = parseQr(raw);
    if (!p) { showToast('QR no válido', 'err'); return; }

    setPhase('lookup');
    setParsed(p);

    try {
      const [mRes, vRes] = await Promise.all([
        window.PPSb ? window.PPSb.getMemberByMemberId(p.id) : Promise.resolve({ data: null }),
        window.PPSb ? window.PPSb.getMemberVisits(p.id)     : Promise.resolve({ data: [] }),
      ]);
      setMember(mRes.data || { member_id: p.id, name: p.name });
      setCount((vRes.data || []).length);
      setPhase('confirm');
    } catch {
      setPhase('scan');
      showToast('Error consultando datos', 'err');
    }
  }

  async function confirmVisit() {
    if (window.PPSb) {
      await window.PPSb.logVisit(parsed.id, memberInfo?.name || parsed.name, court);
    }
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    setToday(c => c + 1);
    setPhase('saved');
  }

  function reset() {
    setPhase('scan');
    setParsed(null);
    setMember(null);
    setCount(0);
  }

  return (
    <div className="scanner-screen">
      <div className="court-bar">
        <span className="court-lbl">CANCHA</span>
        {['01','02','03'].map(c => (
          <button key={c} className={`court-pill ${court===c?'active':''}`}
            onClick={() => { setCourt(c); localStorage.setItem('pp_admin_court', c); }}>
            {c}
          </button>
        ))}
      </div>

      {phase === 'scan'    && <Scanner active onScan={handleScan}/>}
      {phase === 'lookup'  && (
        <div className="mp-lookup fade-in">
          <div className="mp-spinner"/>
          <p>Consultando datos del socio…</p>
        </div>
      )}
      {phase === 'confirm' && memberInfo && (
        <MemberPanel member={memberInfo} visitCount={visitCount}
          court={court} onConfirm={confirmVisit} onCancel={reset}/>
      )}
      {phase === 'saved' && (
        <SavedScreen member={memberInfo} newTotal={visitCount+1} onContinue={reset}/>
      )}

      <div className="scanner-meta">
        <div className="sm-row"><span>Visitas hoy</span><strong>{todayCount}</strong></div>
        <div className="sm-row">
          <span>Supabase</span>
          <strong style={{color: window.PPSb ? 'var(--lime-deep)' : '#c97'}}>
            {window.PPSb ? 'Conectado' : 'Sin conexión'}
          </strong>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.kind}`}>
          <div className="ic">
            {toast.kind==='err' ? <Ic.x style={{width:14,height:14}}/> : <Ic.check style={{width:14,height:14}}/>}
          </div>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Log screen — loads visits from Supabase
// ─────────────────────────────────────────────────────────────
function LogScreen() {
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.PPSb) { setLoading(false); return; }
    window.PPSb.getAllVisits().then(({ data }) => {
      setVisits(data || []);
      setLoading(false);
    });
  }, []);

  const today = visits.filter(v => isToday(v.visited_at));

  return (
    <div className="log-screen">
      <div className="log-header">
        <div>
          <div className="log-eyebrow">HOY · {new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long'})}</div>
          <h2>{today.length} visitas</h2>
        </div>
        <div className="log-stats">
          <div><strong>{visits.length}</strong><span>total</span></div>
        </div>
      </div>

      {loading && <div className="empty">Cargando…</div>}

      {!loading && visits.length === 0 && (
        <div className="empty">
          <Ic.log style={{width:32,height:32,opacity:0.3,marginBottom:10}}/>
          <div>Sin visitas todavía.</div>
        </div>
      )}

      <div className="log-list">
        {visits.map(v => (
          <div key={v.id} className="log-row">
            <div className="log-court">{v.court||'—'}</div>
            <div className="log-body">
              <div className="log-name">{v.member_name || v.member_id}</div>
              <div className="log-sub">{v.member_id} · {fmtDate(v.visited_at)}</div>
            </div>
            <div className="log-status">
              <span className="ok">✓ Supabase</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Announcements screen
// ─────────────────────────────────────────────────────────────
const TYPES = [
  { value: 'torneo',  label: 'Torneo',         color: '#b8f24a' },
  { value: 'precio',  label: 'Precio especial', color: '#7adcf0' },
  { value: 'info',    label: 'Aviso general',   color: '#ffb464' },
];

function AnnouncementsScreen() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [form,    setForm]    = useState({ type: 'torneo', title: '', body: '', expires_at: '' });
  const [err,     setErr]     = useState(null);

  function load() {
    if (!window.PPSb) { setLoading(false); return; }
    window.PPSb.getAnnouncements().then(({ data }) => {
      setList(data || []);
      setLoading(false);
    });
  }
  useEffect(load, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErr(null); }

  async function publish(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setErr('Título y mensaje son requeridos.'); return; }
    setBusy(true);
    const payload = {
      title:      form.title.trim(),
      body:       form.body.trim(),
      type:       form.type,
      expires_at: form.expires_at || null,
      active:     true,
    };
    const { error } = await window.PPSb.createAnnouncement(payload);
    if (error) { setErr('Error al publicar: ' + error.message); setBusy(false); return; }
    setForm({ type: 'torneo', title: '', body: '', expires_at: '' });
    setBusy(false);
    load();
  }

  async function remove(id) {
    await window.PPSb.deleteAnnouncement(id);
    load();
  }

  const typeInfo = (t) => TYPES.find(x => x.value === t) || TYPES[2];

  return (
    <div className="ann-screen">
      <h2>Avisos a socios</h2>
      <p className="ann-lead">Los avisos aparecen en la app de todos los socios al instante.</p>

      <div className="ann-form-card">
        <form onSubmit={publish}>
          <div className="ann-type-row">
            {TYPES.map(t => (
              <button key={t.value} type="button"
                className={`ann-type-pill ${form.type === t.value ? 'active' : ''}`}
                style={form.type === t.value ? { background: t.color, borderColor: t.color, color: 'var(--navy)' } : {}}
                onClick={() => set('type', t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="field">
            <label>Título</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Torneo dobles mixtos · 5 julio" />
          </div>
          <div className="field">
            <label>Mensaje</label>
            <textarea value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Inscríbete antes del viernes. Cupo limitado a 16 parejas. Precio especial para socios." rows={3} />
          </div>
          <div className="field">
            <label>Mostrar hasta <span style={{opacity:.5, fontWeight:400}}>(opcional)</span></label>
            <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
          </div>
          {err && <p className="field-error">{err}</p>}
          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={busy || !window.PPSb}>
            {busy ? 'Publicando…' : 'Publicar aviso'}
            {!busy && <Ic.mega style={{width:15,height:15}}/>}
          </button>
          {!window.PPSb && <p style={{fontSize:12,color:'#c97',marginTop:8,textAlign:'center'}}>Sin conexión a Supabase</p>}
        </form>
      </div>

      <h3 style={{margin:'22px 0 10px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:'.06em', color:'var(--navy)'}}>
        Activos ({list.length})
      </h3>

      {loading && <div className="empty">Cargando…</div>}
      {!loading && list.length === 0 && (
        <div className="empty" style={{padding:'24px 0'}}>
          <Ic.mega style={{width:28,height:28,opacity:.25,marginBottom:8}}/>
          <div>Sin avisos publicados.</div>
        </div>
      )}

      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {list.map(a => {
          const ti = typeInfo(a.type);
          return (
            <div key={a.id} className="ann-row">
              <div className="ann-badge" style={{background: ti.color + '22', color: ti.color, borderColor: ti.color + '44'}}>
                {ti.label.toUpperCase()}
              </div>
              <div className="ann-body">
                <div className="ann-title">{a.title}</div>
                <div className="ann-msg">{a.body}</div>
                {a.expires_at && (
                  <div className="ann-exp">Hasta {new Date(a.expires_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})}</div>
                )}
              </div>
              <button className="ann-del" onClick={() => remove(a.id)} aria-label="Eliminar">
                <Ic.x style={{width:14,height:14}}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────
function SettingsScreen({ onLogout }) {
  const cfg = window.PPGJ_CONFIG || {};
  return (
    <div className="settings-screen">
      <h2>Configuración</h2>
      <div className="set-card">
        <div className="set-row">
          <span>Supabase</span>
          <strong style={{color: window.PPSb ? 'var(--lime-deep)' : '#c97'}}>
            {window.PPSb ? 'Conectado' : 'Sin configurar'}
          </strong>
        </div>
        <div className="set-sub">Las visitas se guardan en Supabase y los socios las ven en su tarjeta.</div>
      </div>
      <div className="set-card">
        <div className="set-row"><span>Club</span><strong>{cfg.club?.name||'Padel Park'} · {cfg.club?.city||''}</strong></div>
      </div>
      <div className="set-card">
        <div className="set-row"><span>Versión</span><strong>v2.0 · Supabase</strong></div>
      </div>
      <h3 style={{marginTop:22}}>Instrucciones</h3>
      <ol className="steps-list">
        <li>Selecciona la cancha activa en la barra de arriba.</li>
        <li>Pídele al socio que abra su QR en la app.</li>
        <li>Apunta la cámara — verás su tarjeta con visitas y promociones.</li>
        <li>Presiona «Confirmar visita» para registrarla.</li>
        <li>Las visitas aparecen en Historial y en la app del socio.</li>
      </ol>
      <button className="btn btn-ghost" style={{marginTop:22,width:'100%'}} onClick={onLogout}>
        Cerrar sesión admin
      </button>
      <a href="Landing Page.html" className="back-link" style={{marginTop:10}}>← Ir a la página de socios</a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AdminApp shell
// ─────────────────────────────────────────────────────────────
function AdminApp() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(ADMIN_AUTH_KEY) === '1');
  const [tab, setTab] = useState('scan');

  function logout() { localStorage.removeItem(ADMIN_AUTH_KEY); setAuthed(false); }

  if (!authed) return <Login onAuth={() => setAuthed(true)} />;

  const cfg = window.PPGJ_CONFIG || {};
  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="logo-pill"><img src="assets/logo-navy.jpg" alt="Padel Park"/></div>
          <div>
            <div className="ttl">RECEPCIÓN</div>
            <div className="sub">{cfg.club?.name||'Padel Park'} · {cfg.club?.city||'León, Gto'}</div>
          </div>
        </div>
        <div className="admin-status">
          <span className={`dot ${window.PPSb ? 'live' : 'demo'}`}/>
          {window.PPSb ? 'EN VIVO' : 'SIN CONEXIÓN'}
        </div>
      </div>

      <div className="admin-body">
        {tab==='scan'     && <ScannerScreen/>}
        {tab==='log'      && <LogScreen/>}
        {tab==='avisos'   && <AnnouncementsScreen/>}
        {tab==='settings' && <SettingsScreen onLogout={logout}/>}
      </div>

      <div className="admin-tabs">
        <button className={`atab ${tab==='scan'?'active':''}`}     onClick={()=>setTab('scan')}>
          <Ic.cam/><span>Escanear</span>
        </button>
        <button className={`atab ${tab==='log'?'active':''}`}      onClick={()=>setTab('log')}>
          <Ic.log/><span>Historial</span>
        </button>
        <button className={`atab ${tab==='avisos'?'active':''}`}   onClick={()=>setTab('avisos')}>
          <Ic.mega/><span>Avisos</span>
        </button>
        <button className={`atab ${tab==='settings'?'active':''}`} onClick={()=>setTab('settings')}>
          <Ic.cog/><span>Ajustes</span>
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp/>);
