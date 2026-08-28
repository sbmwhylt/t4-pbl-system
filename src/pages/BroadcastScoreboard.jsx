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
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const BLANK_TEAM = {
  id: "",
  name: "",
  abbreviation: "",
  logo_url: "",
  score: 0,
};
const BLANK_TIMER = { remaining: DEFAULT_DURATION, running: false };

// ------------------------------------------------------------------ sub-views
// One continuous bar. Everything sizes off viewport width via clamp() so the
// overlay scales cleanly from a small preview window up to a broadcast canvas.

function TeamBlock({ side, team, meta }) {
  const isRight = side === "right";
  const logo = meta?.logo_url || team.logo_url;
  const label = meta?.abbreviation || team.abbreviation || team.name || "TEAM";

  const climber = team.current_player;
  const zone = team.current_zone;
  const hasZone = zone && zone !== "—" && zone !== "-";
  const hasPossible = team.possibleScore != null && team.possibleScore > 0;

  return (
    <div
      className={`flex-1 min-w-0 flex items-center justify-between ${
        isRight ? "flex-row-reverse" : ""
      }`}
      style={{
        gap: "clamp(0.5rem, 1.5vw, 1.25rem)",
        padding: "0 clamp(0.75rem, 2vw, 1.75rem)",
      }}
    >
      {/* Logo + team name (with the active climber as a sub-line) */}
      <div
        className={`flex items-center min-w-0 ${isRight ? "flex-row-reverse" : ""}`}
        style={{ gap: "clamp(0.4rem, 1vw, 0.9rem)" }}
      >
        {logo && (
          <img
            src={logo}
            alt={label}
            className="shrink-0 object-contain"
            style={{
              width: "clamp(2.25rem, 4vw, 3.75rem)",
              height: "clamp(2.25rem, 4vw, 3.75rem)",
            }}
          />
        )}

        <div
          className={`min-w-0 flex flex-col justify-center ${
            isRight ? "items-end" : "items-start"
          }`}
        >
          <span
            className="min-w-0 max-w-full truncate font-semibold uppercase tracking-wide leading-tight"
            style={{ fontSize: "clamp(0.9rem, 1.7vw, 1.6rem)" }}
          >
            {label}
          </span>

          {climber && (
            <span
              className={`min-w-0 max-w-full flex items-center font-medium text-white/80 leading-tight ${
                isRight ? "flex-row-reverse" : ""
              }`}
              style={{ fontSize: "clamp(0.8rem, 1.45vw, 1.3rem)", gap: "0.4rem" }}
            >
              {team.boulder && (
                <span
                  className="shrink-0 rounded-full bg-black/60 border border-white/25 font-bold leading-none flex items-center justify-center"
                  style={{
                    width: "clamp(1rem, 1.7vw, 1.5rem)",
                    height: "clamp(1rem, 1.7vw, 1.5rem)",
                    fontSize: "clamp(0.5rem, 0.9vw, 0.8rem)",
                  }}
                >
                  {team.boulder}
                </span>
              )}
              <span className="truncate">
                {climber}
                {team.jersey ? `  ${team.jersey}` : ""}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Zone / possible chip + score */}
      <div
        className={`shrink-0 flex items-center ${isRight ? "flex-row-reverse" : ""}`}
        style={{ gap: "clamp(0.4rem, 1vw, 0.8rem)" }}
      >
        {(hasZone || hasPossible) && (
          <div
            className={`flex flex-col leading-none ${
              isRight ? "items-start" : "items-end"
            }`}
            style={{ gap: "0.15rem" }}
          >
            {hasZone && (
              <span
                className="font-bold tabular-nums"
                style={{ fontSize: "clamp(0.7rem, 1.3vw, 1.15rem)" }}
              >
                <span
                  className="text-white/55 font-semibold"
                  style={{ fontSize: "0.7em" }}
                >
                  ZONE{" "}
                </span>
                {zone}
              </span>
            )}
            {hasPossible && (
              <span
                className="rounded bg-black/60 font-semibold tabular-nums"
                style={{
                  fontSize: "clamp(0.6rem, 1.1vw, 0.95rem)",
                  padding: "0.05rem 0.35rem",
                }}
              >
                +{team.possibleScore}
              </span>
            )}
          </div>
        )}

        <span
          className="font-bold tabular-nums leading-none"
          style={{ fontSize: "clamp(1.9rem, 4.6vw, 4rem)" }}
        >
          {team.score || 0}
        </span>
      </div>
    </div>
  );
}

function ClockBlock({ period, half, time, running }) {
  return (
    <div
      className="shrink-0 self-stretch flex flex-col items-center justify-center bg-black/45"
      style={{
        minWidth: "clamp(4.75rem, 9vw, 7.5rem)",
        padding: "clamp(0.35rem, 1vh, 0.85rem) clamp(0.6rem, 1.6vw, 1.4rem)",
      }}
    >
      <div
        className="font-semibold uppercase leading-none tracking-wide"
        style={{ fontSize: "clamp(0.7rem, 1.15vw, 1.05rem)" }}
      >
        {period}
      </div>
      {half && (
        <div
          className="font-medium uppercase tracking-wider text-white/55 leading-none"
          style={{ fontSize: "clamp(0.5rem, 0.72vw, 0.7rem)", marginTop: "0.15rem" }}
        >
          {half}
        </div>
      )}
      <div
        className="border-t-2 border-red-500/70"
        style={{ width: "72%", margin: "clamp(0.2rem, 0.6vh, 0.4rem) 0" }}
      />
      <div
        className={`font-bold tabular-nums tracking-wider leading-none ${
          running ? "" : "text-white/80"
        }`}
        style={{ fontSize: "clamp(1.15rem, 2.5vw, 2.4rem)" }}
      >
        {time}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ page

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

  // Current climber's boulder + zone for a team
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

  const leftMeta = teamsData[leftScoreboard.id];
  const rightMeta = teamsData[rightScoreboard.id];

  const period = state.period || "1ST";
  // Rounds 1–2 (1ST/2ND) are the first half, 3–4 (3RD/4TH) the second half
  const periodIndex = PERIODS.indexOf(period);
  const half =
    periodIndex === -1 ? null : periodIndex < 2 ? "1ST HALF" : "2ND HALF";

  // Shared, server-synced countdown — identical on every screen
  const remaining = useSyncedCountdown(state.timer || BLANK_TIMER, matchId);

  const noTeamsSelected = !leftScoreboard.id || !rightScoreboard.id;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {noTeamsSelected ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
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
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-stretch bg-[#5f8bbb]/85 backdrop-blur-md rounded-lg overflow-hidden text-white shadow-2xl"
          style={{
            bottom: "clamp(0.75rem, 3.5vh, 3rem)",
            width: "min(92vw, 1100px)",
          }}
        >
          <TeamBlock side="left" team={leftScoreboard} meta={leftMeta} />
          <ClockBlock
            period={period}
            half={half}
            time={formatTime(remaining)}
            running={!!state.timer?.running}
          />
          <TeamBlock side="right" team={rightScoreboard} meta={rightMeta} />
        </div>
      )}
    </div>
  );
}
