import { db } from "../../firebase";
import { ref, set, update, runTransaction } from "firebase/database";
import { DEFAULT_DURATION } from "@/services/constant";

// --------------------- Scoreboard Reference

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

// ----------------------- Init Match

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

// --------------------------- Team & Score Updates

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

// ----------------------- Clear Score

export async function clearScore(matchId, side) {
  await update(scoreboardRef(matchId), { [`teams/${side}/score`]: 0 });
}

// ----------------------- Adjust Score

export async function adjustScore(matchId, side, delta) {
  const r = ref(db, `scoreboard/${matchId}/teams/${side}/score`);
  await runTransaction(r, (current) => Math.max(0, (current || 0) + delta));
}
