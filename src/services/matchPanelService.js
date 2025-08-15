import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";

// Subscriptions
export function subscribeTeam(teamId, callback) {
  const teamRef = ref(db, `t4_bouldering/teams/${teamId}`);
  return onValue(teamRef, (snap) => callback(snap.val() || null));
}

export function subscribePlayers(teamId, callback) {
  const playersRef = ref(db, `t4_bouldering/players`);
  return onValue(playersRef, (snap) => {
    const allPlayers = snap.val() || {};
    const teamPlayers = Object.entries(allPlayers)
      .filter(([_, player]) => player.team_id === teamId)
      .map(([id, player]) => ({ ...player, id }));
    callback(teamPlayers);
  });
}

export function subscribeLiveStatus(matchId, callback) {
  const liveRef = ref(db, `t4_bouldering/live_status/${matchId}`);
  return onValue(liveRef, (snap) => callback(snap.val() || {}));
}

// Live Status Updates
export function updateLiveStatus(
  matchId,
  teamId,
  team,
  players,
  updates,
  period,
  timeRemaining
) {
  update(
    ref(db, `t4_bouldering/live_status/${matchId}/on_boulders/${teamId}`),
    updates
  );

  if (team?.side) {
    const scoreboardUpdates = {
      team_logo: team?.team_logo || "",
      abbreviation: team?.abbreviation || "",
    };

    if (updates.player_id) {
      const player = players.find((p) => p.id === updates.player_id);
      scoreboardUpdates.jersey = player?.jersey_number || "";
      scoreboardUpdates.current_player = player?.name || "";
    }
    if (updates.points !== undefined) {
      scoreboardUpdates.possible = calculatePossiblePoints(updates.points);
      scoreboardUpdates.score = calculateScore(updates.points);
    }

    update(ref(db, `scoreboard/${matchId}/${team.side}`), {
      ...scoreboardUpdates,
      period,
      time_remaining: timeRemaining,
    });
  }
}

// Timer Logic
export function startTimer(matchId) {
  update(ref(db, `t4_bouldering/live_status/${matchId}`), {
    clock_running: true,
  });
}

export function pauseTimer(matchId) {
  update(ref(db, `t4_bouldering/live_status/${matchId}`), {
    clock_running: false,
  });
}

export function tickTimer(matchId, newTime, period) {
  update(ref(db, `t4_bouldering/live_status/${matchId}`), {
    time_remaining: newTime,
    period,
  });
}

export function resetTimer(matchId, period, newTime = 450) {
  update(ref(db, `t4_bouldering/live_status/${matchId}`), {
    time_remaining: newTime,
    clock_running: false,
    period,
  });
}

export function updatePeriod(matchId, newPeriod) {
  update(ref(db, `t4_bouldering/live_status/${matchId}`), {
    period: newPeriod,
  });
}

// Helpers
function calculatePossiblePoints(stage) {
  return stage === "Z1" ? 1 : stage === "Z2" ? 2 : stage === "Top" ? 5 : 0;
}

function calculateScore(stage) {
  return stage === "Top" ? 5 : stage === "Z2" ? 2 : stage === "Z1" ? 1 : 0;
}

export function updateMatchStatus(matchId, data) {
  const matchRef = ref(db, `t4_bouldering/matches/${matchId}`);
  return update(matchRef, data); // return so caller can await
}
