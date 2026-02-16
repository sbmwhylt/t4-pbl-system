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
      players: t.players || 0,
    }));
    callback(list);
  });
}

// ------------------------------- Team Wins (ORIGINAL - Keep as is)

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

// ------------------------------- Team Wins (NEW - Multiple Teams)

export async function getTeamWinsMultiTeam() {
  const snap = await get(ref(db, "t4_bouldering/matches"));
  const val = snap.val() || {};
  const wins = {};

  Object.values(val).forEach((match) => {
    if (match.status?.toLowerCase() === "finished") {
      const teams = match.teams || {};

      // Check if it's old format (left/right) or new format (team IDs)
      const isOldFormat = teams.left || teams.right;

      if (isOldFormat) {
        // Handle old format
        const leftScore = teams.left?.score || 0;
        const rightScore = teams.right?.score || 0;

        let winnerId = null;
        if (leftScore > rightScore) winnerId = teams.left?.id;
        else if (rightScore > leftScore) winnerId = teams.right?.id;
        else if (leftScore === rightScore) winnerId = "draw";

        if (winnerId) {
          wins[winnerId] = (wins[winnerId] || 0) + 1;
        }
      } else {
        // Handle new format (multiple teams)
        const teamScores = Object.entries(teams).map(([teamId, teamData]) => ({
          id: teamData.id || teamId,
          score: teamData.score || 0,
        }));

        const maxScore = Math.max(...teamScores.map((t) => t.score));
        const winners = teamScores.filter((t) => t.score === maxScore);

        if (winners.length > 1) {
          wins["draw"] = (wins["draw"] || 0) + 1;
        } else if (winners.length === 1) {
          const winnerId = winners[0].id;
          wins[winnerId] = (wins[winnerId] || 0) + 1;
        }
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

// --------------------------------- Team Matches (ORIGINAL - Keep as is)

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

// --------------------------------- Team Matches (NEW - Multiple Teams)

export async function getTeamMatchesMultiTeam() {
  const snap = await get(ref(db, "t4_bouldering/matches"));
  const val = snap.val() || {};

  const matches = {};
  Object.values(val).forEach((match) => {
    const teams = match.teams || {};

    // Handle both old and new formats
    Object.entries(teams).forEach(([key, teamData]) => {
      const id = teamData.id || key;
      if (id && id !== "left" && id !== "right") {
        matches[id] = (matches[id] || 0) + 1;
      }
    });
  });
  return matches;
}

// --------------------------- Team Service Object

export const teamService = {
  subscribeTeams,
  getTeamWins,
  getTeamWinsMultiTeam, // NEW
  getTeamPlayersCount,
  getTeamMatches,
  getTeamMatchesMultiTeam, // NEW
};
