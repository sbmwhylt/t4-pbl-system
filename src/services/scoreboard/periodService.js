import { db } from "../../firebase";
import { ref, update } from "firebase/database";

function scoreboardRef(matchId) {
  return ref(db, `scoreboard/${matchId}`);
}
