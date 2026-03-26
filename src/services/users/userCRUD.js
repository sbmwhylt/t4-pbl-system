import { db } from "@/firebase";
import { ref, set, get, update, remove } from "firebase/database";

// CREATE ---------------------------- add new users

export async function createUser(uid, userData) {
  await set(ref(db, `t4_bouldering/users/${uid}`), userData);
  return uid;
}

// READ ------------------------------ get all users

export async function getUsers() {
  const snapshot = await get(ref(db, "t4_bouldering/users"));
  return snapshot.exists() ? snapshot.val() : {};
}

// UPDATE ------------------------------ update user

export async function updateUser(uid, userData) {
  await update(ref(db, `t4_bouldering/users/${uid}`), userData);
}

// DELETE ------------------------------ delete user

export async function deleteUser(uid) {
  await remove(ref(db, `t4_bouldering/users/${uid}`));
}

// FORCE LOGOUT ----------------------------- set forceLogout flag

export async function forceLogoutUser(uid) {
  await update(ref(db, `t4_bouldering/users/${uid}`), { forceLogout: true, online: false });
}

// Change user password --------------------------- in database (not Auth)

export async function changeUserPassword(uid, newPassword) {
  await update(ref(db, `t4_bouldering/users/${uid}`), { password: newPassword });
}
