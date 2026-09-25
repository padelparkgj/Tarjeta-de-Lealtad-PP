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
    getMemberByMemberId(memberId) {
      return sb.from('members').select('*').eq('member_id', memberId).single();
    },
    getAllMembers() {
      return sb.from('members')
        .select('*')
        .order('joined_at', { ascending: false });
    },

    // ── Visits table ──────────────────────────────────────────
    logVisit(memberId, memberName, court) {
      return sb.from('visits').insert({
        member_id:   memberId,
        member_name: memberName || '',
        court:       court || '01',
      });
    },
    getMemberVisits(memberId) {
      return sb.from('visits')
        .select('*')
        .eq('member_id', memberId)
        .order('visited_at', { ascending: false });
    },
    getAllVisits() {
      return sb.from('visits')
        .select('*')
        .order('visited_at', { ascending: false })
        .limit(500);
    },
    deleteVisit(id) {
      return sb.from('visits').delete().eq('id', id);
    },

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
    signUpForEvent(announcementId, memberId, memberName) {
      return sb.from('signups').upsert({
        announcement_id: announcementId,
        member_id:       memberId,
        member_name:     memberName || '',
      });
    },
    cancelSignup(announcementId, memberId) {
      return sb.from('signups').delete()
        .eq('announcement_id', announcementId)
        .eq('member_id', memberId);
    },
    getMemberSignups(memberId) {
      return sb.from('signups').select('*').eq('member_id', memberId).order('signed_up_at', { ascending: false });
    },
    getEventSignups(announcementId) {
      return sb.from('signups').select('*')
        .eq('announcement_id', announcementId)
        .order('signed_up_at');
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
      return sb.from('tournament_pairs').select('*').eq('announcement_id', announcementId).order('created_at');
    },
    assignPartner(pairId, memberId2, memberName2) {
      return sb.from('tournament_pairs').update({ member_id_2: memberId2, member_name_2: memberName2 || '' }).eq('id', pairId);
    },
    upsertPair(announcementId, memberId1, memberName1, memberId2, memberName2) {
      return sb.from('tournament_pairs').upsert({
        announcement_id: announcementId, member_id_1: memberId1, member_name_1: memberName1 || '',
        member_id_2: memberId2 || null, member_name_2: memberName2 || null,
      }, { onConflict: 'announcement_id,member_id_1' });
    },
    unassignPartner(pairId) {
      return sb.from('tournament_pairs').update({ member_id_2: null, member_name_2: null }).eq('id', pairId);
    },

    // ── Tournament matches (rol de juego + resultados) ──────────
    async saveTournamentSchedule(announcementId, matches) {
      const del = await sb.from('tournament_matches').delete().eq('announcement_id', announcementId);
      if (del.error) return del;
      return sb.from('tournament_matches').insert(matches.map(m => ({ announcement_id: announcementId, ...m })));
    },
    getTournamentMatches(announcementId) {
      return sb.from('tournament_matches')
        .select('*, pair_a:tournament_pairs!tournament_matches_pair_a_id_fkey(*), pair_b:tournament_pairs!tournament_matches_pair_b_id_fkey(*)')
        .eq('announcement_id', announcementId)
        .order('match_start');
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
    async signUpForTournament(announcementId, memberId, memberName, partnerMemberId, partnerName) {
      const su = await sb.from('signups').upsert({ announcement_id: announcementId, member_id: memberId, member_name: memberName || '' });
      if (su.error) return su;
      return sb.from('tournament_pairs').upsert({
        announcement_id: announcementId, member_id_1: memberId, member_name_1: memberName || '',
        member_id_2: partnerMemberId || null, member_name_2: partnerName || null,
      }, { onConflict: 'announcement_id,member_id_1' });
    },

    // ── Batch member lookup (for WhatsApp phone numbers) ────────
    getMembersByMemberIds(memberIds) {
      return sb.from('members').select('*').in('member_id', memberIds);
    },
  };
})();
