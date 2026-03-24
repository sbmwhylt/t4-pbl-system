import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  DEFAULT_DURATION,
  subscribeTeams,
  timerService,
  getPossibleScore,
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

export default function MultiTeamLive() {
  useEffect(() => {
    document.title = "Multi-Team Live ScoreView";
  }, []);

  const { matchId = "multimatch" } = useParams();

  const [state, setState] = useState({
    teams: {},
    timer: BLANK_TIMER,
    period: "1ST",
  });
  const [teamsData, setTeamsData] = useState({});
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsub = subscribeScoreboard(matchId, (data) => {
      if (data) setState(data);
    });
    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    const unsub = subscribeTeams((list) => {
      const map = {};
      list.forEach((t) => (map[t.id] = t));
      setTeamsData(map);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!state.timer?.running) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [state.timer?.running, state.timer?.endTime]);

  // Build teams from state
  const allTeams = Object.entries(state.teams || {}).map(([key, team]) => {
    const meta = teamsData[team.id] || {};
    return {
      key,
      ...team,
      logo_url: meta.logo_url || "",
      abbreviation: meta.abbreviation || "",
    };
  });

  // Respect overlay config: pick left/right teams
  const overlay = state.overlay;
  const teamsMap = Object.fromEntries(allTeams.map((t) => [t.key, t]));

  const leftTeamData = overlay?.left ? teamsMap[overlay.left] : allTeams[0];
  const rightTeamData = overlay?.right ? teamsMap[overlay.right] : allTeams[1];

  // Function to get current player's boulder + zone
  const getCurrentPlayerBoulder = (team) => {
    if (!team) return null;
    const { current_player, current_boulder, players } = team;
    if (!current_player || !current_boulder) return null;
    const player = Object.values(players || {}).find(
      (p) => p.name === current_player,
    );
    if (!player) return null;
    const boulderData = player.boulders?.[current_boulder];
    if (!boulderData) return null;
    return {
      label: current_boulder,
      currentZone: boulderData.zone || boulderData.currentZone || "—",
      attempts: boulderData.attempts || 0,
      points: boulderData.points || 0,
    };
  };

  const leftCurrentBoulder = getCurrentPlayerBoulder(leftTeamData);
  const rightCurrentBoulder = getCurrentPlayerBoulder(rightTeamData);

  const leftPossible = leftCurrentBoulder
    ? getPossibleScore(leftCurrentBoulder.attempts, leftCurrentBoulder.points)
    : null;
  const rightPossible = rightCurrentBoulder
    ? getPossibleScore(rightCurrentBoulder.attempts, rightCurrentBoulder.points)
    : null;

  const leftScoreboard = {
    ...BLANK_TEAM,
    ...(leftTeamData || {}),
    current_player: leftTeamData?.current_player || null,
    jersey: leftTeamData?.jersey || null,
    current_zone: leftCurrentBoulder?.currentZone || null,
    possibleScore: leftPossible,
  };

  const rightScoreboard = {
    ...BLANK_TEAM,
    ...(rightTeamData || {}),
    current_player: rightTeamData?.current_player || null,
    jersey: rightTeamData?.jersey || null,
    current_zone: rightCurrentBoulder?.currentZone || null,
    possibleScore: rightPossible,
  };

  const left = teamsData[leftScoreboard.id] || leftScoreboard;
  const right = teamsData[rightScoreboard.id] || rightScoreboard;
  const timer = state.timer || BLANK_TIMER;
  const period = state.period || "1ST";

  const remaining =
    timer.running && timer.endTime
      ? Math.max(
          0,
          Math.floor((timer.endTime - timerService.serverNow()) / 1000),
        )
      : (timer.remaining ?? timer.duration ?? DEFAULT_DURATION);

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
          <div className="flex items-center justify-center w-full bg-[#5f8bbb]/80 backdrop-blur-md rounded text-white px-4 gap-3 mb-3">
            {/* Left Team */}
            <div className="flex items-center gap-2">
              <div className="text-center font-medium text-xl tracking-wide h-full w-60 p-2 rounded-sm mr-12 bg-black/65">
                {leftScoreboard.current_player} {leftScoreboard.jersey || ""}
              </div>

              <div className="grid cols-2 w-24 h-22">
                <div className="flex items-center justify-center bg-white text-black text-2xl font-bold">
                  {leftScoreboard.current_zone || "-"}
                </div>

                {/* Possible score */}
                {leftScoreboard.possibleScore != null &&
                  leftScoreboard.possibleScore > 0 && (
                    <div className="flex items-center justify-center bg-black text-white text-2xl font-medium">
                      + {leftScoreboard.possibleScore}
                    </div>
                  )}
              </div>

              {/* Show current zone */}

              {left.logo_url && (
                <img
                  src={left.logo_url}
                  alt={left.abbreviation}
                  className="w-20 h-20 mr-5 ml-4"
                />
              )}

              <div className="flex justify-center items-center w-16">
                <span className="text-7xl font-medium text-white">
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
                <span className="text-7xl font-medium text-white">
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

              <div className="grid cols-2 w-24 h-22">
                {/* Show current zone */}
                <div className="flex items-center justify-center bg-white text-black text-2xl font-bold">
                  {rightScoreboard.current_zone || "-"}
                </div>

                {/* Possible score */}
                {rightScoreboard.possibleScore != null &&
                  rightScoreboard.possibleScore > 0 && (
                    <div className="flex items-center justify-center bg-black text-white text-2xl font-medium">
                      + {rightScoreboard.possibleScore}
                    </div>
                  )}
              </div>

              <div className="text-center font-medium text-xl tracking-wide h-full w-60 p-2 rounded-sm ml-12 bg-black/65">
                {rightScoreboard.current_player} {rightScoreboard.jersey || "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
