import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { ref, get } from "firebase/database";
import { db } from "@/firebase";

export default function MatchStats() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const snap = await get(ref(db, `t4_bouldering/matches/${matchId}`));
        if (snap.exists()) setMatch(snap.val());
      } catch (err) {
        console.error("Failed to fetch match:", err);
      } finally {
        setLoading(false);
      }
    }

    if (matchId) fetchMatch();
  }, [matchId]);

  if (loading) return <AdminLayout>Loading…</AdminLayout>;
  if (!match) return <AdminLayout>No match found</AdminLayout>;

  const { teams, start_time, status } = match;

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Match Statistics</h2>

      <div className="flex justify-between items-center mb-6">
        <p className="text-lg">
          Status: <span className="font-semibold text-green-500">{status}</span>
        </p>
        <p className="text-lg">
          Date/time:{" "}
          <span className="">
            {start_time ? new Date(start_time).toLocaleString() : "N/A"}
          </span>
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {["left", "right"].map((side) => {
          const team = teams?.[side];
          if (!team) return null;

          return (
            <div
              key={side}
              className="p-6 rounded-lg border border-gray-200 bg-white flex flex-col"
            >
              <div className="fle justify-between items-center">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col leading-tight">
                    <h3 className="text-2xl font-bold ">{team.name}</h3>
                    <p className="text-sm text-gray-500">
                      Total Wins: {team.wins || 0}
                    </p>
                  </div>

                  <p className="text-6xl font-extrabold text-purple-600 text-center mb-6">
                    {team.score}
                  </p>
                </div>
              </div>

              {/* Player stats */}
              {team.players && Object.keys(team.players).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full  rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Player</th>
                        <th className="p-2 border">Jersey</th>
                        <th className="p-2 border">Points</th>
                        <th className="p-2 border">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(team.players).map(([id, p]) => (
                        <tr key={id} className="text-center">
                          <td className="p-2 border">{p.name}</td>
                          <td className="p-2 border">{p.jersey_number}</td>
                          <td className="p-2 border">{p.points || 0}</td>
                          <td className="p-2 border">{p.attempt || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center">
                  No player stats available
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
