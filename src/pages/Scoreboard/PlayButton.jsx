import { CirclePlay } from "lucide-react";
import { ref, update, get } from "firebase/database";
import { db } from "../../firebase";

export default function PlayButton({ row }) {
  async function startMatch() {
    try {
      // Extract team IDs from array
      const teamAId = row.teams?.[0];
      const teamBId = row.teams?.[1];

      if (!teamAId || !teamBId) {
        console.error("Match has missing team IDs:", row);
        return;
      }

      // 1. Get team data
      const [teamASnap, teamBSnap] = await Promise.all([
        get(ref(db, `t4_bouldering/teams/${teamAId}`)),
        get(ref(db, `t4_bouldering/teams/${teamBId}`)),
      ]);

      if (!teamASnap.exists() || !teamBSnap.exists()) {
        console.error("One or both teams not found:", teamAId, teamBId);
        return;
      }

      const teamA = teamASnap.val();
      const teamB = teamBSnap.val();

      // 2. Update match status
      await update(ref(db, `t4_bouldering/matches/${row.id}`), {
        status: "Live",
      });

      // 3. Setup scoreboard
      await update(ref(db, `scoreboard/${row.id}`), {
        left: {
          team_logo: teamA.logo_url || "",
          abbreviation: teamA.abbreviation || "",
          score: 0,
          possible: 0,
          jersey: "",
          current_player: "",
        },
        right: {
          team_logo: teamB.logo_url || "",
          abbreviation: teamB.abbreviation || "",
          score: 0,
          possible: 0,
          jersey: "",
          current_player: "",
        },
        period: "1ST",
        timeLeft: 0,
      });

      console.log("Match started successfully");
    } catch (error) {
      console.error("Error starting match:", error);
    }
  }

  return (
    <button className="cursor-pointer" onClick={startMatch}>
      <CirclePlay className="text-green-600 hover:text-green-800" size={16} />
    </button>
  );
}
