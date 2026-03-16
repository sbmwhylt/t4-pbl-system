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

import { Save, Plus, Trash2, ArrowLeftRight } from "lucide-react";

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
  setOverlayTeams,
} from "@/services";

export default function MultiTeamScorerPage() {
  const { matchId = "multimatch" } = useParams();

  const [state, setState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedTeamKey, setSelectedTeamKey] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerBoulderData, setPlayerBoulderData] = useState({});
  const [lockedTeams, setLockedTeams] = useState({});
  const [isAnchor, setIsAnchor] = useState(false);
  const [, forceUpdate] = useState(0);

  const toggleLock = (teamKey) =>
    setLockedTeams((prev) => ({ ...prev, [teamKey]: !prev[teamKey] }));

  const updateRound = (delta) => {
    const current = state?.round ?? 1;
    const next = Math.max(1, current + delta);
    set(ref(db, `scoreboard/${matchId}/round`), next);
  };

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
    await setPlayerZone(
      matchId,
      teamKey,
      playerId,
      selectedBoulder,
      zone,
      isAnchor,
    );
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
    const newIndex = existingKeys.length + 1;
    const newTeamKey = `T${newIndex}`;

    await setTeam(matchId, newTeamKey, {
      id: "",
      name: `Team ${newIndex}`,
      score: 0,
      current_boulder: "A",
    });
  };

  // Remove team and renumber remaining teams sequentially
  const handleRemoveTeam = async (teamKey) => {
    const currentTeamsObj = state?.teams || {};
    if (Object.keys(currentTeamsObj).length <= 2) {
      toast.error("Must have at least 2 teams");
      return;
    }

    // Clear selection immediately to avoid render errors during the async renumber
    setSelectedTeamKey(null);
    setSelectedPlayer(null);

    // Sort remaining teams by their current numeric key
    const remainingTeams = Object.entries(currentTeamsObj)
      .filter(([k]) => k !== teamKey)
      .sort((a, b) => {
        const numA = parseInt(a[0].replace("T", "")) || 0;
        const numB = parseInt(b[0].replace("T", "")) || 0;
        return numA - numB;
      });

    // Null out all existing team keys
    for (const k of Object.keys(currentTeamsObj)) {
      await set(ref(db, `scoreboard/${matchId}/teams/${k}`), null);
    }

    // Re-add remaining teams under sequential keys T1, T2, T3...
    for (let i = 0; i < remainingTeams.length; i++) {
      const newKey = `T${i + 1}`;
      const [, teamData] = remainingTeams[i];
      await set(ref(db, `scoreboard/${matchId}/teams/${newKey}`), teamData);
    }

    toast.success("Team removed");
  };

  if (!state) return <div className="p-6">Loading…</div>;

  const currentTeams = Object.entries(state.teams || {});
  const selectedTeam = selectedTeamKey
    ? (state.teams?.[selectedTeamKey] ?? null)
    : null;
  const selectedBoulder = selectedTeam?.current_boulder || "A";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Multi-Team Scorer</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus size={16} /> Add Team
          </button>
          <button
            onClick={async () => {
              try {
                const savedMatchId = await finishMatchMultiTeam(matchId);
                toast.success(`Match ${savedMatchId} saved!`);
              } catch (err) {
                toast.error(`Error: ${err.message}`);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save size={16} /> Save Match
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
          hideMeta
          hidePeriod
        />

        {/* Round Controls */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => updateRound(-1)}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg font-bold transition-colors flex items-center justify-center"
          >
            −
          </button>
          <span className="text-base font-semibold text-gray-700 w-24 text-center">
            Round {state.round ?? 1}
          </span>
          <button
            onClick={() => updateRound(1)}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg font-bold transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
        {currentTeams.map(([teamKey, team]) => {
          const isSelected = selectedTeamKey === teamKey;
          const isLocked = !!lockedTeams[teamKey];
          return (
            <div
              key={teamKey}
              onClick={() => {
                setSelectedTeamKey(teamKey);
                setSelectedPlayer(null);
              }}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-purple-300 shadow-md bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {/* Card header row */}
              <div className="flex items-center justify-between mb-2 gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-purple-600 text-white text-sm font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                    {teamKey}
                  </span>
                  <span className="font-semibold text-base truncate text-gray-800">
                    {team.name || teamKey}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) handleRemoveTeam(teamKey);
                  }}
                  disabled={isLocked}
                  className={`flex-shrink-0 transition-colors ${
                    isLocked
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-400 hover:text-red-600"
                  }`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Team dropdown + lock */}
              <TeamSelector
                value={team}
                teams={teams}
                onChange={(t) => setTeam(matchId, teamKey, t)}
                locked={isLocked}
                onLockToggle={() => toggleLock(teamKey)}
              />

              {/* Score */}
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">
                  Score
                </span>
                <span className="text-4xl font-bold text-gray-800">
                  {team.score || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlay Control */}
      <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            Overlay Display
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              !!(state.overlay?.left && state.overlay?.right)
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {!!(state.overlay?.left && state.overlay?.right)
              ? "Active"
              : "Not set"}
          </span>
        </div>
        <div className="flex items-center gap-10">
          <select
            value={state.overlay?.left ?? ""}
            onChange={(e) =>
              setOverlayTeams(
                matchId,
                e.target.value || null,
                state.overlay?.right ?? null,
              )
            }
            className="flex-1 border border-gray-300 rounded px-2 py-2 text-md"
          >
            <option value="">Left team</option>
            {currentTeams.map(([key, t]) => (
              <option key={key} value={key}>
                {key}: {t.name || key}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              setOverlayTeams(
                matchId,
                state.overlay?.right ?? null,
                state.overlay?.left ?? null,
              )
            }
            disabled={!(state.overlay?.left && state.overlay?.right)}
            title="Swap"
            className=" text-gray-400 hover:text-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-full cursor-pointer"
          >
            <ArrowLeftRight size={24} />
          </button>
          <select
            value={state.overlay?.right ?? ""}
            onChange={(e) =>
              setOverlayTeams(
                matchId,
                state.overlay?.left ?? null,
                e.target.value || null,
              )
            }
            className="flex-1 border border-gray-300 rounded px-2 py-2 text-md"
          >
            <option value="">Right team</option>
            {currentTeams.map(([key, t]) => (
              <option key={key} value={key}>
                {key}: {t.name || key}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Team Control Panel */}
      {selectedTeamKey && selectedTeam && (
        <div className="mt-6 border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-white">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            Controlling:{" "}
            <span className="text-gray-500">
              {selectedTeam.name || selectedTeamKey}
            </span>
          </h3>

          {/* Boulder Selection + Anchor Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-600 mr-1">
                Boulder:
              </p>
              {boulders.map((b) => (
                <button
                  key={b}
                  onClick={() => handleBoulderChange(b)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedBoulder === b
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
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
                isAnchor={isAnchor}
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
