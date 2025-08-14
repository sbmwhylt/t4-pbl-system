import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";

const UserContext = createContext(null);

// Set to 15 seconds for testing
// const SESSION_DURATION = 15 * 1000; 
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let sessionTimeout;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clear any previous timeout
      if (sessionTimeout) clearTimeout(sessionTimeout);

      if (currentUser) {
        // Set login timestamp
        const loginTime = Date.now();
        localStorage.setItem("loginTime", loginTime);

        // Schedule automatic logout after session duration
        sessionTimeout = setTimeout(async () => {
          await auth.signOut();
          setUser(null);
          localStorage.removeItem("loginTime");
        }, SESSION_DURATION);

        // Fetch user data from DB
        try {
          const snapshot = await get(ref(db, `t4_bouldering/users/${currentUser.uid}`));
          setUser(snapshot.exists() ? snapshot.val() : null);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        // User signed out
        setUser(null);
        localStorage.removeItem("loginTime");
      }
    });

    return () => {
      unsubscribe();
      if (sessionTimeout) clearTimeout(sessionTimeout);
    };
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
