// import { db } from "../firebase";
// import {
//   ref,
//   onValue,
//   set,
//   update,
//   runTransaction,
//   get,
// } from "firebase/database";

// // ======================
// // References
// // ======================
// function scoreboardRef(matchId) {
//   return ref(db, `scoreboard/${matchId}`);
// }

// function teamsRef() {
//   return ref(db, `t4_bouldering/teams`);
// }

// function matchesRef() {
//   return ref(db, "t4_bouldering/matches");
// }

// // ======================
// // Subscriptions
// // ======================
// export function subscribeScoreboard(matchId, callback) {
//   return onValue(scoreboardRef(matchId), (snap) => {
//     callback(snap.val() || null);
//   });
// }

// export function subscribeTeams(callback) {
//   return onValue(teamsRef(), (snap) => {
//     const val = snap.val() || {};
//     const list = Object.entries(val).map(([id, t]) => ({
//       id,
//       name: t.name || id,
//       abbreviation: t.abbreviation || "",
//       logo_url: t.logo_url || "",
//     }));
//     callback(list);
//   });
// }

// // ======================
// // Match Initialization
// // ======================
// export const DEFAULT_DURATION = 450;
// export const DEFAULT_DURATION_SECONDS = 450;

// export async function initMatch(matchId) {
//   await set(scoreboardRef(matchId), {
//     teams: {
//       left: { id: "", name: "Left", score: 0 },
//       right: { id: "", name: "Right", score: 0 },
//     },
//     timer: {
//       duration: DEFAULT_DURATION,
//       remaining: DEFAULT_DURATION,
//       running: false,
//     },
//     period: "1ST",
//   });
// }

// // ======================
// // Team & Score Updates
// // ======================
// export async function setTeam(matchId, side, team) {
//   if (team && typeof team === "object" && "current_player" in team) {
//     await update(scoreboardRef(matchId), {
//       [`teams/${side}/current_player`]: team.current_player || null,
//       [`teams/${side}/jersey`]: team.jersey || null,
//     });
//   } else {
//     await update(scoreboardRef(matchId), {
//       [`teams/${side}`]: {
//         id: team?.id || "",
//         name: team?.name || team || "",
//         score: 0,
//         current_player: null,
//         jersey: null,
//       },
//     });
//   }
// }

// export async function clearScore(matchId, side) {
//   await update(scoreboardRef(matchId), { [`teams/${side}/score`]: 0 });
// }

// export async function adjustScore(matchId, side, delta) {
//   const r = ref(db, `scoreboard/${matchId}/teams/${side}/score`);
//   await runTransaction(r, (current) => Math.max(0, (current || 0) + delta));
// }

// // ======================
// // Timer Functions
// // ======================
// export async function setTimer(matchId, patch) {
//   await update(
//     scoreboardRef(matchId),
//     Object.fromEntries(Object.entries(patch).map(([k, v]) => [`timer/${k}`, v]))
//   );
// }

// export async function startTimer(matchId, controller = "panel") {
//   await setTimer(matchId, { running: true, controller });
// }

// export async function pauseTimer(matchId) {
//   await setTimer(matchId, { running: false });
// }

// export async function resetTimer(matchId, duration = DEFAULT_DURATION) {
//   await setTimer(matchId, { duration, remaining: duration, running: false });
// }

// export async function tickTimer(matchId) {
//   const r = ref(db, `scoreboard/${matchId}/timer`);
//   await runTransaction(r, (current) => {
//     if (!current) return null;
//     if (!current.running) return current;

//     const nextRemaining = (current.remaining ?? DEFAULT_DURATION) - 1;

//     if (nextRemaining <= 0) {
//       return { ...current, remaining: 0, running: false };
//     }

//     return { ...current, remaining: nextRemaining };
//   });
// }

// // ======================
// // Period Update
// // ======================
// export function updatePeriod(matchId, period) {
//   return update(scoreboardRef(matchId), { period });
// }

// // ======================
// // Players subscription
// // ======================
// export function subscribePlayers(callback) {
//   const playersRef = ref(db, "t4_bouldering/players");

//   return onValue(playersRef, (snap) => {
//     const val = snap.val() || {};
//     const list = Object.entries(val).map(([id, p]) => ({
//       id,
//       name: p.name || "",
//       jersey_number: p.jersey_number || "",
//       team_id: p.team_id || p.team || "", // fallback to team
//       status: p.status || "inactive",
//     }));
//     callback(list);
//   });
// }


// // ======================
// // Finish Match (record demo as finished match)
// // ======================
// async function getNextSequence() {
//   const matchesSnap = await get(matchesRef());
//   const matches = matchesSnap.val() || {};
//   const today = new Date();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");
//   const year = today.getFullYear().toString().slice(-2);

//   const seqs = Object.keys(matches)
//     .filter((id) => id.endsWith(`${month}${day}${year}`))
//     .map((id) => parseInt(id.slice(1, 3)))
//     .filter(Number.isFinite);

//   const nextSeq = seqs.length ? Math.max(...seqs) + 1 : 1;
//   return String(nextSeq).padStart(2, "0");
// }

// export async function finishMatch() {
//   const demoRef = ref(db, "scoreboard/demo");
//   const demoSnap = await get(demoRef);
//   if (!demoSnap.exists()) throw new Error("No demo data found");

//   const demoData = demoSnap.val();

//   // Validation: ensure both teams are selected and have a score > 0
//   const leftTeam = demoData?.teams?.left;
//   const rightTeam = demoData?.teams?.right;

//   if (!leftTeam?.id || !rightTeam?.id) {
//     throw new Error("Both teams must be selected");
//   }

//   if ((leftTeam?.score || 0) <= 0 && (rightTeam?.score || 0) <= 0) {
//     throw new Error("Both teams must have at least 1 point");
//   }

//   const sequence = await getNextSequence();
//   const today = new Date();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");
//   const year = today.getFullYear().toString().slice(-2);

//   const matchId = `M${sequence}${month}${day}${year}`;

//   // Save demo data into matches as finished
//   await set(ref(db, `t4_bouldering/matches/${matchId}`), {
//     id: matchId,
//     ...demoData,
//     status: "finished",
//     saved_at: Date.now().toString().trim().slice(0, 13),
//     start_time: Date.now(),
//   });

//   // Reset demo scoreboard
//   await initMatch("demo");

//   return matchId;
// }
