import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // adjust path

const INACTIVITY_LIMIT = 1 * 15 * 1000;
const CHECK_INTERVAL_MS = 1000;

export default function useAutoLogout({
  timeout = INACTIVITY_LIMIT,
  checkInterval = CHECK_INTERVAL_MS,
  redirectTo = "/login",
} = {}) {
  const lastActivityRef = useRef(Date.now());
  const loggedOutRef = useRef(false);
  const intervalRef = useRef(null);

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
  };

  const cleanupAll = () => {
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((e) => window.removeEventListener(e, resetTimer));
    document.removeEventListener("visibilitychange", resetTimer);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const doSignOut = async () => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;

    cleanupAll();

    try {
      await signOut(auth);
    } catch (err) {
      console.error("signOut error:", err);
    } finally {
      // optional cross-tab logout
      try {
        localStorage.setItem("app-logout", Date.now().toString());
      } catch (e) {}
      window.location.href = redirectTo;
    }
  };

  useEffect(() => {
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    document.addEventListener("visibilitychange", resetTimer);

    intervalRef.current = setInterval(() => {
      if (loggedOutRef.current) return;
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime >= timeout) {
        console.log("Auto-logout: inactivity limit reached");
        doSignOut();
      }
    }, checkInterval);

    const onStorage = (e) => {
      if (e.key === "app-logout" && !loggedOutRef.current) {
        loggedOutRef.current = true;
        cleanupAll();
        window.location.href = redirectTo;
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      cleanupAll();
    };
  }, [timeout, checkInterval, redirectTo]);
}
