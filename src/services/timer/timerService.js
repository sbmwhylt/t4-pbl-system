import { db } from "@/firebase";
import { ref, update, runTransaction } from "firebase/database";
import { DEFAULT_DURATION } from "@/services/constant";

// ------------------------------ Timer References

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

// ------------------------------ Timer Updates

async function setTimer(matchId, patch) {
  await update(
    scoreboardRef(matchId),
    Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [`timer/${k}`, v])
    )
  );
}

// Start fresh or from current remaining
export async function startTimer(
  matchId,
  duration = DEFAULT_DURATION,
  controller = "panel"
) {
  const now = Date.now();
  await setTimer(matchId, {
    running: true,
    controller,
    duration,
    endTime: now + duration * 1000,
    remaining: duration,
    lastAction: now,
  });
}

export async function pauseTimer(matchId, controller = "panel") {
  const r = ref(db, `scoreboard/${matchId}/timer`);
  await runTransaction(r, (current) => {
    if (!current || !current.running) return current;

    const now = Date.now();
    const endTime = current.endTime ?? now;
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    return {
      ...current,
      running: false,
      controller,
      remaining,
      endTime: null, // clear ticking reference
      lastAction: now,
    };
  });
}

export async function resumeTimer(matchId, controller = "panel") {
  const r = ref(db, `scoreboard/${matchId}/timer`);
  await runTransaction(r, (current) => {
    if (!current || current.running) return current;
    const now = Date.now();
    const remaining = current.remaining ?? current.duration ?? DEFAULT_DURATION;
    return {
      ...current,
      running: true,
      controller,
      endTime: now + remaining * 1000,
      lastAction: now,
    };
  });
}

export async function resetTimer(
  matchId,
  duration = DEFAULT_DURATION,
  controller = "panel"
) {
  const now = Date.now();
  await setTimer(matchId, {
    duration,
    remaining: duration,
    running: false,
    controller,
    endTime: null,
    lastAction: now,
  });
}

// ------------------------------ Helpers

export function getRemaining(timer) {
  if (!timer) return 0;
  if (timer.running && timer.endTime) {
    return Math.max(0, Math.floor((timer.endTime - Date.now()) / 1000));
  }
  return timer.remaining ?? timer.duration ?? DEFAULT_DURATION;
}

// ------------------------------ Timer Service Object

export const timerService = {
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  getRemaining,
};
