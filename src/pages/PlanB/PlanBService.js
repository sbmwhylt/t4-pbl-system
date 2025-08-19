import { db } from "../../firebase";
import { ref, onValue, set, update, runTransaction } from "firebase/database";

// ======================
// References
// ======================
function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

function teamsRef() {
  return ref(db, `t4_bouldering/teams`);
}

// ======================
// Subscriptions
// ======================
export function subscribeScoreboard(matchId, callback) {
  return onValue(scoreboardRef(matchId), (snap) => {
    callback(snap.val() || null);
  });
}

export function subscribeTeams(callback) {
  return onValue(teamsRef(), (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, t]) => ({
      id,
      name: t.name || id,
      abbreviation: t.abbreviation || "",
      logo_url: t.logo_url || "",
    }));
    callback(list);
  });
}

// ======================
// Match Initialization
// ======================
export const DEFAULT_DURATION = 450; // 7:30 in seconds
export const DEFAULT_DURATION_SECONDS = 450; // or whatever constant you want

export async function initMatch(matchId) {
  await set(scoreboardRef(matchId), {
    teams: {
      left: { id: "", name: "Left", score: 0 },
      right: { id: "", name: "Right", score: 0 },
    },
    timer: {
      duration: DEFAULT_DURATION,
      remaining: DEFAULT_DURATION,
      running: false,
    },
    period: "1ST",
  });
}

// ======================
// Team & Score Updates
// ======================
export async function setTeam(matchId, side, team) {
  // If it's a player selection (has current_player property)
  if (team && typeof team === "object" && "current_player" in team) {
    await update(scoreboardRef(matchId), {
      [`teams/${side}/current_player`]: team.current_player || null,
      [`teams/${side}/jersey`]: team.jersey || null,
    });
  }
  // If it's a team selection (normal behavior)
  else {
    await update(scoreboardRef(matchId), {
      [`teams/${side}`]: {
        id: team?.id || "",
        name: team?.name || team || "",
        score: 0,
        current_player: null, // Reset player when team changes
        jersey: null,
      },
    });
  }
}

export async function clearScore(matchId, side) {
  await update(scoreboardRef(matchId), { [`teams/${side}/score`]: 0 });
}

export async function adjustScore(matchId, side, delta) {
  const r = ref(db, `scoreboard/${matchId}/teams/${side}/score`);
  await runTransaction(r, (current) => Math.max(0, (current || 0) + delta));
}

// ======================
// Timer Functions
// ======================
export async function setTimer(matchId, patch) {
  await update(
    scoreboardRef(matchId),
    Object.fromEntries(Object.entries(patch).map(([k, v]) => [`timer/${k}`, v]))
  );
}

export async function startTimer(matchId) {
  await setTimer(matchId, { running: true });
}

export async function pauseTimer(matchId) {
  await setTimer(matchId, { running: false });
}

export async function resetTimer(matchId, duration = DEFAULT_DURATION) {
  await setTimer(matchId, { duration, remaining: duration, running: false });
}

// Use transaction to decrement Firebase timer
export async function tickTimer(matchId) {
  const r = ref(db, `scoreboard/${matchId}/timer/remaining`);
  await runTransaction(r, (current) =>
    Math.max(0, (current || DEFAULT_DURATION) - 1)
  );
}

// ======================
// Period Update
// ======================
export function updatePeriod(matchId, period) {
  return update(scoreboardRef(matchId), { period });
}

// ======================
// Players subscription
// ======================

export function subscribePlayers(callback) {
  const playersRef = ref(db, "t4_bouldering/players");

  return onValue(playersRef, (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, p]) => ({
      id,
      name: p.name || "",
      jersey_number: p.jersey_number || "",
      team_id: p.team_id || "",
    }));
    callback(list);
  });
}
