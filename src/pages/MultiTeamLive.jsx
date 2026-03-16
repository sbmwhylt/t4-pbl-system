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

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveBadge({ running }) {
  return (
    <div
      className={`flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-[0.58rem] font-extrabold tracking-[0.15em] uppercase border ${
        running
          ? "bg-green-500/20 text-green-300 border-green-500/30"
          : "bg-white/10 text-white/40 border-white/15"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          running ? "bg-green-400 animate-pulse" : "bg-white/30"
        }`}
      />
      {running ? "LIVE" : "PAUSED"}
    </div>
  );
}

function TimerNotch({ round, remaining, isLow }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full z-10 flex items-center justify-center gap-0 py-2 px-8 rounded-sm bg-black/60 mb-2">
      <span className="text-3xl font-extrabold uppercase text-white leading-none pr-4">
        Round {round}
      </span>

      {/* Vertical red separator */}
      <div className="h-7 w-0.5 bg-red-600 opacity-70 shrink-0" />

      <span
        className={`text-3xl font-semibold tabular-nums leading-none tracking-wider transition-colors pl-4 ${
          isLow ? "text-red-400" : "text-white"
        }`}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}

function TeamBadge({ label, logoUrl }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={label}
        className="w-20 h-20 object-contain rounded-md shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-blue-100 text-gray-900 text-sm font-black tracking-wide">
      {label.slice(0, 3).toUpperCase()}
    </div>
  );
}

function PlayerRow({ playerInfo }) {
  if (!playerInfo) {
    return <span className="text-3xl text-white/30 leading-none">—</span>;
  }
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-medium text-white leading-none truncate">
        {playerInfo.name}
      </span>
      {playerInfo.jersey && (
        <span className="text-base font-semibold text-white/60 leading-none shrink-0">
          #{playerInfo.jersey}
        </span>
      )}
    </div>
  );
}

function TeamCard({ team, index }) {
  const label = (team.abbreviation || team.name || team.key).slice(0, 12);

  const playerInfo = (() => {
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
  })();

  return (
    <div
      className={`flex flex-col flex-1 min-w-[160px] overflow-hidden${
        index !== 0 ? " border-l border-white/10" : ""
      }`}
    >
      {/* Card body */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-1 justify-around">
        <TeamBadge label={label} logoUrl={team.logo_url} />

        {/* Name + player */}
        <div className="flex items-center gap-2">
          <div className="bg-black/65 px-3 py-2 rounded-sm">
            <PlayerRow playerInfo={playerInfo} />
          </div>
          {playerInfo && (
            <div className="self-start text-2xl font-bold uppercase tracking-wide px-2 py-1 rounded bg-blue-100 text-gray-900">
              {playerInfo.currentZone}
            </div>
          )}
        </div>

        {/* Score */}
        <span className="text-7xl font-bold tabular-nums leading-none tracking-tight text-white shrink-0">
          {team.score ?? 0}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MultiTeamLive() {
  useEffect(() => {
    document.title = "Multi-Team Live ScoreView";
  }, []);

  const { matchId = "multimatch" } = useParams();

  const [state, setState] = useState({
    teams: {},
    timer: { remaining: DEFAULT_DURATION, running: false },
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
    const id = setInterval(() => forceUpdate((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [state.timer?.running]);

  const timer = state.timer || { remaining: DEFAULT_DURATION, running: false };
  const round = state.round ?? 1;

  const remaining =
    timer.running && timer.endTime
      ? Math.max(
          0,
          Math.floor((timer.endTime - timerService.serverNow()) / 1000),
        )
      : (timer.remaining ?? timer.duration ?? DEFAULT_DURATION);

  const allTeams = Object.entries(state.teams || {}).map(([key, team]) => {
    const meta = teamsData[team.id] || {};
    return {
      key,
      ...team,
      logo_url: meta.logo_url || "",
      abbreviation: meta.abbreviation || "",
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
  const isLow = remaining <= 30 && timer.running;

  return (
    <div className="pointer-events-none">
      {/* Waiting state */}
      {noTeamsSelected && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-5">
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

      {/* Scoreboard bar */}
      {!noTeamsSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-1 flex items-center justify-center">
          <div className="relative w-full mb-3">
            <TimerNotch round={round} remaining={remaining} isLow={isLow} />
            <div className="flex items-stretch overflow-hidden rounded bg-[#5f8bbb]/80 backdrop-blur-md text-white">
              <div className="flex flex-1 overflow-x-auto">
                {teams.map((team, i) => (
                  <TeamCard key={team.key} team={team} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
