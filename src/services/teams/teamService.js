import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

function teamsRef() {
  return ref(db, "t4_bouldering/teams");
}

export function subscribeTeams(callback) {
  return onValue(teamsRef(), (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, t]) => ({
      id,
      name: t.name || id,
      abbreviation: t.abbreviation || "",
      logo_url: t.logo_url || "",
    }));
    callback(list);
  });
}


export const teamService = {
  subscribeTeams,
};
