import { db } from "../firebase";
import { ref, push, set, get, update, remove } from "firebase/database";

// CREATE — add a player
export async function addPlayer(playerData) {
  const newRef = push(ref(db, "players"));
  await set(newRef, playerData);
  return newRef.key;
}

// READ — get all players
export async function getPlayers() {
  const snapshot = await get(ref(db, "players"));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

// UPDATE — update a player
export async function updatePlayer(playerId, updatedData) {
  await update(ref(db, `players/${playerId}`), updatedData);
}

// DELETE — remove a player
export async function deletePlayer(playerId) {
  await remove(ref(db, `players/${playerId}`));
}
