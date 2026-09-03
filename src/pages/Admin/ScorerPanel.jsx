import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { onValue, ref, set, update } from "firebase/database";
import { db } from "@/firebase";
import { toast } from "react-hot-toast";

import TeamSelector from "@/components/ui/panel/TeamSelector";
import PlayerButtons from "@/components/ui/panel/PlayersButtons";
import TimerControls from "@/components/ui/panel/TimerControls";
import ZoneSelection from "@/components/ui/panel/ZoneSelection";
import AttemptButtons from "@/components/ui/panel/AttemptButtons";

import { Save, Plus, Trash2, ArrowLeftRight, Settings2, X } from "lucide-react";
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  // Match setup (team assignment, overlay, add/remove) is used before the match
  // starts, so it's tucked away behind a toggle to keep the scoring view clean.
  const [showSetup, setShowSetup] = useState(false);

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

  if (!state)
    return (
      <div className="min-h-screen grid place-items-center text-gray-400">
        Loading…
      </div>
    );

  const currentTeams = Object.entries(state.teams || {});
  const selectedTeam = selectedTeamKey
    ? (state.teams?.[selectedTeamKey] ?? null)
    : null;
  const selectedBoulder = selectedTeam?.current_boulder || "A";
  const overlayActive = !!(state.overlay?.left && state.overlay?.right);

  const selectedTeamMeta = selectedTeam?.id
    ? teams.find((t) => t.id === selectedTeam.id)
    : null;
  const selectedGradient = selectedTeamMeta?.color
    ? getGradientById(selectedTeamMeta.color)
    : null;

  const rosterPlayers = selectedTeam?.id
    ? allPlayers.filter(
        (p) => p.team_id === selectedTeam.id && p.status === "active",
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 select-none">
      {/* ============ STICKY COMMAND BAR — timer, round & match actions ============ */}
      <div className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-3 lg:px-5 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
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
              compact
              /* Round stepper lives inside the timer bar so the clock and the
                 period the scoreboards display stay on one row. */
              roundLabel={`Round ${currentPeriodIndex + 1}`}
              onRoundChange={updateRound}
              canRoundDown={currentPeriodIndex > 0}
              canRoundUp={currentPeriodIndex < PERIODS.length - 1}
            />
          </div>

          {/* Match actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSetup((v) => !v)}
              aria-pressed={showSetup}
              className={`h-14 w-14 grid place-items-center rounded-xl transition-colors active:scale-95 cursor-pointer ${
                showSetup
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-500 ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
              title="Match setup"
            >
              <Settings2 size={22} />
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="h-14 px-4 flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              <Save size={20} />
              <span className="hidden md:inline">Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 lg:px-5 py-3">
        {/* ============ MATCH SETUP (collapsible) ============ */}
        {showSetup && (
          <div className="mb-3 rounded-2xl bg-white ring-1 ring-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Match Setup
              </h2>
              <button
                onClick={() => setShowSetup(false)}
                className="h-9 w-9 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Team assignment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Teams
                  </span>
                  <button
                    onClick={handleAddTeam}
                    className="h-11 px-4 flex items-center gap-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={18} /> Add Team
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {currentTeams.map(([teamKey, team]) => {
                    const isLocked = !!lockedTeams[teamKey];
                    return (
                      <div
                        key={teamKey}
                        className="flex items-center gap-2 rounded-xl bg-gray-50 ring-1 ring-gray-200 p-2"
                      >
                        <span className="text-xs font-bold text-gray-500 w-7 shrink-0 text-center">
                          {teamKey}
                        </span>
                        <div className="flex-1 min-w-0">
                          <TeamSelector
                            value={team}
                            teams={teams}
                            onChange={(t) => setTeam(matchId, teamKey, t)}
                            locked={isLocked}
                            onLockToggle={() => toggleLock(teamKey)}
                          />
                        </div>
                        <button
                          onClick={() => !isLocked && handleRemoveTeam(teamKey)}
                          disabled={isLocked}
                          className={`h-11 w-11 shrink-0 grid place-items-center rounded-lg transition-colors ${
                            isLocked
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-500 hover:bg-red-50 cursor-pointer"
                          }`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overlay display */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Overlay Display
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      overlayActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {overlayActive ? "Active" : "Not set"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={state.overlay?.left ?? ""}
                    onChange={(e) =>
                      setOverlayTeams(
                        matchId,
                        e.target.value || null,
                        state.overlay?.right ?? null,
                      )
                    }
                    className="flex-1 min-w-0 h-12 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium cursor-pointer"
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
                    disabled={!overlayActive}
                    title="Swap overlay teams"
                    className="h-12 w-12 shrink-0 grid place-items-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ArrowLeftRight size={20} />
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
                    className="flex-1 min-w-0 h-12 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium cursor-pointer"
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
            </div>
          </div>
        )}

        {/* ============ MAIN WORKSPACE ============ */}
        {/* Teams rail beside the scoring surface so switching teams never
            scrolls the scoring controls out of reach on a tablet. */}
        <div className="grid gap-3 lg:grid-cols-[minmax(230px,280px)_1fr]">
          {/* ---- Teams rail ---- */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0">
            {currentTeams.map(([teamKey, team]) => {
              const isSelected = selectedTeamKey === teamKey;
              const teamMeta = teams.find((t) => t.id === team.id);
              const teamGradient = teamMeta?.color
                ? getGradientById(teamMeta.color)
                : null;

              // Live "+N" preview of what the in-progress boulder can still earn
              let possible = null;
              if (isSelected && selectedPlayer?.id) {
                const bd =
                  playerBoulderData?.[teamKey]?.[selectedPlayer.id]?.[
                    team.current_boulder || "A"
                  ];
                const ps = bd
                  ? getPossibleScore(bd.attempts || 0, bd.points || 0)
                  : null;
                if (ps != null && ps > 0) possible = ps;
              }

              return (
                <button
                  key={teamKey}
                  onClick={() => {
                    setSelectedTeamKey(teamKey);
                    setSelectedPlayer(null);
                  }}
                  className={`relative shrink-0 lg:shrink text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] cursor-pointer w-[190px] lg:w-auto ${
                    isSelected
                      ? "ring-2 ring-blue-500 bg-white shadow-md"
                      : "ring-1 ring-gray-200 bg-white hover:ring-gray-300"
                  }`}
                >
                  <div
                    className={`h-1.5 w-full ${
                      teamGradient ? teamGradient.gradient : "bg-gray-300"
                    }`}
                  />
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-white text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          teamGradient ? teamGradient.badge : "bg-gray-500"
                        }`}
                      >
                        {teamKey}
                      </span>
                      <span
                        className={`text-sm font-semibold truncate ${
                          isSelected ? "text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {team.name || teamKey}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold tabular-nums leading-none text-gray-900">
                        {team.score || 0}
                      </span>
                      {possible != null && (
                        <span className="mb-0.5 text-sm font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md">
                          +{possible}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ---- Scoring surface ---- */}
          {selectedTeamKey && selectedTeam ? (
            <div className="rounded-2xl bg-white ring-1 ring-gray-200 overflow-hidden">
              {/* Context strip: who you're scoring + boulder + anchor */}
              <div
                className={`px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 ${
                  selectedGradient ? "bg-gray-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 mr-auto">
                  <span
                    className={`text-white text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      selectedGradient ? selectedGradient.badge : "bg-gray-500"
                    }`}
                  >
                    {selectedTeamKey}
                  </span>
                  <span className="font-bold truncate">
                    {selectedTeam.name || selectedTeamKey}
                  </span>
                  {selectedPlayer && (
                    <span className="text-sm text-gray-500 truncate hidden sm:inline">
                      ·{" "}
                      {selectedPlayer.first_name
                        ? `${selectedPlayer.first_name} ${selectedPlayer.last_name || ""}`.trim()
                        : selectedPlayer.last_name || selectedPlayer.name}
                    </span>
                  )}
                </div>

                {/* Boulder segmented control */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 hidden sm:inline">
                    Boulder
                  </span>
                  <div className="flex gap-1 bg-gray-200/70 rounded-xl p-1">
                    {boulders.map((b) => (
                      <button
                        key={b}
                        onClick={() => handleBoulderChange(b)}
                        className={`h-11 w-11 rounded-lg text-base font-bold transition-all active:scale-95 cursor-pointer ${
                          selectedBoulder === b
                            ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-300"
                            : "text-gray-500 hover:bg-white/60"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anchor toggle */}
                <button
                  onClick={() => setIsAnchor((v) => !v)}
                  aria-pressed={isAnchor}
                  className={`h-11 px-4 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                    isAnchor
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-gray-200/70 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  ⚓ Anchor{isAnchor ? " ON" : ""}
                </button>
              </div>

              <div className="p-3 space-y-3">
                {/* Players */}
                <PlayerButtons
                  players={rosterPlayers}
                  activePlayerId={selectedPlayer?.id}
                  onSelect={handlePlayerSelect}
                />

                {selectedTeam?.id && selectedPlayer?.id ? (
                  <>
                    {/* Attempts — comes first: an attempt must exist before zones unlock */}
                    <AttemptButtons
                      matchId={matchId}
                      side={selectedTeamKey}
                      playerId={selectedPlayer.id}
                      selectedBoulder={selectedBoulder}
                      playerBoulderData={playerBoulderData}
                      maxAttempts={30}
                    />

                    {/* Zones */}
                    <ZoneSelection
                      playerId={selectedPlayer.id}
                      teamSide={selectedTeamKey}
                      selectedBoulder={selectedBoulder}
                      playerBoulderData={playerBoulderData}
                      onZoneClick={handleZoneClick}
                      onZoneReset={handleZoneReset}
                      isAnchor={isAnchor}
                    />
                  </>
                ) : (
                  selectedTeam?.id && (
                    <p className="py-10 text-center text-gray-400 font-medium">
                      Select a player to start scoring
                    </p>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white ring-1 ring-gray-200 grid place-items-center py-20 px-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-700">
                  Select a team to score
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Tap a team {" "}
                  <span className="lg:hidden">above</span>
                  <span className="hidden lg:inline">on the left</span> to open
                  its scoring controls.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ SAVE CONFIRMATION ============ */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Save Match?</h3>
            <p className="text-gray-500 mb-6">
              This will finalize the match and save all scores. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 h-14 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
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
                className="flex-1 h-14 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
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
