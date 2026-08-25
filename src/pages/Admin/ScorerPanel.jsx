import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { onValue, ref, set, update } from "firebase/database";
import { db } from "@/firebase";
import { toast } from "react-hot-toast";

import Header from "@/components/ui/panel/Header";
import TeamSelector from "@/components/ui/panel/TeamSelector";
import PlayerButtons from "@/components/ui/panel/PlayersButtons";
import TimerControls from "@/components/ui/panel/TimerControls";
import ZoneSelection from "@/components/ui/panel/ZoneSelection";
import AttemptButtons from "@/components/ui/panel/AttemptButtons";

import { Save, Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { getGradientById } from "@/constants/teamColors";

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
  getPossibleScore,
  PERIODS,
} from "@/services";

export default function ScorerPanel() {
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const toggleLock = (teamKey) =>
    setLockedTeams((prev) => ({ ...prev, [teamKey]: !prev[teamKey] }));

  // "Round" steps through the same PERIODS used for the game clock's period
  // label, so it's what actually shows up as the period on the scoreboards.
  const currentPeriodIndex = Math.max(0, PERIODS.indexOf(state?.period));
  const updateRound = (delta) => {
    const nextIndex = Math.min(
      PERIODS.length - 1,
      Math.max(0, currentPeriodIndex + delta),
    );
    updatePeriod(matchId, PERIODS[nextIndex]);
  };

  useEffect(() => {
    document.title = "Scorer Panel";
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

    // Ensure the player exists in the scoreboard roster (handles transfers & renames)
    const teamPlayers = currentTeam.players || {};
    const existing = teamPlayers[player.id];

    const displayName = player.last_name || player.name;
    const fullName = player.first_name
      ? `${player.first_name} ${player.last_name || ""}`.trim()
      : (player.last_name || player.name);

    if (!existing) {
      // Player was transferred after the team was loaded — add them
      await set(
        ref(db, `scoreboard/${matchId}/teams/${selectedTeamKey}/players/${player.id}`),
        {
          first_name: player.first_name || "",
          last_name: player.last_name || player.name || "",
          name: fullName,
          display_name: displayName,
          jersey_number: player.jersey_number || "",
          points: 0,
          boulders: {
            A: { currentZone: "", attempts: 0, points: 0 },
            B: { currentZone: "", attempts: 0, points: 0 },
            C: { currentZone: "", attempts: 0, points: 0 },
            D: { currentZone: "", attempts: 0, points: 0 },
          },
        },
      );
    } else if (
      existing.name !== fullName ||
      existing.jersey_number !== player.jersey_number
    ) {
      // Player was renamed — sync the scoreboard
      await update(
        ref(db, `scoreboard/${matchId}/teams/${selectedTeamKey}/players/${player.id}`),
        {
          first_name: player.first_name || "",
          last_name: player.last_name || player.name || "",
          name: fullName,
          display_name: displayName,
          jersey_number: player.jersey_number || "",
        },
      );
    }

    await setTeam(matchId, selectedTeamKey, {
      // current_player stores display_name so public screens show last name only
      current_player: displayName,
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

  const handleDurationChange = async (newDuration) => {
    await timerService.setDuration(
      matchId,
      newDuration,
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
        <h2 className="text-2xl font-bold">Scorer Panel</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus size={16} /> Add Team
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
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
          onDurationChange={handleDurationChange}
          onPeriodChange={(p) => updatePeriod(matchId, p)}
          panelSide={selectedTeamKey || "panel"}
          hideMeta
          hidePeriod
        />

        {/* Round Controls — drives the period shown on the scoreboards */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => updateRound(-1)}
            disabled={currentPeriodIndex === 0}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:hover:bg-gray-200 text-gray-700 text-lg font-bold transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="text-base font-semibold text-gray-700 w-24 text-center">
            Round {currentPeriodIndex + 1}
          </span>
          <button
            onClick={() => updateRound(1)}
            disabled={currentPeriodIndex === PERIODS.length - 1}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:hover:bg-gray-200 text-gray-700 text-lg font-bold transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {currentTeams.map(([teamKey, team]) => {
          const isSelected = selectedTeamKey === teamKey;
          const isLocked = !!lockedTeams[teamKey];
          const teamMeta = teams.find((t) => t.id === team.id);
          const teamGradient = teamMeta?.color
            ? getGradientById(teamMeta.color)
            : null;
          return (
            <div
              key={teamKey}
              onClick={() => {
                setSelectedTeamKey(teamKey);
                setSelectedPlayer(null);
              }}
              className={`rounded-xl overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-purple-400 shadow-lg"
                  : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md"
              }`}
            >
              {/* Color bar */}
              <div
                className={`h-2 w-full ${teamGradient ? teamGradient.gradient : "bg-gray-300"}`}
              />

              <div className="p-4 bg-white">
                {/* Card header: badge + name + delete */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-white text-xs font-bold px-2 py-1 rounded-md flex-shrink-0 ${
                        teamGradient ? teamGradient.badge : "bg-purple-600"
                      }`}
                    >
                      {teamKey}
                    </span>
                    <span className="font-semibold text-sm truncate text-gray-800">
                      {team.name || teamKey}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLocked) handleRemoveTeam(teamKey);
                    }}
                    disabled={isLocked}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      isLocked
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-red-400 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 size={14} />
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
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl font-bold tabular-nums text-gray-800">
                      {team.score || 0}
                    </span>
                    {(() => {
                      if (
                        !selectedPlayer?.id ||
                        selectedTeamKey !== teamKey
                      )
                        return null;
                      const bd =
                        playerBoulderData?.[teamKey]?.[selectedPlayer.id]?.[
                          team.current_boulder || "A"
                        ];
                      const ps = bd
                        ? getPossibleScore(bd.attempts || 0, bd.points || 0)
                        : null;
                      if (ps == null || ps <= 0) return null;
                      return (
                        <span className="text-base font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          +{ps}
                        </span>
                      );
                    })()}
                  </div>
                </div>
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
      {/* Save Match Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Save Match?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will finalize the match and save all scores. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowSaveDialog(false);
                  try {
                    const savedMatchId = await finishMatchMultiTeam(matchId);
                    toast.success(`Match ${savedMatchId} saved!`);
                  } catch (err) {
                    toast.error(`Error: ${err.message}`);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
