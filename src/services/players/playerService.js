import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

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

  // Pad number to 3 digits
  const newId = `P${nextId.toString().padStart(3, "0")}`;

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

// TOGGLE — set player status
export async function togglePlayerStatus(playerId, newStatus) {
  // First, get the player to know their team
  const players = await getPlayers();
  const player = players[playerId];
  if (!player) throw new Error("Player not found");

  if (newStatus === "active") {
    // Count current active players for this team
    const activeCount = Object.values(players).filter(
      (p) => p.team === player.team && p.status === "active"
    ).length;

    if (activeCount >= 5) {
      throw new Error("Max 5 active players per team");
    }
  }

  // Update status
  await updatePlayer(playerId, { status: newStatus });
}

// Subscribe to player changes

export function subscribePlayers(callback) {
  const playersRef = ref(db, "t4_bouldering/players");
  return onValue(playersRef, (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, p]) => ({
      id,
      name: p.name || "",
      jersey_number: p.jersey_number || "",
      team_id: p.team_id || p.team || "",
      status: p.status || "inactive",
    }));
    callback(list);
  });
}
