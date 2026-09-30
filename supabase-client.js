// ─────────────────────────────────────────────────────────────
// Supabase client — auth + datos de la lealtad
// ─────────────────────────────────────────────────────────────
// La base es la del POS (septiembre de 2026). Tres cambios de forma respecto a la
// base vieja se absorben AQUÍ, para que las pantallas sigan recibiendo lo mismo:
//
//  · members.id ya no es el id de la cuenta: la cuenta vive en members.user_id.
//  · visits, signups y tournament_pairs ya no copian el nombre: se lee de members
//    por la llave foránea (member_id → members.member_id) y se devuelve como
//    member_name / member_name_1 / member_name_2, que es lo que leen las pantallas.
//  · El compañero de pareja es un socio (member_id_2) o un invitado (guest_name_2),
//    nunca los dos: la base lo exige con un check.
//
// ⚠️ La credencial (member_id) la genera la base. Nada aquí la inventa.
(function () {
  const cfg = window.PPGJ_CONFIG;
  // El panel de recepción guarda su sesión aparte (Admin.html fija PP_AUTH_STORAGE_KEY):
  // las dos páginas viven en el mismo dominio, y sin esto la sesión de personal del
  // panel sería también la sesión de la página de socios en ese aparato.
  const auth = window.PP_AUTH_STORAGE_KEY ? { storageKey: window.PP_AUTH_STORAGE_KEY } : {};
  const sb  = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth });

  // ── Nombres leídos de members ─────────────────────────────
  const SEL_PAREJA = '*, m1:members!member_id_1(name), m2:members!member_id_2(name)';

  const conNombre = (row) => {
    if (!row) return row;
    const { members, ...resto } = row;
    return { ...resto, member_name: members?.name || '' };
  };
  const pareja = (row) => {
    if (!row) return row;
    const { m1, m2, ...resto } = row;
    return {
      ...resto,
      member_name_1: m1?.name || '',
      member_name_2: row.member_id_2 ? (m2?.name || '') : (row.guest_name_2 || null),
    };
  };
  const mapear = (fn) => (res) => (res.error || !res.data) ? res : { ...res, data: Array.isArray(res.data) ? res.data.map(fn) : fn(res.data) };

  // El compañero va en una sola de las dos columnas (check de la base).
  const companero = (memberId2, nombre2) => memberId2
    ? { member_id_2: memberId2, guest_name_2: null }
    : { member_id_2: null, guest_name_2: (nombre2 && nombre2.trim()) || null };

  window.PPSb = {
    // ── Auth ──────────────────────────────────────────────────
    // Los datos de la ficha viajan en los metadatos de la cuenta: el proyecto pide
    // confirmar el correo, así que al registrarse todavía no hay sesión y la ficha no
    // se puede crear en ese momento. Se crea en el primer inicio de sesión
    // (vincularSocio), leyendo de aquí lo que la persona escribió.
    signUp(email, password, ficha) {
      return sb.auth.signUp({
        email, password,
        options: {
          data: ficha,
          emailRedirectTo: location.origin + location.pathname,
        },
      });
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
    getUser() {
      return sb.auth.getUser();
    },
    onAuthChange(callback) {
      return sb.auth.onAuthStateChange(callback);
    },
    // ¿Esta sesión es de personal del club? La misma función que usan las políticas.
    esPersonal() {
      return sb.rpc('es_personal');
    },

    // ── Members table ─────────────────────────────────────────
    // La ficha de la cuenta con sesión. `maybeSingle`: no tener ficha no es un error,
    // es el caso de quien acaba de confirmar su correo.
    getMember(userId) {
      return sb.from('members').select('*').eq('user_id', userId).maybeSingle();
    },
    // La función decide sola: enlaza la ficha sin cuenta que tenga el correo de la
    // sesión (conserva credencial y visitas) o crea una nueva. Devuelve el member_id.
    vincularSocio(nombre, telefono, birth) {
      return sb.rpc('vincular_socio', {
        p_nombre:   nombre,
        p_telefono: telefono || null,
        p_birth:    birth || null,   // la columna es date: '' no es una fecha
      });
    },
    updateMyLevel(userId, level) {
      return sb.from('members').update({ level }).eq('user_id', userId).select('member_id');
    },
    getMemberByMemberId(memberId) {
      return sb.from('members').select('*').eq('member_id', memberId).maybeSingle();
    },
    getAllMembers() {
      return sb.from('members')
        .select('*')
        .order('joined_at', { ascending: false });
    },

    // ── Visits table ──────────────────────────────────────────
    // Sin member_name: el nombre está en members, y quién la registró lo pone la base.
    logVisit(memberId, court) {
      return sb.from('visits').insert({
        member_id: memberId,
        court:     court || '01',
      });
    },
    // Las visitas de un socio para la promoción, contadas EN LA BASE (count, sin traer filas):
    //   total   — todas las registradas;
    //   cuentan — las que hay desde members.vinculado_en, que es cuando se registró en la app y
    //             lo que abre la promoción (Edgar, 25 de septiembre de 2026). `null` si no
    //             participa: el socio dado de alta en el mostrador, sin vinculado_en. No es 0.
    // Es la misma cuenta que hace el POS (services/socios, visitasDe). Hasta la v3.2 esta app
    // contaba todas, y el mismo socio podía ver «7.ª gratis» aquí y otra cosa en el mostrador.
    // Devuelve { data, error } como supabase-js: una lectura caída no es «0 visitas».
    async contarVisitas(member) {
      const contar = () => sb.from('visits').select('id', { count: 'exact', head: true }).eq('member_id', member.member_id);
      const [todas, desde] = await Promise.all([
        contar(),
        member.vinculado_en ? contar().gte('visited_at', member.vinculado_en) : Promise.resolve(null),
      ]);
      const error = todas.error || (desde && desde.error);
      if (error) return { data: null, error };
      if (todas.count === null || (desde && desde.count === null)) {
        return { data: null, error: new Error('la base no devolvió el conteo de visitas') };
      }
      return { data: { total: todas.count, cuentan: desde ? desde.count : null }, error: null };
    },
    getMemberVisits(memberId) {
      return sb.from('visits')
        .select('*, members(name)')
        .eq('member_id', memberId)
        .order('visited_at', { ascending: false })
        .then(mapear(conNombre));
    },
    getAllVisits() {
      return sb.from('visits')
        .select('*, members(name)')
        .order('visited_at', { ascending: false })
        .limit(500)
        .then(mapear(conNombre));
    },
    // Sin deleteVisit, a propósito (Edgar, 30 de septiembre de 2026): una visita se borra solo
    // desde el POS, por anular_visita, que deja registro en anulaciones. Cuando se quite la
    // política de DELETE de visits, un borrado por la tabla dejaría de borrar sin decirlo.

    // ── Announcements table ───────────────────────────────────
    getAnnouncements() {
      return sb.from('announcements')
        .select('*')
        .eq('active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });
    },
    getAnnouncementsByIds(ids) {
      return sb.from('announcements').select('id, title, type, event_date').in('id', ids);
    },
    createAnnouncement(data) {
      return sb.from('announcements').insert(data);
    },
    deleteAnnouncement(id) {
      return sb.from('announcements').delete().eq('id', id);
    },
    updateAnnouncement(id, data) {
      return sb.from('announcements').update(data).eq('id', id);
    },
    async uploadAnnouncementImage(file) {
      const ext  = file.name.split('.').pop();
      const path = `ann-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('announcements').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from('announcements').getPublicUrl(path);
      return data.publicUrl;
    },

    // ── Signups table ─────────────────────────────────────────
    signUpForEvent(announcementId, memberId) {
      return sb.from('signups').upsert({
        announcement_id: announcementId,
        member_id:       memberId,
      });
    },
    cancelSignup(announcementId, memberId) {
      return sb.from('signups').delete()
        .eq('announcement_id', announcementId)
        .eq('member_id', memberId);
    },
    getMemberSignups(memberId) {
      return sb.from('signups').select('*, members(name)').eq('member_id', memberId)
        .order('signed_up_at', { ascending: false })
        .then(mapear(conNombre));
    },
    getEventSignups(announcementId) {
      return sb.from('signups').select('*, members(name)')
        .eq('announcement_id', announcementId)
        .order('signed_up_at')
        .then(mapear(conNombre));
    },

    // ── Tournaments (config) ───────────────────────────────────
    getTournamentConfig(announcementId) {
      return sb.from('tournaments').select('*').eq('announcement_id', announcementId).maybeSingle();
    },
    saveTournamentConfig(announcementId, data) {
      return sb.from('tournaments').upsert({ announcement_id: announcementId, ...data }, { onConflict: 'announcement_id' });
    },

    // ── Tournament pairs (parejas) ──────────────────────────────
    getTournamentPairs(announcementId) {
      return sb.from('tournament_pairs').select(SEL_PAREJA).eq('announcement_id', announcementId).order('created_at')
        .then(mapear(pareja));
    },
    assignPartner(pairId, memberId2) {
      return sb.from('tournament_pairs').update(companero(memberId2, null)).eq('id', pairId);
    },
    upsertPair(announcementId, memberId1, memberId2, guestName2) {
      return sb.from('tournament_pairs').upsert({
        announcement_id: announcementId, member_id_1: memberId1,
        ...companero(memberId2, guestName2),
      }, { onConflict: 'announcement_id,member_id_1' });
    },
    unassignPartner(pairId) {
      return sb.from('tournament_pairs').update({ member_id_2: null, guest_name_2: null }).eq('id', pairId);
    },

    // ── Tournament matches (rol de juego + resultados) ──────────
    async saveTournamentSchedule(announcementId, matches) {
      const del = await sb.from('tournament_matches').delete().eq('announcement_id', announcementId);
      if (del.error) return del;
      return sb.from('tournament_matches').insert(matches.map(m => ({ announcement_id: announcementId, ...m })));
    },
    getTournamentMatches(announcementId) {
      return sb.from('tournament_matches')
        .select(`*, pair_a:tournament_pairs!pair_a_id(${SEL_PAREJA}), pair_b:tournament_pairs!pair_b_id(${SEL_PAREJA})`)
        .eq('announcement_id', announcementId)
        .order('match_start')
        .then(mapear(m => ({ ...m, pair_a: pareja(m.pair_a), pair_b: pareja(m.pair_b) })));
    },
    recordMatchWinner(matchId, winnerPairId) {
      return sb.from('tournament_matches').update({ status: 'completed', winner_pair_id: winnerPairId }).eq('id', matchId);
    },
    markReminderSent(matchId) {
      return sb.from('tournament_matches').update({ reminder_sent_at: new Date().toISOString() }).eq('id', matchId);
    },
    markNextPingSent(matchId) {
      return sb.from('tournament_matches').update({ next_ping_sent_at: new Date().toISOString() }).eq('id', matchId);
    },

    // ── Combined tournament signup (signup + optional partner) ─
    async signUpForTournament(announcementId, memberId, partnerMemberId, partnerName) {
      const su = await sb.from('signups').upsert({ announcement_id: announcementId, member_id: memberId });
      if (su.error) return su;
      return sb.from('tournament_pairs').upsert({
        announcement_id: announcementId, member_id_1: memberId,
        ...companero(partnerMemberId, partnerName),
      }, { onConflict: 'announcement_id,member_id_1' });
    },

    // ── Batch member lookup (for WhatsApp phone numbers) ────────
    getMembersByMemberIds(memberIds) {
      return sb.from('members').select('*').in('member_id', memberIds);
    },
  };
})();
