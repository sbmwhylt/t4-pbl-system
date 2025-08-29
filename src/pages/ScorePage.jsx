import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  DEFAULT_DURATION,
  subscribeTeams,
} from "@/services";

const BLANK_TEAM = {
  id: "",
  name: "",
  abbreviation: "",
  logo_url: "",
  score: 0,
};
const BLANK_TIMER = { remaining: DEFAULT_DURATION, running: false };

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScorePage() {
  const { matchId = "demo" } = useParams();

  const [state, setState] = useState({
    teams: { left: BLANK_TEAM, right: BLANK_TEAM },
    timer: BLANK_TIMER,
    period: "1ST",
  });

  const [teams, setTeams] = useState({});
  const tickingRef = useRef(null);

  // Subscribe to scoreboard updates
  useEffect(() => {
    const unsub = subscribeScoreboard(matchId, (data) => {
      if (data) setState(data);
    });
    return () => unsub();
  }, [matchId]);

  // Subscribe to teams
  useEffect(() => {
    const unsub = subscribeTeams((list) => {
      const map = {};
      list.forEach((t) => (map[t.id] = t));
      setTeams(map);
    });
    return () => unsub();
  }, []);

  const leftScoreboard = {
    ...BLANK_TEAM,
    ...(state.teams?.left || {}),
    current_player: state.teams?.left?.current_player || null,
    jersey: state.teams?.left?.jersey || null,
  };

  const rightScoreboard = {
    ...BLANK_TEAM,
    ...(state.teams?.right || {}),
    current_player: state.teams?.right?.current_player || null,
    jersey: state.teams?.right?.jersey || null,
  };

  const left = teams[leftScoreboard.id] || leftScoreboard;
  const right = teams[rightScoreboard.id] || rightScoreboard;
  const timer = state.timer || BLANK_TIMER;
  const period = state.period || "1ST";

  const noTeamsSelected = !leftScoreboard.id || !rightScoreboard.id;

  function getTeamColor(abbreviation) {
    switch (abbreviation) {
      case "DNX":
        return "bg-gradient-to-tr from-red-500 via-red-800 to-red-900";
      case "BGR":
        return "bg-gradient-to-tr from-yellow-400 via-yellow-600 to-yellow-700";
      case "HTS":
        return "bg-gradient-to-tr from-green-700 via-green-800 to-green-900";
      default:
        return "bg-gray-500";
    }
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      {noTeamsSelected ? (
        <div className="flex flex-col items-center justify-center h-full">
          <img
            src="/T4-logo.png"
            alt="Loading"
            className="w-32 h-32 animate-pulse"
          />
          <p className="mt-4 text-lg">Waiting for match data...</p>
        </div>
      ) : (
        <div className="w-full h-full grid grid-cols-3">
          {/* Left Team */}
          <div
            className={`flex flex-col items-center justify-center gap-4 p-6 ${getTeamColor(
              left.abbreviation
            )}`}
          >
            {left.logo_url && (
              <div className="w-90 h-90 flex items-center justify-center  object-cover">
                <img
                  src={left.logo_url}
                  alt={left.abbreviation}
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-9xl font-extrabold mt-6">
              {leftScoreboard.score}
            </div>
            <div className="text-5xl bg-black/30 px-4 py-2 rounded">
              {leftScoreboard.current_player
                ? `${leftScoreboard.current_player}
                `
                : "No Player"}
            </div>
          </div>

          {/* Timer / Period with divider */}
          <div className="flex flex-col items-center justify-center gap-3 relative bg-gray-800">
            {/* Divider line */}
            <div className="absolute left-0 top-0 h-full w-1 bg-white/30"></div>
            <div className="absolute right-0 top-0 h-full w-1 bg-white/30"></div>

            <div className="text-3xl font-semibold uppercase">{period}</div>
            <div className="text-9xl font-mono font-bold">
              {formatTime(timer.remaining)}
            </div>
          </div>

          {/* Right Team */}
          <div
            className={`flex flex-col items-center justify-center gap-4 p-6 ${getTeamColor(
              right.abbreviation
            )}`}
          >
            {right.logo_url && (
              <div className="w-90 h-90 flex items-center justify-center   object-cover">
                <img
                  src={right.logo_url}
                  alt={right.abbreviation}
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-9xl font-extrabold mt-6">
              {rightScoreboard.score}
            </div>
            <div className="text-5xl bg-black/30 px-4 py-2 rounded">
              {rightScoreboard.current_player
                ? `${rightScoreboard.current_player}
                  `
                : "No Player"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
