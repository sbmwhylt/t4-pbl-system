import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import AdminLayout from "../../components/layout/AdminLayout";
import { Users, Trophy, Swords, Star, Medal } from "lucide-react";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamsRef = ref(db, "t4_bouldering/teams");
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formatted = Object.entries(data).map(([id, team]) => ({
          id,
          ...team,
        }));
        setTeams(formatted);
      } else {
        setTeams([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Teams</h2>
      {loading ? (
        <p>Loading...</p>
      ) : teams.length === 0 ? (
        <p>No teams found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => {
            const playerCount = team.players?.length || 0;
            const matchesPlayed = 5; // placeholder
            const wins = 2; // placeholder

            return (
              <div
                key={team.id}
                className="relative bg-white shadow-md rounded-lg p-6 grid grid-cols-2 items-center overflow-hidden"
              >
                {/* Silhouette image */}
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="absolute top-1/2 left-30 w-[130%] h-[130%] -translate-x- -translate-y-1/2 object-contain opacity-75 pointer-events-none select-none"
                />

                {/* Text content */}
                <div className="relative flex flex-col items-start justify-center gap-4 z-10 pl-2">
                  <div>
                    <h3 className="text-2xl font-semibold">{team.name}</h3>
                    <div className="flex gap-2 items-center ">
                      <p className="text-gray-500">
                        ID: <span className="font-semibold">{team.id}</span>
                      </p>
                      {/* <p className="text-gray-500 ">Abv: {team.abbreviation}</p> */}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2 w-full">
                    <div className="flex gap-2 items-center">
                      <Users className="inline-block" size={18} />
                      <p>
                        Players:{" "}
                        <span className="font-semibold">{playerCount}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Swords className="inline-block" size={18} />
                      <p>
                        Matches Played:{" "}
                        <span className="font-semibold">{matchesPlayed}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Star
                        className="inline-block text-yellow-500"
                        size={18}
                        fill="currentColor"
                      />
                      <p>
                        Wins: <span className="font-semibold">{wins}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
