// ─────────────────────────────────────────────────────────────
// Tournament logic — round-robin generator + court/time scheduler
// Padel Park Gran Jardín
// ─────────────────────────────────────────────────────────────
/* global window */
(function () {
  // Standard circle method: no team repeats within a single round,
  // which makes court/slot assignment safe without per-slot conflict checks.
  function generateRoundRobinMatches(pairs) {
    const teams = pairs.map(p => p.id);
    if (teams.length % 2 !== 0) teams.push(null); // bye
    const n = teams.length;
    const fixed = teams[0];
    let rotating = teams.slice(1);
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const current = [fixed, ...rotating];
      const roundMatches = [];
      for (let i = 0; i < n / 2; i++) {
        const a = current[i], b = current[n - 1 - i];
        if (a !== null && b !== null) roundMatches.push({ round: r + 1, pairAId: a, pairBId: b });
      }
      rounds.push(roundMatches);
      rotating.unshift(rotating.pop());
    }
    return rounds;
  }

  function assignSchedule(rounds, { courtCount, matchDurationMin, dateStr, startTime, endTime }) {
    const totalMatches = rounds.reduce((s, r) => s + r.length, 0);
    const windowStart = new Date(`${dateStr}T${startTime}:00`);
    const windowEnd   = new Date(`${dateStr}T${endTime}:00`);
    const windowMinutes = (windowEnd - windowStart) / 60000;
    const slotCount = Math.floor(windowMinutes / matchDurationMin);

    let slotsNeeded = 0;
    rounds.forEach(r => { slotsNeeded += Math.ceil(r.length / courtCount); });

    if (slotsNeeded > slotCount) {
      const shortfallMinutes = (slotsNeeded - slotCount) * matchDurationMin;
      return {
        ok: false, totalMatches, slotCount, slotsNeeded,
        message: `No alcanza el horario: se necesitan ${Math.ceil(shortfallMinutes / 60)} hora(s) más.`,
      };
    }

    const courts = Array.from({ length: courtCount }, (_, i) => String(i + 1).padStart(2, '0'));
    const schedule = [];
    let slotIndex = 0;
    rounds.forEach(round => {
      let i = 0;
      while (i < round.length) {
        const slotStart = new Date(windowStart.getTime() + slotIndex * matchDurationMin * 60000);
        const slotEnd   = new Date(slotStart.getTime() + matchDurationMin * 60000);
        for (let c = 0; c < courtCount && i < round.length; c++, i++) {
          schedule.push({
            round: round[i].round, pair_a_id: round[i].pairAId, pair_b_id: round[i].pairBId,
            court: courts[c], match_start: slotStart.toISOString(), match_end: slotEnd.toISOString(),
            status: 'scheduled',
          });
        }
        slotIndex++;
      }
    });
    return { ok: true, totalMatches, slotCount, slotsNeeded, schedule };
  }

  // Given a just-completed match, find the next pending match on the same
  // court (lowest round still unplayed) — this is what "lines up the next
  // match automatically": marking a winner tells the admin who to notify next.
  function findNextOnCourt(matches, completedMatch) {
    return matches
      .filter(m => m.court === completedMatch.court && m.status === 'scheduled' && m.id !== completedMatch.id)
      .sort((a, b) => a.round - b.round || new Date(a.match_start) - new Date(b.match_start))[0] || null;
  }

  // Simple standings: count wins per pair from completed matches.
  function computeStandings(pairs, matches) {
    const wins = {};
    pairs.forEach(p => { wins[p.id] = 0; });
    matches.forEach(m => {
      if (m.status === 'completed' && m.winner_pair_id) {
        wins[m.winner_pair_id] = (wins[m.winner_pair_id] || 0) + 1;
      }
    });
    const ranked = pairs
      .map(p => ({ pair: p, wins: wins[p.id] || 0 }))
      .sort((a, b) => b.wins - a.wins);
    const allCompleted = matches.length > 0 && matches.every(m => m.status === 'completed');
    return { ranked, champion: allCompleted ? ranked[0] : null };
  }

  window.PPTournament = { generateRoundRobinMatches, assignSchedule, findNextOnCourt, computeStandings };
})();
