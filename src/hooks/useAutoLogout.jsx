import { useEffect, useRef } from "react";
import { auth } from "../firebase"; // your firebase config
import { signOut } from "firebase/auth";

// const INACTIVITY_LIMIT = 10 * 1000; // 10 seconds for testing
const INACTIVITY_LIMIT = 60 * 60 * 1000; // 60 minutes = 1 hour

export default function useAutoLogout() {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    //   console.log("Activity detected, timer reset");
    };

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      //   console.log(`Inactive time: ${Math.floor(inactiveTime / 1000)}s`);
      if (inactiveTime > INACTIVITY_LIMIT) {
        console.log("Logging out now");
        signOut(auth)
          .then(() => {
            console.log("User logged out due to inactivity");
            window.location.href = "/login";
          })
          .catch((err) => console.error("Logout error:", err));
      }
    }, 1000); // check every second

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearInterval(interval);
    };
  }, []);
}
