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

  const { matchId = "singlematch" } = useParams();
  const [state, setState] = useState({
    teams: { left: BLANK_TEAM, right: BLANK_TEAM },
    timer: BLANK_TIMER,
    period: "1ST",
  });
  const [teams, setTeams] = useState({ left: BLANK_TEAM, right: BLANK_TEAM });
  const [tick, setTick] = useState(0); // 👈 Force re-renders every second when running

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

  // 👇 Local ticking effect - updates every second when timer is running
  useEffect(() => {
    if (!state.timer?.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state.timer?.running, state.timer?.endTime]);

  // Function to get current player's boulder + zone
  const getCurrentPlayerBoulder = (teamSide) => {
    const team = state.teams?.[teamSide];
    if (!team) return null;

    const { current_player, current_boulder, players } = team;
    if (!current_player || !current_boulder) return null;

    const player = Object.values(players || {}).find(
      (p) => p.name === current_player
    );
    if (!player) return null;

    const boulderData = player.boulders?.[current_boulder];
    if (!boulderData) return null;

    return {
      label: current_boulder,
      currentZone: boulderData.zone || boulderData.currentZone || "—",
    };
  };

  const leftCurrentBoulder = getCurrentPlayerBoulder("left");
  const rightCurrentBoulder = getCurrentPlayerBoulder("right");

  const leftScoreboard = {
    ...BLANK_TEAM,
    ...(state.teams?.left || {}),
    current_player: state.teams?.left?.current_player || null,
    jersey: state.teams?.left?.jersey || null,
    current_zone: leftCurrentBoulder?.currentZone || null,
  };

  const rightScoreboard = {
    ...BLANK_TEAM,
    ...(state.teams?.right || {}),
    current_player: state.teams?.right?.current_player || null,
    jersey: state.teams?.right?.jersey || null,
    current_zone: rightCurrentBoulder?.currentZone || null,
  };

  const left = teams[leftScoreboard.id] || leftScoreboard;
  const right = teams[rightScoreboard.id] || rightScoreboard;
  const timer = state.timer || BLANK_TIMER;
  const period = state.period || "1ST";

  // 👇 Compute remaining time using SERVER TIME from timerService
  const remaining =
    timer.running && timer.endTime
      ? Math.max(
          0,
          Math.floor((timer.endTime - timerService.serverNow()) / 1000)
        )
      : timer.remaining ?? timer.duration ?? DEFAULT_DURATION;

  const noTeamsSelected = !leftScoreboard.id || !rightScoreboard.id;

  return (
    <div className="flex flex-col items-center justify-center pointer-events-none z-50">
      {/* Animated T4 logo */}
      {noTeamsSelected && (
        <div className="fixed inset-0 flex flex-col items-center justify-center h-full gap-6">
          <img
            src="/T4-logo.png"
            alt="T4"
            className="w-32 h-32 opacity-20 animate-pulse"
          />
          <p className="text-gray-400 text-3xl font-bold tracking-widest uppercase">
            Waiting for teams…
          </p>
        </div>
      )}

      {/* Main scoreboard */}
      {!noTeamsSelected && (
        <div className="fixed bottom-0 left-0 w-full px-4 py-2 flex items-center justify-center pointer-events-none z-40">
          <div className="flex items-center justify-center w-fit bg-[#5f8bbb]/80 backdrop-blur-md rounded text-white px-4 gap-3 mb-3">
            {/* Left Team */}
            <div className="flex items-center gap-2">
              <div className="text-center font-medium text-3xl h-full w-60 p-2 rounded-sm mr-10 bg-black/65">
                {leftScoreboard.current_player} {leftScoreboard.jersey || "-"}
              </div>

              {/* Show current zone */}
              <div className="flex items-center justify-center w-24 h-22 bg-blue-100 text-gray-900 text-2xl font-bold">
                {leftScoreboard.current_zone || "-"}
              </div>

              {left.logo_url && (
                <img
                  src={left.logo_url}
                  alt={left.abbreviation}
                  className="w-20 h-20 mr-5 ml-4"
                />
              )}

              <div className="flex justify-center items-center w-16">
                <span className="text-7xl font-bold">
                  {leftScoreboard.score || 0}
                </span>
              </div>
            </div>

            {/* Period / Clock */}
            <div className="flex flex-col items-center justify-center w-28 mx-6 h-22 bg-black/50 rounded">
              <div className="text-lg font-semibold uppercase">{period}</div>
              <div className="w-22 border-t-3 border-red-600 my-1 opacity-50"></div>
              <div className="text-4xl tracking-wider font-semibold mt-1">
                {formatTime(remaining)}
              </div>
            </div>

            {/* Right Team - Mirrored layout */}
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center w-16">
                <span className="text-7xl font-bold">
                  {rightScoreboard.score || 0}
                </span>
              </div>

              {right.logo_url && (
                <img
                  src={right.logo_url}
                  alt={right.abbreviation}
                  className="w-20 h-20 ml-5 mr-4"
                />
              )}

              {/* Show current zone */}
              <div className="flex items-center justify-center w-24 h-22 bg-blue-100 text-gray-900 text-2xl font-bold">
                {rightScoreboard.current_zone || "-"}
              </div>

              <div className="text-center font-medium text-3xl h-full w-60 p-2 rounded-sm ml-10 bg-black/65">
                {rightScoreboard.current_player} {rightScoreboard.jersey || "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}