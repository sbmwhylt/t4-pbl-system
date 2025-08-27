import { db } from "../../firebase";
import { ref, onValue, set, update } from "firebase/database";

// --------------------
// Helper functions
// --------------------

// Generate match ID from matchCode and date
// Generate match ID from matchCode (no date)
function generateMatchId(matchCode) {
  return `M${matchCode}`;
}

// Get next match code based on current matches
function getNextMatchCode(matches) {
  const codes = Object.keys(matches || {})
    .map((id) => {
      const match = id.match(/^M(\d{3})$/); // only match M001, M002, etc.
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
  return String(maxCode + 1).padStart(3, "0");
}

// One-time fetch of matches
function getMatchesOnce() {
  return new Promise((resolve) => {
    const matchesRef = ref(db, "t4_bouldering/matches");
    onValue(
      matchesRef,
      (snapshot) => {
        resolve(snapshot.val() || {});
      },
      { onlyOnce: true }
    );
  });
}

// Initialize live data for a match
async function initializeLiveData({ matchId, leftTeam, rightTeam, teams }) {
  await set(ref(db, `t4_bouldering/live_status/${matchId}`), {
    clock: "07:30",
    period: "1ST",
    on_boulders: {
      [leftTeam]: { player_id: "", boulder_id: "", attempts: 0, points: 0 },
      [rightTeam]: { player_id: "", boulder_id: "", attempts: 0, points: 0 },
    },
  });

  const leftTeamData = teams[leftTeam];
  const rightTeamData = teams[rightTeam];

  await set(ref(db, `t4_bouldering/scoreboard/${matchId}`), {
    left: {
      team_id: leftTeam,
      abbreviation: leftTeamData.abbreviation || "",
      current_player: "",
      jersey: 0,
      possible: 0,
      score: 0,
      side: "left",
      team_logo: leftTeamData.logo_url || null,
    },
    right: {
      team_id: rightTeam,
      abbreviation: rightTeamData.abbreviation || "",
      current_player: "",
      jersey: 0,
      possible: 0,
      score: 0,
      side: "right",
      team_logo: rightTeamData.logo_url || null,
    },
  });
}

// --------------------
// Service functions
// --------------------

// Subscribe to teams
export function getTeams(callback) {
  const teamsRef = ref(db, "t4_bouldering/teams");
  return onValue(teamsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

// Subscribe to matches
export function getMatches(callback, setLoading) {
  const matchesRef = ref(db, "t4_bouldering/matches");
  return onValue(matchesRef, (snapshot) => {
    callback(snapshot.val() || {});
    if (setLoading) setLoading(false);
  });
}

// Create new match (scheduled)
export async function createMatch({ leftTeam, rightTeam, matchDate, matchTime }) {
  if (!leftTeam || !rightTeam || leftTeam === rightTeam) {
    throw new Error("Select two different teams");
  }
  if (!matchDate || !matchTime) {
    throw new Error("Select date and time");
  }

  const scheduledTime = new Date(`${matchDate}T${matchTime}`);
  const matchCode = getNextMatchCode(await getMatchesOnce());
  const matchId = generateMatchId(matchCode, scheduledTime);

  await set(ref(db, `t4_bouldering/matches/${matchId}`), {
    teams: [leftTeam, rightTeam],
    start_time: scheduledTime.getTime(),
    end_time: null,
    status: "scheduled",
    quarters: 2,
    quarter_duration: 450,
  });

  return matchId;
}

// Start match (set live + initialize live data)
export async function startMatch({ matchId, leftTeam, rightTeam, teams }) {
  await update(ref(db, `t4_bouldering/matches/${matchId}`), { status: "live" });
  await initializeLiveData({ matchId, leftTeam, rightTeam, teams });
}
