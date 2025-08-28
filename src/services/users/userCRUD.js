// services/users.js
import { db } from "@/firebase";
import { ref, set, get, update, remove } from "firebase/database";

// Create user in database using Firebase UID
export async function createUser(uid, userData) {
  await set(ref(db, `t4_bouldering/users/${uid}`), userData);
  return uid;
}

// Read all users
export async function getUsers() {
  const snapshot = await get(ref(db, "t4_bouldering/users"));
  return snapshot.exists() ? snapshot.val() : {};
}

// Update user
export async function updateUser(uid, userData) {
  await update(ref(db, `t4_bouldering/users/${uid}`), userData);
}

// Delete user
export async function deleteUser(uid) {
  await remove(ref(db, `t4_bouldering/users/${uid}`));
}

// Change user password in database (not Auth)
export async function changeUserPassword(uid, newPassword) {
  await update(ref(db, `t4_bouldering/users/${uid}`), { password: newPassword });
}
