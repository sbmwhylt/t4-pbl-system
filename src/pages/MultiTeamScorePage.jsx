import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  DEFAULT_DURATION,
  subscribeTeams,
  timerService,
} from "@/services";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function getTeamColor(index) {
  const colors = [
    "bg-gradient-to-tr from-red-500 via-red-800 to-red-900",
    "bg-gradient-to-tr from-blue-500 via-blue-800 to-blue-900",
    "bg-gradient-to-tr from-green-500 via-green-800 to-green-900",
    "bg-gradient-to-tr from-yellow-500 via-yellow-700 to-yellow-800",
    "bg-gradient-to-tr from-purple-500 via-purple-800 to-purple-900",
    "bg-gradient-to-tr from-pink-500 via-pink-800 to-pink-900",
  ];
  return colors[index % colors.length];
}

export default function MultiTeamScorePage() {
  useEffect(() => {
    document.title = "Multi-Team Score View";
  }, []);

  const { matchId = "demo" } = useParams();

  const [state, setState] = useState({
    teams: {},
    timer: { remaining: DEFAULT_DURATION, running: false },
    period: "1ST",
  });

  const [teamsData, setTeamsData] = useState({});
  const [, forceUpdate] = useState(0);

  // Subscribe to scoreboard
  useEffect(() => {
    const unsub = subscribeScoreboard(matchId, (data) => {
      if (data) setState(data);
    });
    return () => unsub();
  }, [matchId]);

  // Subscribe to teams metadata
  useEffect(() => {
    const unsub = subscribeTeams((list) => {
      const map = {};
      list.forEach((t) => (map[t.id] = t));
      setTeamsData(map);
    });
    return () => unsub();
  }, []);

  // Update timer every 100ms when running
  useEffect(() => {
    if (!state.timer?.running) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [state.timer?.running]);

  const timer = state.timer || { remaining: DEFAULT_DURATION, running: false };
  const period = state.period || "1ST";

  // Calculate current remaining time
  const remaining =
    timer.running && timer.endTime
      ? Math.max(
          0,
          Math.floor((timer.endTime - timerService.serverNow()) / 1000),
        )
      : (timer.remaining ?? timer.duration ?? DEFAULT_DURATION);

  // Get all teams from scoreboard
  const teams = Object.entries(state.teams || {}).map(([key, team]) => {
    const teamMeta = teamsData[team.id] || {};
    return {
      key,
      ...team,
      logo_url: teamMeta.logo_url || "",
      abbreviation: teamMeta.abbreviation || "",
    };
  });

  const noTeamsSelected = teams.length === 0 || teams.every((t) => !t.id);

  // Get current player info for a team
  const getCurrentPlayerInfo = (team) => {
    if (!team.current_player) return null;

    const player = Object.values(team.players || {}).find(
      (p) => p.name === team.current_player,
    );

    if (!player) return null;

    const boulderData = player.boulders?.[team.current_boulder];

    return {
      name: team.current_player,
      jersey: team.jersey,
      currentZone: boulderData?.currentZone || "—",
    };
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      {noTeamsSelected ? (
        <div className="flex flex-col items-center justify-center h-full">
          <img
            src="/T4-logo.png"
            alt="Loading"
            className="w-24 h-24 animate-pulse"
          />
          <p className="text-gray-400 mt-4">No teams selected</p>
        </div>
      ) : (
        <div className="w-full max-w-7xl">
          {/* Timer & Period */}
          <div className="bg-gray-800 rounded-xl p-8 mb-6 text-center">
            <div className="text-4xl font-semibold uppercase mb-4">
              {period}
            </div>
            <div className="text-8xl font-bold tracking-wider">
              {formatTime(remaining)}
            </div>
          </div>

          {/* Teams Grid */}
          <div
            className={`grid gap-4 ${
              teams.length === 2
                ? "grid-cols-2"
                : teams.length === 3
                  ? "grid-cols-3"
                  : teams.length === 4
                    ? "grid-cols-2"
                    : "grid-cols-3"
            }`}
          >
            {teams.map((team, index) => {
              const playerInfo = getCurrentPlayerInfo(team);

              return (
                <div
                  key={team.key}
                  className={`${getTeamColor(index)} rounded-xl p-6 flex flex-col items-center justify-center gap-4`}
                >
                  {/* Team Logo */}
                  {team.logo_url && (
                    <div className="w-32 h-32 flex items-center justify-center">
                      <img
                        src={team.logo_url}
                        alt={team.abbreviation}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  )}

                  {/* Team Name */}
                  <h3 className="text-2xl font-bold text-center">
                    {team.name || team.id}
                  </h3>

                  {/* Score */}
                  <div className="text-7xl font-extrabold">
                    {team.score || 0}
                  </div>

                  {/* Player Info */}
                  {playerInfo && (
                    <div className="bg-black/60 rounded-full px-6 py-3 mt-2 flex items-center gap-3">
                      <span className="text-xl font-medium">
                        {playerInfo.name}
                      </span>
                      <span className="text-xl text-gray-300">
                        #{playerInfo.jersey}
                      </span>
                      <span className="text-xl font-bold bg-white/20 px-3 py-1 rounded-full">
                        {playerInfo.currentZone}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
