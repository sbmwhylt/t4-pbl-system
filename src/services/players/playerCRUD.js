import { db } from "../../firebase";
import { ref, set, get, update, remove } from "firebase/database";

function playersRef() {
  return ref(db, "t4_bouldering/players");
}

// CREATE — add a player with sequential ID
export async function addPlayer(playerData) {
  const snapshot = await get(playersRef());
  const players = snapshot.val() || {};

  // Generate next sequential ID
  const ids = Object.keys(players).map((id) =>
    parseInt(id.replace("P", ""), 10)
  );
  const nextId = ids.length ? Math.max(...ids) + 1 : 1;

  // Pad number to 3 digits
  const newId = `P${nextId.toString().padStart(3, "0")}`;

  // Write under the correct path
  await set(ref(db, `t4_bouldering/players/${newId}`), playerData);
  return newId;
}

// READ — get all players
export async function getPlayers() {
  const snapshot = await get(playersRef());
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

// TOGGLE — set player status
export async function togglePlayerStatus(playerId, newStatus) {
  const players = await getPlayers();
  const player = players[playerId];
  if (!player) throw new Error("Player not found");

  if (newStatus === "active") {
    const activeCount = Object.values(players).filter(
      (p) => p.team === player.team && p.status === "active"
    ).length;

    if (activeCount >= 5) {
      throw new Error("Max 5 active players per team");
    }
  }

  await updatePlayer(playerId, { status: newStatus });
}
