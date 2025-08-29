import { db } from "../../firebase";
import { ref, push, set, get, update, remove } from "firebase/database";

function teamsRef() {
  return ref(db, "t4_bouldering/teams");
}

// CREATE — add a team
export async function addTeam(teamData) {
  const newRef = push(teamsRef());
  await set(newRef, teamData);
  return newRef.key;
}

// READ — get all teams
export async function getTeams() {kw
  const snapshot = await get(teamsRef());
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

// UPDATE — update an existing team
export async function updateTeam(teamId, updatedData) {
  await update(ref(db, `t4_bouldering/teams/${teamId}`), updatedData);
}

// DELETE — remove a team
export async function deleteTeam(teamId) {
  await remove(ref(db, `t4_bouldering/teams/${teamId}`));
}
