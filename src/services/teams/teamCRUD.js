import { db } from "@/firebase";
import { ref, set, get, update, remove } from "firebase/database";

// --------------------------- Team References

function teamsRef() {
  return ref(db, "t4_bouldering/teams");
} 


// CREATE —----------------- add a team with sequential T-key (T1, T2, T3...)

export async function addTeam(teamData) {
  const snapshot = await get(teamsRef());
  const existing = snapshot.val() || {};

  const maxNum = Object.keys(existing)
    .filter((k) => /^T\d+$/.test(k))
    .reduce((max, k) => Math.max(max, parseInt(k.slice(1), 10)), 0);

  const newKey = `T${maxNum + 1}`;
  await set(ref(db, `t4_bouldering/teams/${newKey}`), teamData);
  return newKey;
}

// READ —------------------- get all teams

export async function getTeams() {
  const snapshot = await get(teamsRef());
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

// UPDATE —----------------------- update an existing team

export async function updateTeam(teamId, updatedData) {
  await update(ref(db, `t4_bouldering/teams/${teamId}`), updatedData);
}

// DELETE —----------------------- remove a team

export async function deleteTeam(teamId) {
  await remove(ref(db, `t4_bouldering/teams/${teamId}`));
}
