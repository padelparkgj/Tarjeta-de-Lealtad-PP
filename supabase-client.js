// ─────────────────────────────────────────────────────────────
// Supabase client — auth + members table
// ─────────────────────────────────────────────────────────────
(function () {
  const cfg = window.PPGJ_CONFIG;
  const sb  = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

  window.PPSb = {
    // ── Auth ──────────────────────────────────────────────────
    signUp(email, password) {
      return sb.auth.signUp({ email, password });
    },
    signIn(email, password) {
      return sb.auth.signInWithPassword({ email, password });
    },
    signOut() {
      return sb.auth.signOut();
    },
    getSession() {
      return sb.auth.getSession();
    },
    onAuthChange(callback) {
      return sb.auth.onAuthStateChange(callback);
    },

    // ── Members table ─────────────────────────────────────────
    saveMember(userId, data) {
      return sb.from('members').upsert({ id: userId, ...data });
    },
    getMember(userId) {
      return sb.from('members').select('*').eq('id', userId).single();
    },
  };
})();
