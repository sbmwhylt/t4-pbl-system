import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { db } from "@/firebase";
import { ref, onValue, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";

export default function SelectionPage() {
  const user = useUser();
  const fullname = user?.fullname;
  const navigate = useNavigate();
  const matchId = "singlematch"; // Or get dynamically if needed
  const [teams, setTeams] = useState({ left: {}, right: {} });

  // Fetch teams from Firebase
  useEffect(() => {
    if (!matchId) return;
    const teamsRef = ref(db, `scoreboard/${matchId}/teams`);
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      setTeams(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, [matchId]);

  // Select a team to score
  const selectTeam = async (side) => {
    if (!fullname) return;
    const team = teams[side];

    if (!team?.scorer) {
      await update(ref(db, `scoreboard/${matchId}/teams/${side}`), {
        scorer: fullname,
      });
    }

    navigate(`/scorer/${matchId}/${side}`);
  };

  return (
    <AdminLayout>
      <div className="mt-16 max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Select Team to Score
        </h1>

        <div className="grid grid-cols-2 gap-4">
          {["left", "right"].map((side) => {
            const team = teams[side];
            const scorerName = team?.scorer || "Not Assigned";

            return (
              <button
                key={side}
                onClick={() => selectTeam(side)}
                className={`w-full h-64 rounded text-white text-xl font-medium flex items-center justify-center ${
                  team?.scorer
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {team?.name || side.toUpperCase()}
                <br />
                <span className="text-sm mt-2 block">
                  Scorer: {scorerName}
                </span>
              </button>
            );
          })}
        </div>

        {!fullname && (
          <p className="text-center text-gray-500 mt-4">
            Loading user information...
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
