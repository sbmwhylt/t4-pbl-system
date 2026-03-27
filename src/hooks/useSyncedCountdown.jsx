import { useEffect, useState } from "react";
import { serverNow } from "@/services/timer/timerService.js";

export function useSyncedCountdown(timer) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!timer) return;

    const updateRemaining = () => {
      if (!timer.running || !timer.endTime) {
        setRemaining(timer.remaining ?? timer.duration ?? 0);
        return;
      }

      const now = serverNow();
      const secs = Math.max(0, Math.floor((timer.endTime - now) / 1000));
      setRemaining(secs);
    };

    updateRemaining();

    const interval = setInterval(updateRemaining, 250); // smooth updates
    return () => clearInterval(interval);
  }, [timer?.running, timer?.endTime, timer?.remaining]);

  return remaining;
}
