import { db } from "@/firebase";
import { ref, onValue} from "firebase/database";

// Subscribe to player changes

export function subscribePlayers(callback) {
  const playersRef = ref(db, "t4_bouldering/players");
  return onValue(playersRef, (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, p]) => ({
      id,
      name: p.name || "",
      jersey_number: p.jersey_number || "",
      team_id: p.team_id || p.team || "",
      status: p.status || "inactive",
    }));
    callback(list);
  });
}
