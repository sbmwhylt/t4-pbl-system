import { db } from "../../firebase";
import { ref, get, set, update, runTransaction } from "firebase/database";
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
    // only update current player + jersey
    await update(scoreboardRef(matchId), {
      [`teams/${side}/current_player`]: team.current_player || null,
      [`teams/${side}/jersey`]: team.jersey || null,
    });
  } else {
    // if placeholder (no id) → reset team with empty players
    if (!team?.id) {
      await update(scoreboardRef(matchId), {
        [`teams/${side}`]: {
          id: "",
          name: team?.name || "",
          score: 0,
          current_player: null,
          jersey: null,
          players: {},
        },
      });
      return;
    }

    // get all players
    const snap = await get(ref(db, "t4_bouldering/players"));
    const val = snap.val() || {};

    // filter by team + active, then build object keyed by id
    const teamPlayers = Object.entries(val)
      .filter(([_, p]) => (p.team_id || p.team) === team.id && p.status === "active")
      .reduce((acc, [id, p]) => {
        acc[id] = {
          name: p.name || "",
          jersey_number: p.jersey_number || "",
          points: 0,
          attempt: 1,
        };
        return acc;
      }, {});

    // write team + players
    await update(scoreboardRef(matchId), {
      [`teams/${side}`]: {
        id: team.id,
        name: team.name || "",
        score: 0,
        current_player: null,
        jersey: null,
        players: teamPlayers,
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

// ----------------------- Player Attempts

export async function updatePlayerAttempt(matchId, side, playerId, attempt) {
  const r = ref(db, `scoreboard/${matchId}/teams/${side}/players/${playerId}/attempt`);
  await set(r, attempt);
}
