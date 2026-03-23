import { db } from "@/firebase";
import { ref, get, update, runTransaction } from "firebase/database";

// --------------------- Scoreboard Reference

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

// --------------------------- Team & Score Updates
// Works for BOTH demo (left/right) and multimatch (T1, T2, T3)

export async function setTeam(matchId, side, team) {
  if (team && typeof team === "object" && "current_player" in team) {
    // Update current player + player number + preserve current_boulder
    const updates = {
      [`teams/${side}/current_player`]: team.current_player || null,
      [`teams/${side}/jersey`]: team.jersey || null,
    };
    
    // Only update current_boulder if it's provided in the team object
    if ("current_boulder" in team) {
      updates[`teams/${side}/current_boulder`] = team.current_boulder || "A";
    }
    
    await update(scoreboardRef(matchId), updates);
  } else {
    // if placeholder (no id) → reset team with empty players
    if (!team?.id) {
      await update(scoreboardRef(matchId), {
        [`teams/${side}`]: {
          id: "",
          name: team?.name || "",
          score: 0,
          current_player: null,
          current_boulder: "A",
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
      .filter(
        ([_, p]) => (p.team_id || p.team) === team.id && p.status === "active"
      )
      .reduce((acc, [id, p]) => {
        acc[id] = {
          name: p.name || "",
          jersey_number: p.jersey_number || "",
          points: 0,
          boulders: {
            A: { currentZone: "", attempts: 0, points: 0 },
            B: { currentZone: "", attempts: 0, points: 0 },
            C: { currentZone: "", attempts: 0, points: 0 },
            D: { currentZone: "", attempts: 0, points: 0 },
          },
        };
        return acc;
      }, {});

    // write team + players with initial current_boulder
    await update(scoreboardRef(matchId), {
      [`teams/${side}`]: {
        id: team.id,
        name: team.name || "",
        score: 0,
        current_player: null,
        current_boulder: "A",
        jersey: null,
        players: teamPlayers,
      },
    });
  }
}

// ----------------------- Clear Total Score

export async function clearScore(matchId, side) {
  await update(scoreboardRef(matchId), { [`teams/${side}/score`]: 0 });
}

// ----------------------- Adjust Total Score

export async function adjustScore(matchId, side, delta) {
  const r = ref(db, `scoreboard/${matchId}/teams/${side}/score`);
  await runTransaction(r, (current) => Math.max(0, (current || 0) + delta));
}

// ----------------------- Adjust Player Score

export async function adjustPlayerScore(matchId, side, playerId, delta) {
  if (!playerId) return;

  const playerRef = ref(
    db,
    `scoreboard/${matchId}/teams/${side}/players/${playerId}/points`
  );
  const teamRef = ref(db, `scoreboard/${matchId}/teams/${side}/score`);

  // Update player points
  await runTransaction(playerRef, (current) => {
    return Math.max(0, (current || 0) + delta);
  });

  // Update team score
  await runTransaction(teamRef, (current) => {
    return Math.max(0, (current || 0) + delta);
  });
}

// ----------------------- Adjust Boulder Selection

export async function setCurrentBoulder(matchId, side, boulder) {
  await update(scoreboardRef(matchId), {
    [`teams/${side}/current_boulder`]: boulder || "A",
  });
}