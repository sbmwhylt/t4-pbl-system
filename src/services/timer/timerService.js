import { db } from "@/firebase";
import { ref, update, runTransaction, onValue } from "firebase/database";
import { DEFAULT_DURATION } from "@/services/constant";

// ------------------------------ Server Time Sync

let serverOffset = 0;

// Keep server offset updated
onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
  serverOffset = snap.val() || 0;
});

// Always use server time, not device time

export function serverNow() {
  return Date.now() + serverOffset;
}

// ------------------------------ Timer References

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

function timerRef(matchId) {
  return ref(db, `scoreboard/${matchId}/timer`);
}

// ------------------------------ Timer Updates

async function setTimer(matchId, patch) {
  await update(
    scoreboardRef(matchId),
    Object.fromEntries(Object.entries(patch).map(([k, v]) => [`timer/${k}`, v]))
  );
}

// Start fresh or from current remaining
export async function startTimer(
  matchId,
  duration = DEFAULT_DURATION,
  controller = "panel"
) {
  const now = serverNow();

  await setTimer(matchId, {
    running: true,
    controller,
    duration,
    endTime: now + duration * 1000,
    remaining: duration,
    lastAction: now,
    lastController: controller,
  });
}

export async function pauseTimer(matchId, controller = "panel") {
  const r = timerRef(matchId);

  await runTransaction(r, (current) => {
    if (!current) return current;

    const now = serverNow();

    if (!current.running) {
      return {
        ...current,
        controller,
        lastController: controller,
        lastAction: now,
      };
    }

    const endTime = current.endTime ?? now;
    // 👇 FIXED: Use Math.floor instead of Math.ceil to match Live.jsx and ScorerPage.jsx
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    return {
      ...current,
      running: false,
      controller,
      remaining,
      endTime: null,
      lastAction: now,
      lastController: controller,
    };
  });
}

export async function resumeTimer(matchId, controller = "panel") {
  const r = timerRef(matchId);

  await runTransaction(r, (current) => {
    if (!current) return current;

    const now = serverNow();

    if (current.running) {
      return {
        ...current,
        controller,
        lastController: controller,
        lastAction: now,
      };
    }

    const remaining = current.remaining ?? current.duration ?? DEFAULT_DURATION;

    return {
      ...current,
      running: true,
      controller,
      endTime: now + remaining * 1000,
      remaining,
      lastAction: now,
      lastController: controller,
    };
  });
}

export async function resetTimer(
  matchId,
  duration = DEFAULT_DURATION,
  controller = "panel"
) {
  const now = serverNow();

  await setTimer(matchId, {
    duration,
    remaining: duration,
    running: false,
    controller,
    endTime: null,
    lastAction: now,
    lastController: controller,
  });
}

// ------------------------------ Real-time Listener

export function subscribeToTimer(matchId, callback) {
  const timerRef = ref(db, `scoreboard/${matchId}/timer`);
  return onValue(timerRef, (snapshot) => {
    callback(snapshot.val());
  });
}

// ------------------------------ Helpers

export function getRemaining(timer) {
  if (!timer) return 0;

  const now = serverNow();

  if (timer.running && timer.endTime) {
    return Math.max(0, Math.floor((timer.endTime - now) / 1000));
  }

  return timer.remaining ?? timer.duration ?? DEFAULT_DURATION;
}

// ------------------------------ Timer Service

export const timerService = {
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  getRemaining,
  subscribeToTimer,
  serverNow,
};
