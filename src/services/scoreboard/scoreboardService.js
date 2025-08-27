import { db } from "../../firebase";
import { ref, onValue, set, update, get } from "firebase/database";

// ======================
// References
// ======================
function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

function matchesRef() {
  return ref(db, "t4_bouldering/matches");
}

// ======================
// Subscriptions
// ======================
export function subscribeScoreboard(matchId, callback) {
  return onValue(scoreboardRef(matchId), (snap) => {
    callback(snap.val() || null);
  });
}

// ======================
// Match Initialization
// ======================
export const DEFAULT_DURATION = 450;
export const DEFAULT_DURATION_SECONDS = 450;

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
// Period Management
// ======================
export function updatePeriod(matchId, period) {
  return update(scoreboardRef(matchId), { period });
}

// ======================
// Match Finalization
// ======================
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

export async function finishMatch() {
  const demoRef = ref(db, "scoreboard/demo");
  const demoSnap = await get(demoRef);
  if (!demoSnap.exists()) throw new Error("No demo data found");

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
  const matchId = generateMatchId(nextCode); // M001, M002, ...

  await set(ref(db, `t4_bouldering/matches/${matchId}`), {
    id: matchId,
    ...demoData,
    status: "finished",
    saved_at: Date.now().toString().slice(0, 13),
    start_time: Date.now(),
  });

  await initMatch("demo");

  return matchId;
}

