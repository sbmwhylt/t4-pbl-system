import { db } from "@/firebase";
import { ref, onValue, get } from "firebase/database";

// --------------------------- Team References

function teamsRef() {
  return ref(db, "t4_bouldering/teams");
}

// --------------------------- Team Subscriptions

export function subscribeTeams(callback) {
  return onValue(teamsRef(), (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, t]) => ({
      id,
      name: t.name || id,
      abbreviation: t.abbreviation || "",
      logo_url: t.logo_url || "",
      wins: t.wins || 0,
      matches: t.matches || 0,
      players: t.players || 0
    }));
    callback(list);
  });
}

// ------------------------------- Team Wins

export async function getTeamWins() {
  const snap = await get(ref(db, "t4_bouldering/matches"));
  const val = snap.val() || {};
  const wins = {};

  Object.values(val).forEach((match) => {
    if (match.status?.toLowerCase() === "finished") {
      const leftScore = match.teams?.left?.score || 0;
      const rightScore = match.teams?.right?.score || 0;

      let winnerId = null;
      if (leftScore > rightScore) winnerId = match.teams?.left?.id;
      else if (rightScore > leftScore) winnerId = match.teams?.right?.id;
      else if (leftScore === rightScore) winnerId = "draw";

      if (winnerId) {
        wins[winnerId] = (wins[winnerId] || 0) + 1;
      }
    }
  });
  return wins;
}

// --------------------------------- Team Players Count 

export async function getTeamPlayersCount() {
  const snap = await get(ref(db, "t4_bouldering/players"));
  const val = snap.val() || {};

  const counts = {};
  Object.values(val).forEach((player) => {
    const teamId = player.team_id;
    if (teamId) {
      counts[teamId] = (counts[teamId] || 0) + 1;
    }
  });
  return counts;
}

// --------------------------------- Team Matches

export async function getTeamMatches() {
  const snap = await get(ref(db, "t4_bouldering/matches"));
  const val = snap.val() || {};

  const matches = {};
  Object.values(val).forEach((match) => {
    const leftTeamId = match.teams?.left?.id;
    const rightTeamId = match.teams?.right?.id;

    if (leftTeamId) {
      matches[leftTeamId] = (matches[leftTeamId] || 0) + 1;
    }
    if (rightTeamId) {
      matches[rightTeamId] = (matches[rightTeamId] || 0) + 1;
    }
  });
  return matches;
}

// --------------------------- Team Service Object

export const teamService = {
  subscribeTeams,
  getTeamWins,
  getTeamPlayersCount
};
