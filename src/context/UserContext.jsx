import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get, set, update, onDisconnect, onValue } from "firebase/database";

const UserContext = createContext(null);

// Set to 15 seconds for testing
// const SESSION_DURATION = 15 * 1000;
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let sessionTimeout;
    let presenceUnsub;
    let forceLogoutUnsub;
    let currentUid = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clear any previous timeout and presence listener
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (presenceUnsub) presenceUnsub();
      if (forceLogoutUnsub) forceLogoutUnsub();

      if (currentUser) {
        currentUid = currentUser.uid;

        // Set login timestamp
        const loginTime = Date.now();
        localStorage.setItem("loginTime", loginTime);

        // Schedule automatic logout after session duration
        sessionTimeout = setTimeout(async () => {
          await auth.signOut();
          setUser(null);
          localStorage.removeItem("loginTime");
        }, SESSION_DURATION);

        // Set up presence tracking
        const userOnlineRef = ref(db, `t4_bouldering/users/${currentUser.uid}/online`);
        const connectedRef = ref(db, ".info/connected");
        presenceUnsub = onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            onDisconnect(userOnlineRef).set(false);
            set(userOnlineRef, true);
          }
        });

        // Listen for force logout flag
        const forceLogoutRef = ref(db, `t4_bouldering/users/${currentUser.uid}/forceLogout`);
        forceLogoutUnsub = onValue(forceLogoutRef, async (snap) => {
          if (snap.val() === true) {
            // Clear the flag, then sign out
            await update(ref(db, `t4_bouldering/users/${currentUser.uid}`), { forceLogout: false });
            await auth.signOut();
            setUser(null);
            localStorage.removeItem("loginTime");
          }
        });

        // Fetch user data from DB
        try {
          const snapshot = await get(ref(db, `t4_bouldering/users/${currentUser.uid}`));
          setUser(snapshot.exists() ? snapshot.val() : null);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        // User signed out — set online status to false
        if (currentUid) {
          set(ref(db, `t4_bouldering/users/${currentUid}/online`), false);
          currentUid = null;
        }
        setUser(null);
        localStorage.removeItem("loginTime");
      }
    });

    return () => {
      unsubscribe();
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (presenceUnsub) presenceUnsub();
      if (forceLogoutUnsub) forceLogoutUnsub();
    };
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
