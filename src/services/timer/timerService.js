import { db } from "@/firebase";
import { ref, get, update, onValue, serverTimestamp } from "firebase/database";
import { DEFAULT_DURATION } from "@/services/constant";

// ------------------------------ Server Time Sync
//
// The timer state is server-authoritative: `startAt` is written with Firebase's
// serverTimestamp() sentinel, so the clock of the device that presses "start"
// never enters the math. Every device only applies its OWN measured offset to
// read "now" against that shared server instant, which is what keeps the
// countdown identical on every screen.

let serverOffset = 0;
let clockReady = false;
const clockReadyListeners = new Set();

// Keep server offset updated
onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
  serverOffset = snap.val() || 0;
  if (!clockReady) {
    clockReady = true;
    clockReadyListeners.forEach((fn) => fn());
  }
});

// Always use server time, not device time
export function serverNow() {
  return Date.now() + serverOffset;
}

// True once we have synced with the server clock at least once.
export function isClockReady() {
  return clockReady;
}

// Subscribe to the "clock is ready" event. Returns an unsubscribe fn.
export function onClockReady(fn) {
  if (clockReady) {
    fn();
    return () => {};
  }
  clockReadyListeners.add(fn);
  return () => clockReadyListeners.delete(fn);
}

// ------------------------------ Timer References

function timerRef(matchId) {
  return ref(db, `scoreboard/${matchId}/timer`);
}

// ------------------------------ Derived remaining (single source of truth)
//
// timer shape:
//   duration   – full configured game length (seconds), for display + reset
//   startAt    – server ms timestamp the current run segment began (running only)
//   runSeconds – how long this run segment lasts from startAt (running only)
//   remaining  – authoritative seconds left while paused / stopped
//   endTime    – legacy field kept for older records still mid-run

export function getRemaining(timer) {
  if (!timer) return 0;

  if (timer.running) {
    if (timer.startAt) {
      const runSeconds =
        timer.runSeconds ??
        timer.remaining ??
        timer.duration ??
        DEFAULT_DURATION;
      const endTime = timer.startAt + runSeconds * 1000;
      return Math.max(0, Math.floor((endTime - serverNow()) / 1000));
    }
    // Legacy record written before the startAt model
    if (timer.endTime) {
      return Math.max(0, Math.floor((timer.endTime - serverNow()) / 1000));
    }
  }

  return timer.remaining ?? timer.duration ?? DEFAULT_DURATION;
}

// ------------------------------ Timer Updates
//
// All writes use get()+update() rather than runTransaction so that
// serverTimestamp() is resolved by the server (transactions only ever get a
// local estimate). The get() acts as a lightweight "already running" guard —
// good enough here, since the real bug was clock skew, not write races.

// Start fresh from the full duration.
export async function startTimer(
  matchId,
  duration = DEFAULT_DURATION,
  controller = "panel"
) {
  const r = timerRef(matchId);
  const current = (await get(r)).val();
  if (!current) return;
  if (current.running) return; // another device already started

  const dur = duration ?? current.duration ?? DEFAULT_DURATION;

  await update(r, {
    running: true,
    duration: dur,
    remaining: dur,
    runSeconds: dur,
    startAt: serverTimestamp(),
    endTime: null,
    endedAt: null,
    controller,
    lastController: controller,
    lastAction: serverTimestamp(),
  });
}

export async function pauseTimer(matchId, controller = "panel") {
  const r = timerRef(matchId);
  const current = (await get(r)).val();
  if (!current) return;

  if (!current.running) {
    await update(r, {
      controller,
      lastController: controller,
      lastAction: serverTimestamp(),
    });
    return;
  }

  const remaining = getRemaining(current);

  await update(r, {
    running: false,
    remaining,
    startAt: null,
    runSeconds: null,
    endTime: null,
    controller,
    lastController: controller,
    lastAction: serverTimestamp(),
  });
}

export async function resumeTimer(matchId, controller = "panel") {
  const r = timerRef(matchId);
  const current = (await get(r)).val();
  if (!current) return;

  if (current.running) {
    await update(r, {
      controller,
      lastController: controller,
      lastAction: serverTimestamp(),
    });
    return;
  }

  const remaining =
    current.remaining ?? current.duration ?? DEFAULT_DURATION;

  await update(r, {
    running: true,
    remaining,
    runSeconds: remaining,
    startAt: serverTimestamp(),
    endTime: null,
    endedAt: null,
    controller,
    lastController: controller,
    lastAction: serverTimestamp(),
  });
}

export async function resetTimer(
  matchId,
  duration = DEFAULT_DURATION,
  controller = "panel"
) {
  const r = timerRef(matchId);
  const current = (await get(r)).val();
  if (!current) return;

  const dur = duration ?? current.duration ?? DEFAULT_DURATION;

  await update(r, {
    duration: dur,
    remaining: dur,
    running: false,
    startAt: null,
    runSeconds: null,
    endTime: null,
    endedAt: null,
    controller,
    lastController: controller,
    lastAction: serverTimestamp(),
  });
}

// Called once by the first client that sees the clock hit zero.
export async function resolveTimerExpiry(matchId) {
  const r = timerRef(matchId);
  const current = (await get(r)).val();
  if (!current || !current.running) return;

  await update(r, {
    running: false,
    remaining: 0,
    startAt: null,
    runSeconds: null,
    endTime: null,
    endedAt: serverTimestamp(),
    lastAction: serverTimestamp(),
  });
}

// ------------------------------ Duration Change (only when stopped)

export async function setDuration(matchId, newDuration, controller = "panel") {
  const r = timerRef(matchId);
  const current = (await get(r)).val();
  if (!current) return;
  if (current.running) return; // only allow duration change when stopped

  await update(r, {
    duration: newDuration,
    remaining: newDuration,
    running: false,
    startAt: null,
    runSeconds: null,
    endTime: null,
    lastController: controller,
    lastAction: serverTimestamp(),
  });
}

// ------------------------------ Real-time Listener

export function subscribeToTimer(matchId, callback) {
  return onValue(timerRef(matchId), (snapshot) => {
    callback(snapshot.val());
  });
}

// ------------------------------ Timer Service

export const timerService = {
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  resolveTimerExpiry,
  setDuration,
  getRemaining,
  subscribeToTimer,
  serverNow,
  isClockReady,
  onClockReady,
};
