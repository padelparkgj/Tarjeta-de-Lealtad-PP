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
  };
})();
