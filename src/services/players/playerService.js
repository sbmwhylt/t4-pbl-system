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
    const list = Object.entries(val).map(([id, p]) => {
      const firstName = p.first_name || "";
      const lastName = p.last_name || p.name || "";
      return {
        id,
        first_name: firstName,
        last_name: lastName,
        // full name for internal/admin use
        name: firstName ? `${firstName} ${lastName}` : lastName,
        // last name only for public display
        display_name: lastName,
        jersey_number: p.jersey_number || "",
        team_id: p.team_id || p.team || "",
        status: p.status || "inactive",
      };
    });
    callback(list);
  });
}
