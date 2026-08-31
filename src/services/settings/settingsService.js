import { db } from "@/firebase";
import { ref, get, onValue, set } from "firebase/database";
import { DEFAULT_MAX_ACTIVE_PLAYERS, TEAM_SIZE_OPTIONS } from "../constant";

function maxActivePlayersRef() {
  return ref(db, "t4_bouldering/settings/max_active_players");
}

// Coerce whatever is stored into one of the allowed team sizes
function normalize(value) {
  const n = parseInt(value, 10);
  return TEAM_SIZE_OPTIONS.includes(n) ? n : DEFAULT_MAX_ACTIVE_PLAYERS;
}

// ----------------- Read the current active-players-per-team limit

export async function getMaxActivePlayers() {
  const snap = await get(maxActivePlayersRef());
  return normalize(snap.val());
}

// ----------------- Subscribe to limit changes

export function subscribeMaxActivePlayers(callback) {
  return onValue(maxActivePlayersRef(), (snap) => callback(normalize(snap.val())));
}

// ----------------- Update the limit (must be one of TEAM_SIZE_OPTIONS)

export async function setMaxActivePlayers(value) {
  const n = parseInt(value, 10);
  if (!TEAM_SIZE_OPTIONS.includes(n)) {
    throw new Error(`Team size must be one of: ${TEAM_SIZE_OPTIONS.join(", ")}`);
  }
  await set(maxActivePlayersRef(), n);
  return n;
}
