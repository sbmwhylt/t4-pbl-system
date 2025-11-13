import { useEffect, useRef } from "react";
import { auth } from "../firebase"; // your firebase config
import { signOut } from "firebase/auth";

// 4hrs 
// const INACTIVITY_LIMIT = 4 * 60 * 60 * 1000; 
// 15 mins
const INACTIVITY_LIMIT =  15 * 60 * 1000;

export default function useAutoLogout() {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime > INACTIVITY_LIMIT) {
        console.log("Logging out now");
        signOut(auth)
          .then(() => {
            console.log("User logged out due to inactivity");
            window.location.href = "/login";
          })
          .catch((err) => console.error("Logout error:", err));
      }
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearInterval(interval);
    };
  }, []);
}
