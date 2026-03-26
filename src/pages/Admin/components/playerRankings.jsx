import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Spinner from "@/components/ui/Spinner";
import { ref, get } from "firebase/database";
import { db } from "@/firebase";
import { subscribeTeams } from "@/services";
import { getGradientById } from "@/constants/teamColors";
import { Trophy, Medal } from "lucide-react";

export default function PlayerRankings() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTeam, setFilterTeam] = useState("all");
  const [sortBy, setSortBy] = useState("totalPoints");

  useEffect(() => {
    const unsubTeams = subscribeTeams(setTeams);
    return () => unsubTeams();
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const snap = await get(ref(db, "t4_bouldering/matches"));
        if (snap.exists()) setMatches(snap.val());
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const teamMap = {};
  teams.forEach((t) => {
    teamMap[t.id] = t;
  });

  // Aggregate player stats across all finished matches
  const playerStats = {};

  Object.entries(matches).forEach(([matchId, match]) => {
    if (match.status?.toLowerCase() !== "finished") return;

    const matchTeams = match.teams || {};
    const isOldFormat = matchTeams.left || matchTeams.right;

    const teamsToProcess = isOldFormat
      ? [
          { teamId: matchTeams.left?.id, data: matchTeams.left },
          { teamId: matchTeams.right?.id, data: matchTeams.right },
        ]
      : Object.entries(matchTeams).map(([key, data]) => ({
          teamId: data.id || key,
          data,
        }));

    teamsToProcess.forEach(({ teamId, data }) => {
      if (!data?.players) return;

      Object.entries(data.players).forEach(([playerId, player]) => {
        if (!player.name) return;

        const boulders = player.boulders || {};
        const matchPoints = Object.values(boulders).reduce(
          (sum, b) => sum + (b.points || 0),
          0,
        );
        const matchAttempts = Object.values(boulders).reduce(
          (sum, b) => sum + (b.attempts || 0),
          0,
        );
        const toppedBoulders = Object.values(boulders).filter(
          (b) =>
            b.currentZone === "Top" ||
            b.currentZone === "Top2" ||
            b.currentZone === "Flash",
        ).length;

        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            id: playerId,
            name: player.name,
            jersey_number: player.jersey_number || "",
            teamId,
            totalPoints: 0,
            totalAttempts: 0,
            totalTops: 0,
            gamesPlayed: 0,
            bestGame: 0,
          };
        }

        playerStats[playerId].totalPoints += matchPoints;
        playerStats[playerId].totalAttempts += matchAttempts;
        playerStats[playerId].totalTops += toppedBoulders;
        playerStats[playerId].gamesPlayed += 1;
        playerStats[playerId].bestGame = Math.max(
          playerStats[playerId].bestGame,
          matchPoints,
        );
      });
    });
  });

  // Sort and filter
  let rankings = Object.values(playerStats);

  if (filterTeam !== "all") {
    rankings = rankings.filter((p) => p.teamId === filterTeam);
  }

  const sortFns = {
    totalPoints: (a, b) => b.totalPoints - a.totalPoints,
    gamesPlayed: (a, b) => b.gamesPlayed - a.gamesPlayed,
    avgPoints: (a, b) =>
      (b.gamesPlayed ? b.totalPoints / b.gamesPlayed : 0) -
      (a.gamesPlayed ? a.totalPoints / a.gamesPlayed : 0),
    bestGame: (a, b) => b.bestGame - a.bestGame,
    totalTops: (a, b) => b.totalTops - a.totalTops,
  };

  rankings.sort(sortFns[sortBy] || sortFns.totalPoints);
  rankings = rankings.slice(0, 10);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={18} className="text-yellow-500" />;
    if (index === 1) return <Medal size={18} className="text-gray-400" />;
    if (index === 2) return <Medal size={18} className="text-amber-600" />;
    return (
      <span className="text-sm font-bold text-gray-400 w-[18px] text-center">
        {index + 1}
      </span>
    );
  };

  const getTeamLogo = (teamId) => {
    return teamMap[teamId]?.logo_url || "";
  };

  const getTeamName = (teamId) => {
    return teamMap[teamId]?.name || teamId;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="w-full ">
      <div className="flex justify-between items-center">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800">Player Rankings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Overall player performance across all finished matches
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="totalPoints">Total Points</option>
            <option value="avgPoints">Avg Points / Game</option>
            <option value="bestGame">Best Game</option>
            <option value="gamesPlayed">Games Played</option>
            <option value="totalTops">Total Tops</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold">
            Total Players
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {rankings.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold">
            Matches Played
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {
              Object.values(matches).filter(
                (m) => m.status?.toLowerCase() === "finished",
              ).length
            }
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold">
            Highest Score
          </p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {rankings.length > 0 ? rankings[0]?.totalPoints : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold">
            Best Single Game
          </p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {rankings.length > 0
              ? Math.max(...rankings.map((r) => r.bestGame))
              : 0}
          </p>
        </div>
      </div>

      {/* Rankings Table */}
      {rankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Trophy size={40} strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium">No player data found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Team
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Games
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Pts
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Avg/Game
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Best
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tops
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Attempts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankings.map((player, index) => {
                const avg = player.gamesPlayed
                  ? (player.totalPoints / player.gamesPlayed).toFixed(1)
                  : "0.0";

                return (
                  <tr
                    key={player.id}
                    className="transition-colors hover:bg-gray-50/80 even:bg-gray-50/40"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-800 text-md">
                          {player.name}
                        </p>
                        {player.jersey_number && (
                          <p className="text-md text-gray-400">
                            #{player.jersey_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 items-center">
                        <img
                          src={getTeamLogo(player.teamId)}
                          alt={getTeamName(player.teamId)}
                          className="w-6 h-6 rounded-full object-cover"
                        />

                        <span className="inline-flex items-center  text-sm font-medium text-black ">
                          {getTeamName(player.teamId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-700">
                      {player.gamesPlayed}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-bold text-purple-600">
                        {player.totalPoints}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-700">
                      {avg}
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-700">
                      {player.bestGame}
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-700">
                      {player.totalTops}
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-700">
                      {player.totalAttempts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
