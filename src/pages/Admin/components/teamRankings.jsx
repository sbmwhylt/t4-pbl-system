import { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { ref, get } from "firebase/database";
import { db } from "@/firebase";
import { subscribeTeams } from "@/services";
import { getGradientById } from "@/constants/teamColors";
import { Trophy } from "lucide-react";

export default function TeamRankings() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Aggregate team stats across all finished matches
  const teamStats = {};

  Object.values(matches).forEach((match) => {
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
      if (!teamId || !data) return;

      const score = data.score || 0;

      if (!teamStats[teamId]) {
        teamStats[teamId] = {
          id: teamId,
          totalPoints: 0,
          matchesPlayed: 0,
          wins: 0,
        };
      }

      teamStats[teamId].totalPoints += score;
      teamStats[teamId].matchesPlayed += 1;
    });

    // Determine winner of this match
    const scores = teamsToProcess
      .filter(({ teamId, data }) => teamId && data)
      .map(({ teamId, data }) => ({ teamId, score: data.score || 0 }));

    if (scores.length > 0) {
      const maxScore = Math.max(...scores.map((s) => s.score));
      const winners = scores.filter((s) => s.score === maxScore);
      if (winners.length === 1 && teamStats[winners[0].teamId]) {
        teamStats[winners[0].teamId].wins += 1;
      }
    }
  });

  const rankings = Object.values(teamStats).sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );
  const top3 = rankings.slice(0, 3);

  const getTeamInfo = (teamId) => {
    const team = teamMap[teamId];
    return {
      name: team?.name || teamId,
      logo: team?.logo_url || "",
      color: team?.color || "",
      abbreviation: team?.abbreviation || "",
    };
  };

  const getColor = (colorId) => {
    if (!colorId) return { gradient: "bg-gray-500", ring: "ring-gray-500" };
    return getGradientById(colorId);
  };

  const rankConfig = [
    {
      label: "1ST",
      medal: "text-yellow-500",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    {
      label: "2ND",
      medal: "text-gray-400",
      bg: "bg-gray-50",
      border: "border-gray-200",
    },
    {
      label: "3RD",
      medal: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-800">Team Rankings</h2>
        <p className="text-sm text-gray-500 mt-1"> Top 3 teams by total points</p>
      </div>

      {top3.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Trophy size={32} strokeWidth={1.5} />
          <p className="mt-2 text-sm font-medium">No team data found</p>
        </div>
      ) : (
        <div className="flex gap-3">
          {top3.map((team, i) => {
            const config = rankConfig[i];
            const info = getTeamInfo(team.id);
            const color = getColor(info.color);
            const avg = team.matchesPlayed
              ? (team.totalPoints / team.matchesPlayed).toFixed(1)
              : "0.0";

            return (
              <div
                key={team.id}
                className={`flex-1 ${config.bg} rounded-xl border ${config.border} p-4 flex flex-col items-center`}
              >
                {/* Rank badge */}
                <span className={`text-xs font-black ${config.medal} mb-2`}>
                  {config.label}
                </span>

                {/* Team logo / avatar */}
                <div
                  className={`rounded-full ring-2 ${color.ring} bg-white overflow-hidden w-14 h-14 flex items-center justify-center mb-2`}
                >
                  {info.logo ? (
                    <img
                      src={info.logo}
                      alt={info.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className={`text-lg font-bold text-white w-full h-full flex items-center justify-center ${color.gradient}`}
                    >
                      {info.abbreviation || info.name?.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Team name */}
                <p className="font-semibold text-gray-800 text-sm text-center truncate w-full">
                  {info.name}
                </p>

                {/* Total points */}
                <p className="text-xl font-extrabold text-purple-600 mt-1">
                  {team.totalPoints}
                </p>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  points
                </span>

                {/* Stats row */}
                <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-gray-200/60 w-full">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {team.wins}
                    </p>
                    <p className="text-[10px] text-gray-400">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {team.matchesPlayed}
                    </p>
                    <p className="text-[10px] text-gray-400">Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">{avg}</p>
                    <p className="text-[10px] text-gray-400">Avg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
