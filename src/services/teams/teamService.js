import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";

// --------------------------- Team References

function teamsRef() {
  return ref(db, "t4_bouldering/teams");
}

// --------------------------- Team Subscriptions

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

// --------------------------- Team Service Object

export const teamService = {
  subscribeTeams,
};
