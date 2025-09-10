import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  DEFAULT_DURATION,
  subscribeTeams,
} from "@/services";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const BLANK_TEAM = {
  id: "",
  name: "",
  abbreviation: "",
  logo_url: "",
  score: 0,
};
const BLANK_TIMER = { remaining: DEFAULT_DURATION, running: false };

export default function Live() {
  // --- Set page title ---
  useEffect(() => {
    document.title = "Live ScoreView";
  }, []);

  const { matchId = "demo" } = useParams();
  const [state, setState] = useState({
    teams: { left: BLANK_TEAM, right: BLANK_TEAM },
    timer: BLANK_TIMER,
    period: "1ST",
  });
  const [teams, setTeams] = useState({ left: BLANK_TEAM, right: BLANK_TEAM });
  const [tick, setTick] = useState(0); // 👈 force re-renders every second when running

  // Subscribe to scoreboard
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

  // 👇 local ticking effect
  useEffect(() => {
    if (!state.timer?.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state.timer?.running, state.timer?.endTime]);

  // Determine left/right teams for display
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

  // 👇 compute remaining live
  const remaining =
    timer.running && timer.endTime
      ? Math.max(0, Math.floor((timer.endTime - Date.now()) / 1000))
      : timer.remaining ?? timer.duration ?? DEFAULT_DURATION;

  const noTeamsSelected = !leftScoreboard.id || !rightScoreboard.id;

  return (
    <div className="flex flex-col items-center justify-center pointer-events-none z-50">
      {/* Animated T4 logo */}
      {noTeamsSelected && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <img
            src="/T4-logo.png"
            alt="Loading"
            className="w-24 h-24 animate-pulse"
          />
        </div>
      )}

      {/* Main scoreboard */}
      {!noTeamsSelected && (
        <div className="fixed bottom-0 left-0 w-full px-4 py-2 flex items-center justify-center pointer-events-none z-40">
          <div className="flex items-center justify-center w-full max-w-4xl bg-[#5f8bbb]/80 backdrop-blur-md rounded text-white px-4 gap-3 mb-3">
            {/* Left Team */}
            <div className="flex items-center gap-2">
              <div
                className={`text-center font-medium text-xl h-full w-32 p-2 rounded-sm mr-4 ${
                  leftScoreboard.current_player
                    ? "bg-blue-100 text-gray-900"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {leftScoreboard.current_player || "-"}
              </div>
              {left.logo_url && (
                <img
                  src={left.logo_url}
                  alt={left.abbreviation}
                  className="w-18 h-18 mr-3"
                />
              )}
              <div className="flex justify-center items-center w-16 ">
                <span className="text-5xl font-bold">
                  {leftScoreboard.score || 0}
                </span>
              </div>
            </div>

            {/* Period / Clock */}
            <div className="flex flex-col items-center justify-center w-28 mx-6 h-22 bg-black/50 rounded">
              <div className="text-sm font-semibold uppercase mb-1">
                {period}
              </div>
              <div className="w-22 border-t-3 border-red-600 my-1 opacity-50"></div>
              <div className="text-3xl tracking-wider font-semibold mt-1">
                {formatTime(remaining)}
              </div>
            </div>

            {/* Right Team */}
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center w-16 ">
                <span className="text-5xl font-bold">
                  {rightScoreboard.score || 0}
                </span>
              </div>
              {right.logo_url && (
                <img
                  src={right.logo_url}
                  alt={right.abbreviation}
                  className="w-18 h-18 ml-3"
                />
              )}
              <div
                className={`text-center font-medium text-xl h-full w-32 p-2 rounded-sm ml-4 ${
                  rightScoreboard.current_player
                    ? "bg-blue-100 text-gray-900"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {rightScoreboard.current_player || "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
