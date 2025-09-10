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

  const getPointColor = (points) => {
    if (points === 0) return "text-red-400";
    if (points <= 2) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">
          Match Statistics
        </h2>
        <div className="flex justify-between items-center text-gray-700 text-lg">
          <span>
            Status:{" "}
            <span className="font-semibold text-green-500">{status}</span>
          </span>
          <span>
            Date/Time:{" "}
            {start_time ? new Date(start_time).toLocaleString() : "N/A"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {["left", "right"].map((side) => {
          const team = teams?.[side];
          if (!team) return null;

          return (
            <div
              key={side}
              className="p-6 bg-white rounded-xl border border-gray-100 flex flex-col gap-4"
            >
              {/* Team Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  {team.name}
                </h3>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Total Score</p>
                  <p className="text-5xl font-extrabold text-purple-500">
                    {team.score || 0}
                  </p>
                </div>
              </div>

              {/* Player Cards with Divider */}
              {team.players && Object.keys(team.players).length > 0 ? (
                <div className="flex flex-col divide-y divide-gray-200 ">
                  {Object.entries(team.players).map(([id, p]) => {
                    const totalPoints = Object.values(p.boulders || {}).reduce(
                      (sum, b) => sum + (b.points || 0),
                      0
                    );
                    const totalAttempts = Object.values(
                      p.boulders || {}
                    ).reduce((sum, b) => sum + (b.attempts || 0), 0);

                    return (
                      <div key={id} className="pt-5 pb-10">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold 
    ${side === "left" ? "bg-red-500" : "bg-blue-500"}`}
                            >
                              {p.name.charAt(0)}
                            </div>

                            <p className="font-semibold text-gray-800">
                              {p.name} #{p.jersey_number}
                            </p>
                          </div>
                          <div className="flex gap-4 text-gray-700">
                            <p className="text-sm">
                              Total Points:{" "}
                              <span className="font-bold">{totalPoints}</span>
                            </p>
                            <p className="text-sm">
                              Total Attempts:{" "}
                              <span className="font-bold">{totalAttempts}</span>
                            </p>
                          </div>
                        </div>

                        {/* Boulders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {Object.entries(p.boulders || {}).map(
                            ([bName, b]) => (
                              <div
                                key={bName}
                                className="p-2 border border-gray-100 rounded-lg flex flex-col items-center bg-gray-50"
                              >
                                <p className="font-semibold mb-1 text-gray-700">
                                  {bName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Attempts: {b.attempts || 0}
                                </p>
                                <p
                                  className={`text-sm font-bold ${getPointColor(
                                    b.points || 0
                                  )}`}
                                >
                                  Points: {b.points || 0}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Best Zone: {b.currentZone || "-"}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center mt-4">
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
