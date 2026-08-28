import { db } from "@/firebase";
import { ref, onValue, set, update, get } from "firebase/database";
import { DEFAULT_DURATION } from "@/services/constant";

// -------------------- References

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

function matchesRef() {
  return ref(db, "t4_bouldering/matches");
}

// ---------------------- Subscriptions

export function subscribeScoreboard(matchId, callback) {
  return onValue(scoreboardRef(matchId), (snap) => {
    callback(snap.val() || null);
  });
}

// ------------------------ Match Initialization (ORIGINAL - Keep as is)

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
      startAt: null,
      runSeconds: null,
      endTime: null,
      endedAt: null,
    },
    period: "1ST",
  });
}

// ------------------------ Match Initialization (NEW - Multiple Teams)

export async function initMatchMultiTeam(matchId, teamIds = []) {
  const teams = {};

  // If team IDs provided, initialize with them
  if (teamIds.length > 0) {
    teamIds.forEach((teamId) => {
      teams[teamId] = {
        id: teamId,
        name: `Team ${teamId}`,
        score: 0,
        current_boulder: "A",
        players: {},
      };
    });
  }

  await set(scoreboardRef(matchId), {
    teams: teams,
    timer: {
      duration: DEFAULT_DURATION,
      remaining: DEFAULT_DURATION,
      running: false,
      startAt: null,
      runSeconds: null,
      endTime: null,
      endedAt: null,
    },
    period: "1ST",
  });
}

// -------------------------- Period Management

export function updatePeriod(matchId, period) {
  return update(scoreboardRef(matchId), { period });
}

// -------------------------- Match Finalization

function generateMatchId(code) {
  return `M${code}`.padStart(3, "0"); // e.g., M001
}

// -------------------------- Get Next Sequence

async function getNextSequence() {
  const matchesSnap = await get(matchesRef());
  const matches = matchesSnap.val() || {};
  const codes = Object.keys(matches)
    .map((id) => {
      const match = id.match(/^M(\d{3})$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const nextCode = codes.length ? Math.max(...codes) + 1 : 1;
  return String(nextCode).padStart(3, "0");
}

// -------------------------- Finish Match (ORIGINAL - Keep as is)

export async function finishMatch(matchId = "singlematch") {
  const demoRef = ref(db, `scoreboard/${matchId}`);
  const demoSnap = await get(demoRef);
  if (!demoSnap.exists()) throw new Error("No match data found");
  const demoData = demoSnap.val();
  const leftTeam = demoData?.teams?.left;
  const rightTeam = demoData?.teams?.right;
  if (!leftTeam?.id || !rightTeam?.id) {
    throw new Error("Both teams must be selected");
  }
  if ((leftTeam?.score || 0) <= 0 && (rightTeam?.score || 0) <= 0) {
    throw new Error("Both teams must have at least 1 point");
  }
  const nextCode = await getNextSequence();
  const newMatchId = generateMatchId(nextCode); // M001, M002, ...
  await set(ref(db, `t4_bouldering/matches/${newMatchId}`), {
    id: newMatchId,
    ...demoData,
    status: "finished",
    saved_at: Date.now().toString().slice(0, 13),
    start_time: Date.now(),
  });
  await initMatch(matchId);
  return newMatchId;
}

// -------------------------- Overlay Team Selection

export function setOverlayTeams(matchId, left, right) {
  return set(ref(db, `scoreboard/${matchId}/overlay`), { left, right });
}

// -------------------------- Finish Match (NEW - Multiple Teams)

export async function finishMatchMultiTeam(matchId = "singlematch") {
  const demoRef = ref(db, `scoreboard/${matchId}`);
  const demoSnap = await get(demoRef);
  if (!demoSnap.exists()) throw new Error("No match data found");

  const demoData = demoSnap.val();
  const teams = demoData?.teams || {};

  // Convert teams object to array for validation
  const teamsList = Object.values(teams);

  // Validate at least 2 teams exist
  if (teamsList.length < 2) {
    throw new Error("At least 2 teams must be selected");
  }

  // Validate all teams have IDs
  const hasInvalidTeam = teamsList.some((team) => !team?.id);
  if (hasInvalidTeam) {
    throw new Error("All teams must have valid IDs");
  }

  // Validate at least one team has scored
  const totalScore = teamsList.reduce(
    (sum, team) => sum + (team?.score || 0),
    0,
  );
  if (totalScore <= 0) {
    throw new Error("At least one team must have scored");
  }

  // Clean up ghost players: remove players who no longer belong to each team
  const playersSnap = await get(ref(db, "t4_bouldering/players"));
  const allPlayers = playersSnap.val() || {};

  const cleanedTeams = {};
  for (const [teamKey, team] of Object.entries(teams)) {
    const players = team.players || {};
    const cleanedPlayers = {};
    for (const [playerId, playerData] of Object.entries(players)) {
      const masterPlayer = allPlayers[playerId];
      // Keep only players that still belong to this team and have a name
      if (
        masterPlayer &&
        (masterPlayer.team_id || masterPlayer.team) === team.id &&
        playerData.name
      ) {
        cleanedPlayers[playerId] = playerData;
      }
    }
    cleanedTeams[teamKey] = { ...team, players: cleanedPlayers };
  }

  const nextCode = await getNextSequence();
  const newMatchId = generateMatchId(nextCode);

  await set(ref(db, `t4_bouldering/matches/${newMatchId}`), {
    id: newMatchId,
    ...demoData,
    teams: cleanedTeams,
    status: "finished",
    saved_at: Date.now().toString().slice(0, 13),
    start_time: Date.now(),
  });

  await initMatchMultiTeam(matchId);
  return newMatchId;
}