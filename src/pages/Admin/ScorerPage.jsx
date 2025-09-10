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

import { CircleArrowLeft, Save } from "lucide-react";

// Services
import {
  subscribeScoreboard,
  subscribeTeams,
  subscribePlayers,
  setTeam,
  finishMatch,
  startTimer,
  pauseTimer,
  resetTimer,
  updatePeriod,
  boulders,
  initPlayerBoulders,
  resetBoulder,
  setPlayerZone,
  getPlayerBoulders,
} from "@/services";

export default function ScorerPage() {
  const { matchId = "demo", side = "left" } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedBoulder, setSelectedBoulder] = useState("A");
  const [playerBoulderData, setPlayerBoulderData] = useState({});

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

  const handleBoulderChange = async (boulder) => {
    setSelectedBoulder(boulder);
    for (let teamSide of ["left", "right"]) {
      const teamPlayers = state?.teams?.[teamSide]?.players || {};
      for (let playerId in teamPlayers) {
        await resetBoulder(matchId, teamSide, playerId, boulder);
      }
    }
    await loadPlayerBoulderData();
  };

  const handleZoneClick = async (teamSide, playerId, zone) => {
    await setPlayerZone(matchId, teamSide, playerId, selectedBoulder, zone);
    await loadPlayerBoulderData();
  };

  if (!state) return <div className="p-6">Loading…</div>;

  const team = state.teams?.[side] || { id: "", name: side, score: 0 };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`font-semibold text-center text-2xl ${
            side === "left" ? "text-red-500" : "text-blue-500"
          }`}
        >
          <span className="text-gray-500">Scoring for: </span>
          {team.name} ({side === "left" ? "Left" : "Right"})
        </h2>

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
          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 flex gap-2 items-center transition-colors"
        >
          <Save size={18} /> Finish Match
        </button>
      </div>

      <Header matchId={matchId} />

      {/* Timer */}
      <div className="mt-6">
        <TimerControls
          timer={state.timer}
          period={state.period}
          onStart={() => startTimer(matchId)}
          onPause={() => pauseTimer(matchId)}
          onReset={() => resetTimer(matchId)}
          onPeriodChange={(p) => updatePeriod(matchId, p)}
        />
      </div>

      {/* Boulder Selection */}
      <div className="flex gap-2 mt-6 mb-4">
        {boulders.map((b) => (
          <button
            key={b}
            onClick={() => handleBoulderChange(b)}
            className={`px-3 py-1 rounded-md ${
              selectedBoulder === b
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            Boulder {b}
          </button>
        ))}
      </div>

      {/* Team & Players */}
      <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex flex-col gap-4">
        {/* Team Selector */}
        <div className="flex items-center justify-between mb-3">
          <TeamSelector
            value={team}
            teams={teams}
            onChange={(t) => setTeam(matchId, side, t)}
          />
          <div className="text-3xl font-semibold">{team.score}</div>
        </div>

        {/* Player List */}
        <h3 className="text-lg font-semibold text-center">
          {side === "left" ? "Team 1 Players" : "Team 2 Players"}
        </h3>

        <PlayerButtons
          players={
            team?.id
              ? allPlayers
                  .filter((p) => p.team_id === team.id && p.status === "active")
                  .slice(0, 5)
              : []
          }
          activePlayerId={selectedPlayer?.id}
          onSelect={async (player) => {
            setSelectedPlayer(player);

            // Update the team-level current player
            await setTeam(matchId, side, {
              current_player: player.name,
              jersey: player.jersey_number,
            });
          }}
          teamColor={side === "left" ? "blue" : "red"}
        />

        {/* Zone Selection for selected player */}
        {team?.id && selectedPlayer?.id && (
          <ZoneSelection
            playerId={selectedPlayer.id}
            teamSide={side}
            selectedBoulder={selectedBoulder}
            playerBoulderData={playerBoulderData}
            onZoneClick={handleZoneClick}
          />
        )}

        {/* Attempt Buttons - only show if a player is selected */}
        {team?.id && selectedPlayer?.id && (
          <AttemptButtons
            matchId={matchId}
            side={side}
            playerId={selectedPlayer.id}
            selectedBoulder={selectedBoulder}
            playerBoulderData={playerBoulderData}
            maxAttempts={20}
          />
        )}
      </div>
    </div>
  );
}
