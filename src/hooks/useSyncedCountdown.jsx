import { useEffect, useRef, useState } from "react";
import {
  getRemaining,
  isClockReady,
  onClockReady,
  resolveTimerExpiry,
} from "@/services/timer/timerService.js";

/**
 * Single countdown implementation shared by every screen.
 *
 * Returns whole seconds remaining, derived from the server-authoritative
 * timer state (see timerService.getRemaining). Pass `matchId` to let the
 * first client that reaches zero write the "finished" state back.
 */
export function useSyncedCountdown(timer, matchId) {
  const [remaining, setRemaining] = useState(() => getRemaining(timer));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      const secs = getRemaining(timer);
      setRemaining(secs);

      if (timer?.running && secs <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        if (matchId) resolveTimerExpiry(matchId).catch(() => {});
      }
    };

    tick();

    if (!timer?.running) return;

    const id = setInterval(tick, 250); // snaps cleanly on each second
    return () => clearInterval(id);
    // `timer` is read inside tick(); we depend on its individual fields instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timer?.running,
    timer?.startAt,
    timer?.runSeconds,
    timer?.remaining,
    timer?.endTime,
    matchId,
  ]);

  return remaining;
}

/**
 * True once the app has synced with the server clock at least once.
 * Use it to gate "start" so a device never launches a timer it can't
 * yet render accurately.
 */
export function useClockReady() {
  const [ready, setReady] = useState(isClockReady());

  useEffect(() => {
    if (isClockReady()) {
      setReady(true);
      return;
    }
    return onClockReady(() => setReady(true));
  }, []);

  return ready;
}
