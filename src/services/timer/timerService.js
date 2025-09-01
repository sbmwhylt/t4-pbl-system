import { db } from "../../firebase";
import { ref, update, runTransaction } from "firebase/database";
import { DEFAULT_DURATION } from "../constant"; // constants.js

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}

async function setTimer(matchId, patch) {
  await update(
    scoreboardRef(matchId),
    Object.fromEntries(Object.entries(patch).map(([k, v]) => [`timer/${k}`, v]))
  );
}

export async function startTimer(matchId, controller = "panel") {
  await setTimer(matchId, { running: true, controller, lastAction: Date.now() });
}

export async function pauseTimer(matchId, controller = "panel") {
  await setTimer(matchId, { running: false, controller, lastAction: Date.now() });
}

export async function resetTimer(matchId, duration = DEFAULT_DURATION, controller = "panel") {
  await setTimer(matchId, {
    duration,
    remaining: duration,
    running: false,
    controller,
    lastAction: Date.now(),
  });
}

// Safely handle multiple panels calling tickTimer
export async function tickTimer(matchId) {
  const r = ref(db, `scoreboard/${matchId}/timer`);
  await runTransaction(r, (current) => {
    if (!current || !current.running) return current;

    const now = Date.now();
    const elapsed = Math.floor((now - (current.lastAction || now)) / 1000);
    if (elapsed <= 0) return current;

    const nextRemaining = Math.max(0, (current.remaining ?? DEFAULT_DURATION) - elapsed);

    return {
      ...current,
      remaining: nextRemaining,
      running: nextRemaining > 0,
      lastAction: now,
    };
  });
}

export const timerService = {
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
};
