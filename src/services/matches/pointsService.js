// services/pointsService.js
import { db } from "../../firebase";
import { ref, get } from "firebase/database";

export async function calculatePoints(matchId, boulderId, attempt, progress) {
  if (!boulderId || !progress) return 0;

  const snap = await get(ref(db, `t4_bouldering/boulders/${boulderId}`));
  if (!snap.exists()) return 0;

  const boulder = snap.val();
  let points = 0;

  switch (progress) {
    case "Z1":
      points = boulder.points_zone_1 || 0;
      break;
    case "Z2":
      points = (boulder.points_zone_2 || 0) + (boulder.points_zone_1 || 0);
      break;
    case "Top":
      if (attempt === 1) {
        points = (boulder.points_top || 0) + (boulder.flash_bonus || 0);
      } else if (attempt === 2) {
        points = (boulder.points_top_attempt_2 || 0);
      } else {
        points = boulder.points_top || 0;
      }
      break;
    default:
      points = 0;
  }

  return points;
}
