import { ref, update } from "firebase/database";
import { db } from "../../firebase";

const updateLiveStatus = (matchId, teamSide, teamUpdates = {}, matchUpdates = {}) => {
  // Update scoreboard team info
  if (teamSide) {
    update(ref(db, `scoreboard/${matchId}/${teamSide}`), {
      ...teamUpdates
    });
  }

  // Update global scoreboard info (timer, period, etc.)
  if (Object.keys(matchUpdates).length > 0) {
    update(ref(db, `scoreboard/${matchId}`), matchUpdates);
  }
};

export default updateLiveStatus;
