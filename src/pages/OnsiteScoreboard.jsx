import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  DEFAULT_DURATION,
  subscribeTeams,
  timerService,
  getPossibleScore,
} from "@/services";
import { getGradientById } from "@/constants/teamColors";
import { Shirt } from "lucide-react";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function OnsiteScoreboard() {
  useEffect(() => {
    document.title = "On-Site Scoreboard";
  }, []);

  const { matchId = "multimatch" } = useParams();

  const [state, setState] = useState({
    teams: {},
    timer: { remaining: DEFAULT_DURATION, running: false },
    period: "1ST",
  });

  const [teamsData, setTeamsData] = useState({});
  const [, forceUpdate] = useState(0);
  const wasRunning = useRef(false);

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

  // Play a long beep when the timer starts
  useEffect(() => {
    const running = !!state.timer?.running;
    if (running && !wasRunning.current) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.5;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      osc.onended = () => ctx.close();
    }
    wasRunning.current = running;
  }, [state.timer?.running]);

  // Update timer every 100ms when running
  useEffect(() => {
    if (!state.timer?.running) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [state.timer?.running]);

  const timer = state.timer || { remaining: DEFAULT_DURATION, running: false };
  const round = state.round ?? 1;

  // Calculate current remaining time
  const remaining =
    timer.running && timer.endTime
      ? Math.max(
          0,
          Math.floor((timer.endTime - timerService.serverNow()) / 1000),
        )
      : (timer.remaining ?? timer.duration ?? DEFAULT_DURATION);

  const allTeams = Object.entries(state.teams || {}).map(([key, team]) => {
    const teamMeta = teamsData[team.id] || {};
    return {
      key,
      ...team,
      logo_url: teamMeta.logo_url || "",
      abbreviation: teamMeta.abbreviation || "",
      color: teamMeta.color || "",
    };
  });

  // Respect overlay config: show only the two selected teams in left/right order
  const overlay = state.overlay;
  const teams = (() => {
    if (overlay?.left && overlay?.right) {
      const teamsMap = Object.fromEntries(allTeams.map((t) => [t.key, t]));
      return [teamsMap[overlay.left], teamsMap[overlay.right]].filter(Boolean);
    }
    return allTeams;
  })();

  const noTeamsSelected = allTeams.length === 0 || allTeams.every((t) => !t.id);

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
      points: player.points || 0,
      possibleScore: getPossibleScore(
        boulderData?.attempts || 0,
        boulderData?.points || 0,
      ),
    };
  };

  const gridCols =
    teams.length <= 2
      ? "grid-cols-2"
      : teams.length === 3
        ? "grid-cols-3"
        : teams.length === 4
          ? "grid-cols-4"
          : teams.length <= 6
            ? "grid-cols-3"
            : "grid-cols-4";

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-gray-100 text-gray-900">
      {noTeamsSelected ? (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <img
            src="/T4-logo.png"
            alt="T4"
            className="w-32 h-32 opacity-20 animate-pulse"
          />
          <p className="text-gray-400 text-3xl font-bold tracking-widest uppercase">
            Waiting for teams…
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Teams grid */}
          <div className={`grid ${gridCols} gap-3 p-3 flex-1 min-h-0`}>
            {teams.map((team) => {
              const playerInfo = getCurrentPlayerInfo(team);
              const teamGradient = team.color
                ? getGradientById(team.color)
                : null;
              const hasColor = !!teamGradient;

              return (
                <div
                  key={team.key}
                  className={`rounded-2xl shadow-lg flex flex-col overflow-hidden ${
                    hasColor
                      ? `${teamGradient.gradient} border border-white/20`
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {/* Card body */}
                  <div className="flex flex-col flex-1 min-h-0 px-5 pt-4 pb-0">
                    {/* Top row: logo + team name */}
                    <div className="flex items-center justify-center gap-4 shrink-0">
                      {team.logo_url && (
                        <img
                          src={team.logo_url}
                          alt={team.abbreviation || team.name}
                          className="object-contain shrink-0 rounded-lg"
                          style={{
                            width: "clamp(3.5rem, 6vw, 6rem)",
                            height: "clamp(3.5rem, 6vw, 6rem)",
                          }}
                        />
                      )}

                      {/* Team name */}
                      <h3
                        className={`font-medium leading-tight truncate flex-1 ${
                          hasColor ? "text-white" : "text-gray-900"
                        }`}
                        style={{ fontSize: "clamp(1.4rem, 2.8vw, 2.8rem)" }}
                      >
                        {team.name || team.key}
                      </h3>
                    </div>

                    {/* Team score — fills remaining space */}
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      <span
                        className={`font-semibold tabular-nums leading-none ${
                          hasColor ? "text-white" : "text-gray-900"
                        }`}
                        style={{ fontSize: "clamp(5rem, 14vw, 17rem)" }}
                      >
                        {team.score || 0}
                      </span>
                    </div>

                    {/* Boulder label */}
                    {/* {team.current_boulder && (
                      <div className="flex justify-center pb-2 shrink-0">
                        <span
                          className={`font-bold uppercase tracking-widest ${
                            hasColor ? "text-white/60" : "text-gray-500"
                          }`}
                          style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.4rem)" }}
                        >
                          Boulder {team.current_boulder}
                        </span>
                      </div>
                    )} */}
                  </div>

                  {/* Player footer */}
                  <div
                    className={`shrink-0 px-5 flex flex-col justify-center ${
                      hasColor
                        ? "border-t-2 border-white/15 bg-black/20"
                        : "border-t-2 border-gray-100 bg-gray-50"
                    }`}
                    style={{ minHeight: "30%" }}
                  >
                    {playerInfo ? (
                      <>
                        <div className="flex flex-col mx-auto items-center gap-5 ">
                          <span
                            className="leading-tight truncate w-full flex items-center justify-center gap-6 text-white mx-auto"
                            style={{ fontSize: "clamp(1.2rem, 2.2vw, 3.2rem)" }}
                          >
                            {playerInfo.name}
                            {playerInfo.jersey && (
                              <span className="inline-flex items-center gap-1  ">
                                {playerInfo.jersey}
                              </span>
                            )}
                          </span>

                          <div className="flex items-center flex-shrink-0 rounded-full overflow-hidden ">
                            <div className="text-md font-medium uppercase tracking-wider tabular-nums px-6 py-2 bg-black text-white flex items-center gap-3">
                              Current
                              <span className="text-3xl">
                                {playerInfo.currentZone}
                              </span>
                            </div>
                            {playerInfo.possibleScore != null &&
                              playerInfo.possibleScore > 0 && (
                                <div className="text-md font-semibold uppercase tracking-wider tabular-nums px-6 py-2 bg-white text-black flex items-center gap-3">
                                  Possible{" "}
                                  <span className="text-3xl ">
                                    +{playerInfo.possibleScore}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span
                        className={`font-semibold text-3xl uppercase tracking-wide  mx-auto ${
                          hasColor ? "text-gray-300" : "text-gray-400"
                        }`}
                        style={{ fontSize: "clamp(0.8rem, 1.2vw, 1.rem)" }}
                      >
                        No active player
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timer bar */}
          <div
            className="flex items-center justify-center bg-white border-t-4 border-gray-200 px-10"
            style={{ height: "16%" }}
          >
            <div
              className="font-bold  text-gray-900 leading-none"
              style={{ fontSize: "clamp(3.5rem, 9vw, 6rem)" }}
            >
              {formatTime(remaining)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
