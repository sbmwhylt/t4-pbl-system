import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

// ----------------- Player reference

function playersRef() {
  return ref(db, "t4_bouldering/players");
}

// ----------------- Subscribe to Player Updates

export function subscribePlayers(callback) {
  return onValue(playersRef(), (snap) => {
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
