import { db } from "../../firebase";
import { ref, onValue, update, runTransaction, set } from "firebase/database";

// references
function scoreboardRef(matchId) {
  return ref(db, `scoreboard/demo`);
}
function teamsRef() {
  return ref(db, "t4_bouldering/teams");
}

// ======================
// Subscriptions
// ======================
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
// Match-related helpers
// ======================

export async function setTeam(matchId, side, team) {
  if (team && typeof team === "object" && "current_player" in team) {
    await update(scoreboardRef(matchId), {
      [`teams/${side}/current_player`]: team.current_player || null,
      [`teams/${side}/jersey`]: team.jersey || null,
    });
  } else {
    await update(scoreboardRef(matchId), {
      [`teams/${side}`]: {
        id: team?.id || "",
        name: team?.name || team || "",
        score: 0,
        current_player: null,
        jersey: null,
      },
    });
  }
}

export const teamService = { subscribeTeams };
