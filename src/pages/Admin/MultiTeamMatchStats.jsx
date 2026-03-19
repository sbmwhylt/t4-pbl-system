import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { ref, get } from "firebase/database";
import { db } from "@/firebase";

const TEAM_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
];

export default function MultiTeamMatchStats() {
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
  const teamEntries = Object.entries(teams || {});

  const getPointColor = (points) => {
    if (points === 0) return "text-red-400";
    if (points <= 2) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">
          Multi-Team Match Statistics
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

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {teamEntries.map(([teamKey, team], index) => {
          if (!team) return null;

          const avatarColor = TEAM_COLORS[index % TEAM_COLORS.length];

          return (
            <div
              key={teamKey}
              className="p-6 bg-white rounded-xl border border-gray-100"
            >
              {/* Team Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {team.name || teamKey}
                </h3>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Total Score</p>
                  <p className="text-5xl font-extrabold text-purple-500">
                    {team.score || 0}
                  </p>
                </div>
              </div>

              {/* Player Stats Table */}
              {team.players && Object.keys(team.players).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
                      <tr>
                        <th scope="col" className="px-2 py-3">
                          Player
                        </th>
                        <th scope="col" className="px-2 py-3 text-center">
                          Points
                        </th>
                        <th scope="col" className="px-2 py-3 text-center">
                          Attempts
                        </th>
                        <th scope="col" className="px-2 py-3 text-center">
                          Boulders
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(team.players).map(([id, p]) => {
                        const totalPoints = Object.values(
                          p.boulders || {}
                        ).reduce((sum, b) => sum + (b.points || 0), 0);
                        const totalAttempts = Object.values(
                          p.boulders || {}
                        ).reduce((sum, b) => sum + (b.attempts || 0), 0);

                        return (
                          <tr key={id}>
                            <td className="px-2 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${avatarColor}`}
                                >
                                  {p.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {p.jersey_number ? `#${p.jersey_number}` : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-4 text-center font-medium">
                              {totalPoints}
                            </td>
                            <td className="px-2 py-4 text-center">
                              {totalAttempts}
                            </td>
                            <td className="px-2 py-4">
                              <div className="flex flex-wrap gap-2 justify-center">
                                {Object.entries(p.boulders || {}).map(
                                  ([bName, b]) => (
                                    <div
                                      key={bName}
                                      className="text-xs px-3 py-2 rounded-md bg-gray-50 text-center min-w-[70px] flex justify-between items-start gap-2"
                                    >
                                      <div className="font-semibold text-gray-700">
                                        {bName}
                                      </div>
                                      <div className="block">
                                        <div
                                          className={`font-bold ${getPointColor(
                                            b.points || 0
                                          )}`}
                                        >
                                          {b.points || 0} P
                                        </div>
                                        <div className="text-gray-500">
                                          {b.attempts || 0} A
                                        </div>
                                        <div className="text-gray-500">
                                          {b.currentZone || "-"}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center mt-4 py-8">
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
