import { use, useEffect, useState } from "react";
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
  resetBoulderZone,
  setPlayerZone,
  getPlayerBoulders,
} from "@/services";

export default function ScorerPage() {
  useEffect(() => {
    document.title =
      "Score Panel - " + (side === "left" ? "Left Team" : "Right Team");
  }, []);

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

  // Handle boulder change
  const handleBoulderChange = async (boulder) => {
    setSelectedBoulder(boulder);
    await loadPlayerBoulderData(); // Just load the data for the new boulder
  };

  // Handle zone click
  const handleZoneClick = async (teamSide, playerId, zone) => {
    await setPlayerZone(matchId, teamSide, playerId, selectedBoulder, zone);
    await loadPlayerBoulderData();
  };

  // Handle zone reset
  const handleZoneReset = async (teamSide, playerId) => {
    await resetBoulderZone(matchId, teamSide, playerId, selectedBoulder);
    await updateTeamScore(matchId, teamSide);
    await loadPlayerBoulderData();
  };

  if (!state) return <div className="p-6">Loading…</div>;

  const team = state.teams?.[side] || { id: "", name: side, score: 0 };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {/* Left side: Scoring label + Team Selector */}
        <div className="flex gap-5 items-center">
          <div className="leading-tight">
            <h3 className="text-gray-700 text-sm">Scoring for:</h3>
            <h2
              className={`text-xs font-medium rounded  ${
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

        {/* Right side: Finish Match button */}
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
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer "
        >
          <Save size={20} strokeWidth={1.5} /> Save
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
        {/* Boulder Selection */}
        <div className="flex items-center justify-between gap-1 mt-10 px-3">
          <div className="flex gap-2 items-center ">
            <p className="text-lg font-medium mr-3">Boulders: </p>
            {boulders.map((b) => (
              <button
                key={b}
                onClick={() => handleBoulderChange(b)}
                className={`px-4 py-2 rounded-lg text-lg  ${
                  selectedBoulder === b
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <p className="text-lg font-medium">Total Score:</p>{" "}
            <p className="text-6xl font-semibold">{team.score}</p>
          </div>
        </div>
      </div>

      {/* Team & Players */}
      <div className="rounded-xl  p-4 flex flex-col gap-4">
        {/* Team Selector */}

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
            onZoneReset={handleZoneReset} // Add this prop
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
            maxAttempts={30}
          />
        )}
      </div>
    </div>
  );
}
