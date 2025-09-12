import { use, useEffect, useState } from "react";
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
  useEffect(() => {
    document.title = "Score Page View";
  });

  const { matchId = "demo" } = useParams();

  const [state, setState] = useState({
    teams: { left: BLANK_TEAM, right: BLANK_TEAM },
    timer: BLANK_TIMER,
    period: "1ST",
  });

  const [teams, setTeams] = useState({});
  const [tick, setTick] = useState(0);

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

  // local ticking effect
  useEffect(() => {
    if (!state.timer?.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state.timer?.running, state.timer?.endTime]);

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

  // compute remaining live
  const remaining =
    timer.running && timer.endTime
      ? Math.max(0, Math.floor((timer.endTime - Date.now()) / 1000))
      : timer.remaining ?? timer.duration ?? DEFAULT_DURATION;

  const noTeamsSelected = !leftScoreboard.id || !rightScoreboard.id;

  // Function to get player boulder data
  const getPlayerBoulderData = (teamSide) => {
    const players = state.teams?.[teamSide]?.players || {};
    const currentPlayerName = state.teams?.[teamSide]?.current_player;

    if (!currentPlayerName) return null;

    // Find the player by name
    const player = Object.values(players).find(
      (p) => p.name === currentPlayerName
    );

    if (!player || !player.boulders) return null;

    return player.boulders;
  };

  const leftBoulderData = getPlayerBoulderData("left");
  const rightBoulderData = getPlayerBoulderData("right");

  // Boulder order
  const boulders = ["A", "B", "C", "D"];

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

  const zoneColors = {
    Z1: "text-red-400",
    Z2: "text-blue-400",
    Top: "text-yellow-400",
    Top2: "text-purple-400",
    Flash: "text-green-400",
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white text-white">
      {noTeamsSelected ? (
        <div className="flex flex-col items-center justify-center h-full">
          <img
            src="/T4-logo.png"
            alt="Loading"
            className="w-24 h-24 animate-pulse"
          />
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

            {/* Current Player */}
            <div className="px-6 py-4 rounded-xl text-center flex items-center justify-center gap-4">
              {/* Image Placeholder with Jersey Number */}
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-100 text-2xl font-bold tracking-wider">
                  {leftScoreboard.jersey || "?"}
                </span>
              </div>

              {/* Player Name */}
              <h2 className="text-4xl font-bold text-white tracking-wide">
                {leftScoreboard.current_player || "No Player"}
              </h2>
            </div>

            {leftBoulderData && (
              <div className="w-full flex justify-center">
                <div className="grid grid-cols-2 max-w-md w-full gap-2">
                  {boulders.map((boulder) => {
                    const data = leftBoulderData[boulder] || {
                      currentZone: "",
                    };

                    return (
                      <div
                        key={boulder}
                        className="bg-black/40 rounded px-4 py-2 flex items-center justify-between "
                      >
                        {/* Boulder label */}
                        <span className="text-lg font-semibold text-gray-300">
                          {boulder}
                        </span>

                        {/* Zone status */}
                        <span
                          className={`text-2xl font-bold ${
                            zoneColors || "text-gray-500"
                          }`}
                        >
                          {data.currentZone || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Timer / Period */}
          <div className="flex flex-col items-center justify-center gap-3 relative bg-gray-800">
            <div className="absolute left-0 top-0 h-full w-1 bg-white/30"></div>
            <div className="absolute right-0 top-0 h-full w-1 bg-white/30"></div>

            <div className="text-3xl font-semibold uppercase">{period}</div>
            <div className="text-9xl tracking-wider font-bold">
              {formatTime(remaining)}
            </div>
          </div>

          {/* Right Team */}
          <div
            className={`flex flex-col items-center justify-center gap-4 p-6 ${getTeamColor(
              right.abbreviation
            )}`}
          >
            {right.logo_url && (
              <div className="w-90 h-90 flex items-center justify-center object-cover">
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

            {/* Current Player */}
            <div className="px-6 py-4 rounded-xl text-center flex items-center justify-center gap-4">
              {/* Image Placeholder with Jersey Number */}
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-100 text-2xl font-bold tracking-wider">
                  {rightScoreboard.jersey || "?"}
                </span>
              </div>

              {/* Player Name */}
              <h2 className="text-4xl font-bold text-white tracking-wide">
                {rightScoreboard.current_player || "No Player"}
              </h2>
            </div>

            {/* Right Boulder Data */}
            {rightBoulderData && (
              <div className="w-full flex justify-center">
                <div className="grid grid-cols-2 max-w-md w-full gap-2">
                  {boulders.map((boulder) => {
                    const data = rightBoulderData[boulder] || {
                      currentZone: "",
                    };

                    return (
                      <div
                        key={boulder}
                        className="bg-black/40 rounded px-4 py-2 flex items-center justify-between "
                      >
                        {/* Boulder label */}
                        <span className="text-lg font-semibold text-gray-300">
                          {boulder}
                        </span>

                        {/* Zone status */}
                        <span
                          className={`text-2xl font-bold ${
                            zoneColors || "text-gray-500"
                          }`}
                        >
                          {data.currentZone || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
