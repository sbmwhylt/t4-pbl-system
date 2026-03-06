import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { onValue, ref, set } from "firebase/database";
import { db } from "@/firebase";
import { toast } from "react-hot-toast";

import Header from "@/components/ui/panel/Header";
import TeamSelector from "@/components/ui/panel/TeamSelector";
import PlayerButtons from "@/components/ui/panel/PlayersButtons";
import TimerControls from "@/components/ui/panel/TimerControls";
import ZoneSelection from "@/components/ui/panel/ZoneSelection";
import AttemptButtons from "@/components/ui/panel/AttemptButtons";

import { Save, Plus, Trash2 } from "lucide-react";

import {
  subscribeScoreboard,
  subscribeTeams,
  subscribePlayers,
  setTeam,
  finishMatchMultiTeam,
  updatePeriod,
  boulders,
  initPlayerBoulders,
  resetBoulderZone,
  setPlayerZone,
  getPlayerBoulders,
  timerService,
  setCurrentBoulder,
  initMatchMultiTeam,
} from "@/services";

const TEAM_COLORS = [
  "border-red-500",
  "border-blue-500",
  "border-green-500",
  "border-yellow-500",
  "border-purple-500",
  "border-pink-500",
];

export default function MultiTeamScorerPage() {
  const { matchId = "multimatch" } = useParams();

  const [state, setState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedTeamKey, setSelectedTeamKey] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerBoulderData, setPlayerBoulderData] = useState({});
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    document.title = "Multi-Team Scorer Panel";
  }, []);

  // Subscriptions
  useEffect(() => subscribeScoreboard(matchId, setState), [matchId]);
  useEffect(() => subscribeTeams(setTeams), []);
  useEffect(() => subscribePlayers(setAllPlayers), []);

  // Initialize scoreboard if missing
  useEffect(() => {
    const unsub = onValue(ref(db, `scoreboard/${matchId}`), (snap) => {
      if (!snap.exists()) initMatchMultiTeam(matchId);
    });
    return () => unsub();
  }, [matchId]);

  // Force update when timer is running
  useEffect(() => {
    if (!state?.timer?.running) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [state?.timer?.running]);

  // Initialize boulders for all players
  useEffect(() => {
    async function initBoulders() {
      if (!state) return;
      const allTeams = state?.teams || {};
      for (let teamKey in allTeams) {
        const teamPlayers = allTeams[teamKey]?.players || {};
        for (let playerId in teamPlayers) {
          await initPlayerBoulders(matchId, teamKey, playerId);
        }
      }
      await loadPlayerBoulderData();
    }
    initBoulders();
  }, [state]);

  // Load player boulder data
  const loadPlayerBoulderData = async () => {
    const data = {};
    const allTeams = state?.teams || {};
    for (let teamKey in allTeams) {
      data[teamKey] = {};
      const teamPlayers = allTeams[teamKey]?.players || {};
      for (let playerId in teamPlayers) {
        data[teamKey][playerId] = await getPlayerBoulders(
          matchId,
          teamKey,
          playerId,
        );
      }
    }
    setPlayerBoulderData(data);
  };

  // Handle boulder change
  const handleBoulderChange = async (boulder) => {
    if (!selectedTeamKey) return;
    await setCurrentBoulder(matchId, selectedTeamKey, boulder);
    await loadPlayerBoulderData();
  };

  // Handle zone click
  const handleZoneClick = async (teamKey, playerId, zone) => {
    const selectedBoulder = state?.teams?.[teamKey]?.current_boulder || "A";
    await setPlayerZone(matchId, teamKey, playerId, selectedBoulder, zone);
    await loadPlayerBoulderData();
  };

  // Handle zone reset
  const handleZoneReset = async (teamKey, playerId) => {
    const selectedBoulder = state?.teams?.[teamKey]?.current_boulder || "A";
    await resetBoulderZone(matchId, teamKey, playerId, selectedBoulder);
    await loadPlayerBoulderData();
  };

  // Handle player selection
  const handlePlayerSelect = async (player) => {
    if (!selectedTeamKey) return;

    // Toggle selection
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null);
      const currentTeam = state?.teams?.[selectedTeamKey] || {};
      await setTeam(matchId, selectedTeamKey, {
        current_player: null,
        jersey: null,
        current_boulder: currentTeam.current_boulder || "A",
      });
      return;
    }

    setSelectedPlayer(player);
    const currentTeam = state?.teams?.[selectedTeamKey] || {};
    await setTeam(matchId, selectedTeamKey, {
      current_player: player.name,
      jersey: player.jersey_number,
      current_boulder: currentTeam.current_boulder || "A",
    });
  };

  // Timer handlers
  const handleStartTimer = async () => {
    await timerService.startTimer(
      matchId,
      state?.timer?.duration,
      selectedTeamKey || "panel",
    );
  };

  const handlePauseTimer = async () => {
    await timerService.pauseTimer(matchId, selectedTeamKey || "panel");
  };

  const handleResumeTimer = async () => {
    await timerService.resumeTimer(matchId, selectedTeamKey || "panel");
  };

  const handleResetTimer = async () => {
    await timerService.resetTimer(
      matchId,
      state?.timer?.duration,
      selectedTeamKey || "panel",
    );
  };

  // Add new team slot
  const handleAddTeam = async () => {
    const existingKeys = Object.keys(state?.teams || {});
    const maxN = existingKeys
      .map((k) => parseInt(k.replace("T", "")) || 0)
      .reduce((a, b) => Math.max(a, b), 0);
    const newTeamKey = `T${maxN + 1}`;

    await setTeam(matchId, newTeamKey, {
      id: "",
      name: `Team ${maxN + 1}`,
      score: 0,
      current_boulder: "A",
    });
  };

  // Remove team
  const handleRemoveTeam = async (teamKey) => {
    if (Object.keys(state?.teams || {}).length <= 2) {
      toast.error("Must have at least 2 teams");
      return;
    }

    // Remove team by setting to null
    const dbRef = ref(db, `scoreboard/${matchId}/teams/${teamKey}`);
    await set(dbRef, null);

    if (selectedTeamKey === teamKey) {
      setSelectedTeamKey(null);
      setSelectedPlayer(null);
    }

    toast.success("Team removed");
  };

  if (!state) return <div className="p-6">Loading…</div>;

  const currentTeams = Object.entries(state.teams || {});
  const selectedTeam = selectedTeamKey ? state.teams[selectedTeamKey] : null;
  const selectedBoulder = selectedTeam?.current_boulder || "A";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Multi-Team Scorer</h2>

        <div className="flex gap-2">
          <button
            onClick={handleAddTeam}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            <Plus size={20} /> Add Team
          </button>

          <button
            onClick={async () => {
              try {
                const savedMatchId = await finishMatchMultiTeam();
                toast.success(`Match ${savedMatchId} saved!`);
              } catch (err) {
                toast.error(`Error: ${err.message}`);
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Save size={20} /> Save Match
          </button>
        </div>
      </div>

      <Header matchId={matchId} />

      {/* Timer Controls */}
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
          panelSide={selectedTeamKey || "panel"}
        />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {currentTeams.map(([teamKey, team], index) => (
          <div
            key={teamKey}
            className={`border-4 rounded-lg p-4 cursor-pointer transition-all ${
              selectedTeamKey === teamKey
                ? `${TEAM_COLORS[index % TEAM_COLORS.length]} bg-gray-100`
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => {
              setSelectedTeamKey(teamKey);
              setSelectedPlayer(null);
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{team.name || teamKey}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTeam(teamKey);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <TeamSelector
              value={team}
              teams={teams}
              onChange={(t) => setTeam(matchId, teamKey, t)}
              onClick={(e) => e.stopPropagation()}
            />

            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-4xl font-bold">{team.score || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Team Control Panel */}
      {selectedTeamKey && selectedTeam && (
        <div className="mt-8 border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">
            Controlling: {selectedTeam.name || selectedTeamKey}
          </h3>

          {/* Boulder Selection */}
          <div className="flex items-center justify-between gap-1 mb-6">
            <div className="flex gap-2 items-center">
              <p className="text-lg font-medium mr-3">Boulders:</p>
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
          </div>

          {/* Players */}
          <PlayerButtons
            players={
              selectedTeam?.id
                ? allPlayers.filter(
                    (p) =>
                      p.team_id === selectedTeam.id && p.status === "active",
                  )
                : []
            }
            activePlayerId={selectedPlayer?.id}
            onSelect={handlePlayerSelect}
            teamColor="blue"
          />

          {/* Zone Selection */}
          {selectedTeam?.id && selectedPlayer?.id && (
            <div className="mt-4">
              <ZoneSelection
                playerId={selectedPlayer.id}
                teamSide={selectedTeamKey}
                selectedBoulder={selectedBoulder}
                playerBoulderData={playerBoulderData}
                onZoneClick={handleZoneClick}
                onZoneReset={handleZoneReset}
              />
            </div>
          )}

          {/* Attempts */}
          {selectedTeam?.id && selectedPlayer?.id && (
            <div className="mt-4">
              <AttemptButtons
                matchId={matchId}
                side={selectedTeamKey}
                playerId={selectedPlayer.id}
                selectedBoulder={selectedBoulder}
                playerBoulderData={playerBoulderData}
                maxAttempts={30}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
