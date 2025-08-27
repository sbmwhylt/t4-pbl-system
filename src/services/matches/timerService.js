import { db } from "../../firebase";
import { ref, update, runTransaction } from "firebase/database";

export const DEFAULT_DURATION = 450; // 7:30

function timerRef(matchId) {
  return ref(db, `scoreboard/${matchId}/timer`);
}

export async function setTimer(matchId, patch) {
  await update(ref(db, `scoreboard/${matchId}`), {
    ...Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [`timer/${k}`, v])
    ),
  });
}

export async function startTimer(matchId, controller = "panel") {
  await setTimer(matchId, { running: true, controller });
}

export async function pauseTimer(matchId) {
  await setTimer(matchId, { running: false });
}

export async function resetTimer(matchId, seconds = DEFAULT_DURATION) {
  await setTimer(matchId, { seconds, running: false, controller: null });
}

export async function tickTimer(matchId) {
  await runTransaction(timerRef(matchId), (current) => {
    if (!current) return null;
    if (!current.running) return current;

    const nextSeconds = (current.seconds ?? DEFAULT_DURATION) - 1;
    if (nextSeconds <= 0) {
      return { ...current, seconds: 0, running: false };
    }

    return { ...current, seconds: nextSeconds };
  });
}

export const timerService = {
  setTimer,
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
};
