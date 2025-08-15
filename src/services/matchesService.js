import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";

// Generate match ID from matchCode and date
function generateMatchId(matchCode, dateObj) {
  const dateStr = dateObj
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "");
  return `M${matchCode}${dateStr}`;
}

// Get next match code based on current matches
function getNextMatchCode(matches) {
  const codes = Object.keys(matches || {})
    .map((id) => {
      const match = id.match(/^M(\d{3})/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
  return String(maxCode + 1).padStart(3, "0");
}

// Subscribe to teams
function getTeams(callback) {
  const teamsRef = ref(db, "t4_bouldering/teams");
  return onValue(teamsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

// Subscribe to matches
function getMatches(callback, setLoading) {
  const matchesRef = ref(db, "t4_bouldering/matches");
  return onValue(matchesRef, (snapshot) => {
    callback(snapshot.val() || {});
    setLoading(false);
  });
}

// Create new match
async function createMatch({ leftTeam, rightTeam, matchDate, matchTime, teams }) {
  if (!leftTeam || !rightTeam || leftTeam === rightTeam) {
    throw new Error("Select two different teams");
  }
  if (!matchDate || !matchTime) {
    throw new Error("Select date and time");
  }

  const scheduledTime = new Date(`${matchDate}T${matchTime}`);
  const status = "scheduled";

  const matchCode = getNextMatchCode(await getMatchesOnce());
  const matchId = generateMatchId(matchCode, scheduledTime);

  await set(ref(db, `t4_bouldering/matches/${matchId}`), {
    teams: [leftTeam, rightTeam],
    start_time: scheduledTime.getTime(),
    end_time: null,
    status,
    quarters: 2,
    quarter_duration: 450, // 7:30
  });

  // If match is live, set up initial data
  if (status === "live") {
    await initializeLiveData({ matchId, leftTeam, rightTeam, teams });
  }
  return matchId;
}

// Helper: one-time fetch matches
function getMatchesOnce() {
  return new Promise((resolve) => {
    const matchesRef = ref(db, "t4_bouldering/matches");
    onValue(matchesRef, (snapshot) => {
      resolve(snapshot.val() || {});
    }, { onlyOnce: true });
  });
}

// Helper: initialize live data
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
    [leftTeam]: {
      abbreviation: leftTeamData.abbreviation,
      current_player: "",
      jersey: 0,
      possible: 0,
      score: 0,
      side: "left",
      team_logo: leftTeamData.logo_url,
    },
    [rightTeam]: {
      abbreviation: rightTeamData.abbreviation,
      current_player: "",
      jersey: 0,
      possible: 0,
      score: 0,
      side: "right",
      team_logo: rightTeamData.logo_url,
    },
  });
}

export default {
  getTeams,
  getMatches,
  createMatch,
};
