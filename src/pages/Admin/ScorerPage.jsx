import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { db } from "@/firebase";
import { toast } from "react-hot-toast";

import Header from "@/components/ui/panel/Header";
import TeamSelector from "@/components/ui/panel/TeamSelector";
import PlayerButtons from "@/components/ui/panel/PlayersButtons";
import TimerControls from "@/components/ui/panel/TimerControls";
import ZoneSelection from "@/components/ui/panel/ZoneSelection";
import AttemptButtons from "@/components/ui/panel/AttemptButtons";

import { Save } from "lucide-react";

// Import specific functions instead of using star exports
import {
  subscribeScoreboard,
  subscribeTeams,
  subscribePlayers,
  setTeam,
  finishMatch,
  updatePeriod,
  boulders,
  initPlayerBoulders,
  resetBoulderZone,
  setPlayerZone,
  getPlayerBoulders,
  timerService,
  setCurrentBoulder,
  initMatch,
  getPossibleScore,
} from "@/services";

export default function ScorerPage() {
  const { matchId = "singlematch", side = "left" } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerBoulderData, setPlayerBoulderData] = useState({});
  const [isAnchor, setIsAnchor] = useState(false);
  const [, forceUpdate] = useState(0); // 👈 Just to force re-renders

  useEffect(() => {
    document.title =
      "Score Panel - " + (side === "left" ? "Left Team" : "Right Team");
  }, [side]);

  // Subscriptions
  useEffect(() => subscribeScoreboard(matchId, setState), [matchId]);
  useEffect(() => subscribeTeams(setTeams), []);
  useEffect(() => subscribePlayers(setAllPlayers), []);

  // Initialize scoreboard if missing
  useEffect(() => {
    const unsub = onValue(ref(db, `scoreboard/${matchId}`), (snap) => {
      if (!snap.exists()) initMatch(matchId);
    });
    return () => unsub();
  }, [matchId]);

  // 👇 SIMPLIFIED: Just force update every 100ms when running
  useEffect(() => {
    if (!state?.timer?.running) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(id);
  }, [state?.timer?.running]);

  // Initialize boulders for all active players
  useEffect(() => {
    async function initBoulders() {
      if (!state) return;
      for (let teamSide of ["left", "right"]) {
        const teamPlayers = state?.teams?.[teamSide]?.players || {};
        for (let playerId in teamPlayers) {
          await initPlayerBoulders(matchId, teamSide, playerId);
        }
      }
      await loadPlayerBoulderData();
    }
    initBoulders();
  }, [state]);

  // Load player boulder data
  const loadPlayerBoulderData = async () => {
    const data = { left: {}, right: {} };
    for (let teamSide of ["left", "right"]) {
      const teamPlayers = state?.teams?.[teamSide]?.players || {};
      for (let playerId in teamPlayers) {
        data[teamSide][playerId] = await getPlayerBoulders(
          matchId,
          teamSide,
          playerId
        );
      }
    }
    setPlayerBoulderData(data);
  };

  // Handle boulder change - persists for the team
  const handleBoulderChange = async (boulder) => {
    await setCurrentBoulder(matchId, side, boulder);
    await loadPlayerBoulderData();
  };

  // Handle zone click
  const handleZoneClick = async (teamSide, playerId, zone) => {
    const selectedBoulder = state?.teams?.[teamSide]?.current_boulder || "A";
    await setPlayerZone(matchId, teamSide, playerId, selectedBoulder, zone, isAnchor);
    await loadPlayerBoulderData();
  };

  // Handle zone reset
  const handleZoneReset = async (teamSide, playerId) => {
    const selectedBoulder = state?.teams?.[teamSide]?.current_boulder || "A";
    await resetBoulderZone(matchId, teamSide, playerId, selectedBoulder);
    await loadPlayerBoulderData();
  };

  // Handle player selection - allows unselecting and preserves current boulder
  const handlePlayerSelect = async (player) => {
    // If the same player is clicked again, unselect
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null);

      const currentTeam = state?.teams?.[side] || {};
      await setTeam(matchId, side, {
        current_player: null,
        jersey: null,
        current_boulder: currentTeam.current_boulder || "A",
      });

      return;
    }

    // Otherwise, select the new player
    setSelectedPlayer(player);

    const currentTeam = state?.teams?.[side] || {};
    await setTeam(matchId, side, {
      current_player: player.name,
      jersey: player.jersey_number,
      current_boulder: currentTeam.current_boulder || "A",
    });
  };

  // Timer control handlers
  const handleStartTimer = async () => {
    await timerService.startTimer(matchId, state?.timer?.duration, side);
  };

  const handlePauseTimer = async () => {
    await timerService.pauseTimer(matchId, side);
  };

  const handleResumeTimer = async () => {
    await timerService.resumeTimer(matchId, side);
  };

  const handleResetTimer = async () => {
    await timerService.resetTimer(matchId, state?.timer?.duration, side);
  };

  if (!state) return <div className="p-6">Loading…</div>;

  const team = state.teams?.[side] || { id: "", name: side, score: 0 };
  const selectedBoulder = team.current_boulder || "A";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-5 items-center">
          <div className="leading-tight">
            <h3 className="text-gray-700 text-sm">Scoring for:</h3>
            <h2
              className={`text-xs font-medium rounded ${
                side === "left" ? "text-red-500" : "text-blue-500"
              }`}
            >
              {side === "left" ? "Left Side" : "Right Side"}
            </h2>
          </div>

          <TeamSelector
            value={team}
            teams={teams}
            onChange={(t) => setTeam(matchId, side, t)}
          />
        </div>

        <button
          onClick={async () => {
            try {
              const savedMatchId = await finishMatch();
              toast.success(`Match ${savedMatchId} saved successfully!`);
            } catch (err) {
              console.error(err);
              toast.error(`Error: ${err.message}`);
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
        >
          <Save size={20} strokeWidth={1.5} /> Save
        </button>
      </div>

      <Header matchId={matchId} />

      {/* Timer */}
      <div className="mt-6">
        <TimerControls
          matchId={matchId}
          timer={state.timer}
          period={state.period}
          onStart={handleStartTimer}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
          onReset={handleResetTimer}
          onPeriodChange={(p) => updatePeriod(matchId, p)}
          panelSide={side}
        />

        {/* Boulder Selection */}
        <div className="flex items-center justify-between gap-1 mt-10 px-3">
          <div className="flex gap-2 items-center">
            <p className="text-lg font-medium mr-3">Boulders: </p>
            {boulders.map((b) => (
              <button
                key={b}
                onClick={() => handleBoulderChange(b)}
                className={`px-4 py-2 rounded-lg text-lg ${
                  selectedBoulder === b
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAnchor((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                isAnchor
                  ? "bg-amber-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              Anchor {isAnchor ? "ON" : "OFF"}
            </button>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">Total Score:</p>
              <p className="text-6xl font-semibold">{team.score}</p>
              {(() => {
                if (!selectedPlayer?.id) return null;
                const bd = playerBoulderData?.[side]?.[selectedPlayer.id]?.[selectedBoulder];
                const ps = bd ? getPossibleScore(bd.attempts || 0, bd.points || 0) : null;
                if (ps == null || ps <= 0) return null;
                return (
                  <span className="text-2xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    +{ps}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Team & Players */}
      <div className="rounded-xl p-4 flex flex-col gap-4">
        <PlayerButtons
          players={
            team?.id
              ? allPlayers.filter(
                  (p) => p.team_id === team.id && p.status === "active"
                )
              : []
          }
          activePlayerId={selectedPlayer?.id}
          onSelect={handlePlayerSelect}
          teamColor={side === "left" ? "blue" : "red"}
        />

        {/* Zone Selection */}
        {team?.id && selectedPlayer?.id && (
          <ZoneSelection
            playerId={selectedPlayer.id}
            teamSide={side}
            selectedBoulder={selectedBoulder}
            playerBoulderData={playerBoulderData}
            onZoneClick={handleZoneClick}
            onZoneReset={handleZoneReset}
            isAnchor={isAnchor}
          />
        )}

        {/* Attempts */}
        {team?.id && selectedPlayer?.id && (
          <AttemptButtons
            matchId={matchId}
            side={side}
            playerId={selectedPlayer.id}
            selectedBoulder={selectedBoulder}
            playerBoulderData={playerBoulderData}
            maxAttempts={30}
          />
        )}
      </div>
    </div>
  );
}