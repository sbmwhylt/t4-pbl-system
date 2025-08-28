import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "@/firebase";

// Create a secondary Firebase app for user management
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export async function createAuthUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );

  // Sign out from secondary to avoid session overwrite
  await secondaryAuth.signOut();

  return userCredential.user;
}
