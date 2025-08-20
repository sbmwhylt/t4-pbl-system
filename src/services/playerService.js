import { db } from "../firebase";
import { ref, set, get, update, remove } from "firebase/database";

// CREATE — add a player with sequential ID
export async function addPlayer(playerData) {
  const playersRef = ref(db, "t4_bouldering/players");
  const snapshot = await get(playersRef);
  const players = snapshot.val() || {};

  // Generate next sequential ID
  const ids = Object.keys(players).map((id) =>
    parseInt(id.replace("P", ""), 10)
  );
  const nextId = ids.length ? Math.max(...ids) + 1 : 1;
  const newId = `P${nextId}`;

  // Write under the correct path
  await set(ref(db, `t4_bouldering/players/${newId}`), playerData);
  return newId;
}

// READ — get all players
export async function getPlayers() {
  const snapshot = await get(ref(db, "t4_bouldering/players"));
  return snapshot.exists() ? snapshot.val() : {};
}

// UPDATE — update a player
export async function updatePlayer(playerId, updatedData) {
  await update(ref(db, `t4_bouldering/players/${playerId}`), updatedData);
}

// DELETE — remove a player
export async function deletePlayer(playerId) {
  await remove(ref(db, `t4_bouldering/players/${playerId}`));
}
