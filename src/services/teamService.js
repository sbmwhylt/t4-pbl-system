import { db } from "../firebase";
import { ref, push, set, get, update, remove } from "firebase/database";

// CREATE — add a team
export async function addTeam(teamData) {
  const newRef = push(ref(db, "teams"));
  await set(newRef, teamData);
  return newRef.key;
}

// READ — get all teams
export async function getTeams() {
  const snapshot = await get(ref(db, "teams"));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

// UPDATE — update an existing team
export async function updateTeam(teamId, updatedData) {
  await update(ref(db, `teams/${teamId}`), updatedData);
}

// DELETE — remove a team
export async function deleteTeam(teamId) {
  await remove(ref(db, `teams/${teamId}`));
}
