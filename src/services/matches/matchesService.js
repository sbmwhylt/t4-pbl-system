import { db } from "../../firebase";
import { ref, set, onValue } from "firebase/database";

// ----------------- Match reference

function matchesRef() {
  return ref(db, "t4_bouldering/matches");
}

// ----------------- Create Match

async function createMatch({ leftTeam, rightTeam, matchDate, matchTime, teams }) {
  if (!leftTeam || !rightTeam) {
    throw new Error("Both teams must be selected");
  }
  const newMatchId = `M${Date.now()}`;
  await set(ref(db, `t4_bouldering/matches/${newMatchId}`), {
    id: newMatchId,
    teams: {
      left: teams[leftTeam] || { id: leftTeam, name: "Unknown" },
      right: teams[rightTeam] || { id: rightTeam, name: "Unknown" },
    },
    matchDate,
    matchTime,
    status: "scheduled",
    start_time: Date.now(),
  });
  return newMatchId;
}

// ----------------- Fetch Matches

function getMatches(callback, setLoading) {
  const unsub = onValue(matchesRef(), (snap) => {
    const data = snap.val() || {};
    callback(data);
    if (setLoading) setLoading(false);
  });
  return unsub;
}

// ----------------- Export

export const matchesService = {
  createMatch,
  getMatches,
};
