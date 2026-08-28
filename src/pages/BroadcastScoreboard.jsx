import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  DEFAULT_DURATION,
  subscribeTeams,
  getPossibleScore,
  PERIODS,
} from "@/services";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";

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

export default function BroadcastScoreboard() {
  useEffect(() => {
    document.title = "Broadcast Scoreboard";
  }, []);

  const { matchId = "multimatch" } = useParams();

  const [state, setState] = useState({
    teams: {},
    timer: BLANK_TIMER,
    period: "1ST",
  });
  const [teamsData, setTeamsData] = useState({});

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
      (p) => (p.display_name || p.name) === current_player,
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
    boulder: leftTeamData?.current_boulder || null,
  };

  const rightScoreboard = {
    ...BLANK_TEAM,
    ...(rightTeamData || {}),
    current_player: rightTeamData?.current_player || null,
    jersey: rightTeamData?.jersey || null,
    current_zone: rightCurrentBoulder?.currentZone || null,
    possibleScore: rightPossible,
    boulder: rightTeamData?.current_boulder || null,
  };

  const left = teamsData[leftScoreboard.id] || leftScoreboard;
  const right = teamsData[rightScoreboard.id] || rightScoreboard;
  const period = state.period || "1ST";
  // Rounds 1–2 (1ST/2ND) are the first half, 3–4 (3RD/4TH) are the second half
  const periodIndex = PERIODS.indexOf(period);
  const half =
    periodIndex === -1 ? null : periodIndex < 2 ? "1ST HALF" : "2ND HALF";

  // Shared, server-synced countdown — identical on every screen
  const remaining = useSyncedCountdown(state.timer || BLANK_TIMER, matchId);

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
        <div className="fixed bottom-0 left-0 w-full px-2 xl:px-4 py-2 flex items-center justify-center pointer-events-none z-40">
          <div className="flex flex-col xl:flex-row items-center justify-center w-full max-w-full bg-[#5f8bbb]/80 backdrop-blur-md rounded text-white px-2 xl:px-4 gap-2 xl:gap-3 mb-3">
            {/* Left Team */}
            <div className="flex items-center gap-1 xl:gap-2 min-w-0 max-w-full">
              <div className="text-center font-medium text-sm xl:text-xl tracking-wide h-full w-24 xl:w-60 p-1 xl:p-2 rounded-sm mr-2 xl:mr-12 bg-black/65 truncate">
                {leftScoreboard.current_player} {leftScoreboard.jersey || ""}
              </div>

              <div className="grid grid-cols-1 w-12 xl:w-24 h-12 xl:h-22 shrink-0">
                <div className="flex items-center justify-center bg-white text-black text-sm xl:text-2xl font-bold">
                  {leftScoreboard.current_zone || "-"}
                </div>

                {/* Possible score */}
                {leftScoreboard.possibleScore != null &&
                  leftScoreboard.possibleScore > 0 && (
                    <div className="flex items-center justify-center bg-black text-white text-sm xl:text-2xl font-medium">
                      + {leftScoreboard.possibleScore}
                    </div>
                  )}
              </div>

              {/* Logo + current boulder (A/B/C/D), small and non-dominant */}
              <div className="flex items-center gap-1 xl:gap-1.5 mr-1 ml-1 xl:mr-5 xl:ml-4 shrink-0">
                {leftScoreboard.boulder && (
                  <span className="w-5 h-5 xl:w-7 xl:h-7 rounded-full bg-black/80 border border-white/40 text-white text-[10px] xl:text-sm font-bold leading-none flex items-center justify-center shrink-0">
                    {leftScoreboard.boulder}
                  </span>
                )}
                {left.logo_url && (
                  <img
                    src={left.logo_url}
                    alt={left.abbreviation}
                    className="w-8 h-8 xl:w-20 xl:h-20 shrink-0"
                  />
                )}
              </div>

              <div className="flex justify-center items-center w-8 xl:w-16 shrink-0">
                <span className="text-2xl xl:text-7xl font-medium text-white">
                  {leftScoreboard.score || 0}
                </span>
              </div>
            </div>

            {/* Period / Clock */}
            <div className="flex flex-col items-center justify-center w-20 xl:w-28 mx-1 xl:mx-6 h-16 xl:h-24 bg-black/50 rounded shrink-0">
              <div className="text-xs xl:text-lg font-semibold uppercase leading-none">
                {period}
              </div>
              {half && (
                <div className="text-[6px] xl:text-[9px] font-medium uppercase tracking-wider text-white/50 leading-none mt-0.5">
                  {half}
                </div>
              )}
              <div className="w-14 xl:w-22 border-t-3 border-red-600 my-1 opacity-50"></div>
              <div className="text-lg xl:text-4xl tracking-wider font-semibold mt-1">
                {formatTime(remaining)}
              </div>
            </div>

            {/* Right Team - Mirrored layout */}
            <div className="flex items-center gap-1 xl:gap-2 min-w-0 max-w-full">
              <div className="flex justify-center items-center w-8 xl:w-16 shrink-0">
                <span className="text-2xl xl:text-7xl font-medium text-white">
                  {rightScoreboard.score || 0}
                </span>
              </div>

              {/* Logo + current boulder (A/B/C/D), small and non-dominant */}
              <div className="flex items-center gap-1 xl:gap-1.5 ml-1 mr-1 xl:ml-5 xl:mr-4 shrink-0">
                {right.logo_url && (
                  <img
                    src={right.logo_url}
                    alt={right.abbreviation}
                    className="w-8 h-8 xl:w-20 xl:h-20 shrink-0"
                  />
                )}
                {rightScoreboard.boulder && (
                  <span className="w-5 h-5 xl:w-7 xl:h-7 rounded-full bg-black/80 border border-white/40 text-white text-[10px] xl:text-sm font-bold leading-none flex items-center justify-center shrink-0">
                    {rightScoreboard.boulder}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 w-12 xl:w-24 h-12 xl:h-22 shrink-0">
                {/* Show current zone */}
                <div className="flex items-center justify-center bg-white text-black text-sm xl:text-2xl font-bold">
                  {rightScoreboard.current_zone || "-"}
                </div>

                {/* Possible score */}
                {rightScoreboard.possibleScore != null &&
                  rightScoreboard.possibleScore > 0 && (
                    <div className="flex items-center justify-center bg-black text-white text-sm xl:text-2xl font-medium">
                      + {rightScoreboard.possibleScore}
                    </div>
                  )}
              </div>

              <div className="text-center font-medium text-sm xl:text-xl tracking-wide h-full w-24 xl:w-60 p-1 xl:p-2 rounded-sm ml-2 xl:ml-12 bg-black/65 truncate">
                {rightScoreboard.current_player} {rightScoreboard.jersey || ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
