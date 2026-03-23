import { db } from "@/firebase";
import { ref, get, set, update, runTransaction } from "firebase/database";

export const boulders = ["A", "B", "C", "D"];
export const zones = ["Z1", "Z2", "Top", "Top2", "Flash"];
export const maxPoints = 6;

// Get possible additional score based on attempt number and current points
// 1st attempt: max achievable = 6 (Flash)
// 2nd attempt: max achievable = 5 (Top2)
// 3rd+ attempt: max achievable = 4 (Top)
export function getPossibleScore(attempts, currentPoints) {
  // If no attempt started and no zone reached, nothing to show
  if (attempts <= 0 && (currentPoints || 0) <= 0) return null;
  // If zone reached but attempts not yet incremented, treat as attempt 1
  const effectiveAttempts = attempts > 0 ? attempts : 1;
  const maxForAttempt = effectiveAttempts <= 1 ? 6 : effectiveAttempts === 2 ? 5 : 4;
  const possible = maxForAttempt - (currentPoints || 0);
  return possible > 0 ? possible : 0;
}

// Map zone -> base points
export const zonesPoints = { Z1: 1, Z2: 2, Top: 4, Top2: 5, Flash: 6 };

// Anchor bonus: applied to Flash and Top2 when player is anchor (last on the wall)
const anchorBonus = { Top2: 1, Flash: 1 };

export function getZonePoints(zone, isAnchor = false) {
  const base = zonesPoints[zone] || 0;
  return isAnchor ? base + (anchorBonus[zone] || 0) : base;
}

// Refs - Works for both demo (left/right) and multimatch (T1, T2, T3)
function playerBouldersRef(matchId, teamSide, playerId) {
  return ref(db, `scoreboard/${matchId}/teams/${teamSide}/players/${playerId}/boulders`);
}

function teamRef(matchId, teamSide) {
  return ref(db, `scoreboard/${matchId}/teams/${teamSide}`);
}

// Initialize all boulders for a player if missing
export async function initPlayerBoulders(matchId, teamSide, playerId) {
  const snapshot = await get(playerBouldersRef(matchId, teamSide, playerId));
  if (!snapshot.exists()) {
    const data = {};
    boulders.forEach((b) => (data[b] = { currentZone: "", attempts: 0, points: 0 }));
    await set(playerBouldersRef(matchId, teamSide, playerId), data);
  }
}

// Reset a specific boulder (attempts + points + current zone)
export async function resetBoulder(matchId, teamSide, playerId, boulder) {
  await update(playerBouldersRef(matchId, teamSide, playerId), {
    [boulder]: { currentZone: "", attempts: 0, points: 0 },
  });
  await updateTeamScore(matchId, teamSide);
}

// Set a zone for a player on a boulder (does NOT affect attempts)
export async function setPlayerZone(matchId, teamSide, playerId, boulder, zone, isAnchor = false) {
  const points = getZonePoints(zone, isAnchor);

  await runTransaction(playerBouldersRef(matchId, teamSide, playerId), (current) => {
    if (!current) return current;
    const boulderData = current[boulder] || { currentZone: "", attempts: 0, points: 0 };
    boulderData.currentZone = zone;
    boulderData.points = points; // overwrite points
    current[boulder] = boulderData;
    return current;
  });
  await updateTeamScore(matchId, teamSide);
}

// Fetch all boulders for a player
export async function getPlayerBoulders(matchId, teamSide, playerId) {
  const snapshot = await get(playerBouldersRef(matchId, teamSide, playerId));
  return snapshot.exists() ? snapshot.val() : {};
}

// Calculate total team score
export function calculateTeamScore(players) {
  return Object.values(players).reduce((sum, player) => {
    return sum + Object.values(player.boulders || {}).reduce((s, b) => s + (b.points || 0), 0);
  }, 0);
}

// Update team score in Firebase
export async function updateTeamScore(matchId, teamSide) {
  const snap = await get(teamRef(matchId, teamSide));
  if (!snap.exists()) return;
  const players = snap.val().players || {};
  const totalScore = calculateTeamScore(players);
  await update(teamRef(matchId, teamSide), { score: totalScore });
}

// Update the attempt count manually for a boulder (only attempts, leave points & zone intact)
export async function updatePlayerAttempt(matchId, teamSide, playerId, boulder, newAttempt) {
  await runTransaction(playerBouldersRef(matchId, teamSide, playerId), (current) => {
    if (!current) return current;
    const boulderData = current[boulder] || { currentZone: "", attempts: 0, points: 0 };
    boulderData.attempts = newAttempt;
    current[boulder] = boulderData;
    return current;
  });
}

// Reset only the zone for a specific boulder (keep attempts intact)
// Works for BOTH demo (left/right) and multimatch (T1, T2, T3)
export async function resetBoulderZone(matchId, teamSide, playerId, boulder) {
  const tRef = ref(db, `scoreboard/${matchId}/teams/${teamSide}`);

  await runTransaction(tRef, (team) => {
    if (!team || !team.players || !team.players[playerId]) return team;

    const player = team.players[playerId];

    // 🔹 Reset just this boulder
    if (player.boulders && player.boulders[boulder]) {
      player.boulders[boulder].currentZone = "";
      player.boulders[boulder].points = 0;
      player.boulders[boulder].attempts = 0;
    }

    // 🔹 Recalculate team score (sum of all players' boulder points)
    let teamTotal = 0;
    for (const pid in team.players) {
      const p = team.players[pid];
      if (p && p.boulders) {
        for (const key in p.boulders) {
          const b = p.boulders[key];
          if (b && typeof b.points === "number") {
            teamTotal += b.points;
          }
        }
      }
    }
    team.score = teamTotal;

    return team;
  });
}