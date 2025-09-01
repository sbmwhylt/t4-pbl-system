import { db } from "../../firebase";
import { ref, update, runTransaction } from "firebase/database";
import { DEFAULT_DURATION } from "../constant";  // ✅ now comes from constants.js


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

export async function tickTimer(matchId) {
  const r = ref(db, `scoreboard/${matchId}/timer`);
  await runTransaction(r, (current) => {
    if (!current) return null;
    if (!current.running) return current;

    const nextRemaining = (current.remaining ?? DEFAULT_DURATION) - 1;

    if (nextRemaining <= 0) {
      return {
        ...current,
        remaining: 0,
        running: false,
        lastAction: Date.now(),
      };
    }
    return { ...current, remaining: nextRemaining };
  });
}

export const timerService = {
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
};
