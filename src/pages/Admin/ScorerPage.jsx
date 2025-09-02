// ScorerPage.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  subscribeScoreboard,
  subscribeTeams,
  subscribePlayers,
  setTeam,
  adjustScore,
  clearScore,
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  updatePeriod,
  finishMatch,
} from "../../services";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebase";
import Header from "../../components/ui/panel/Header";
import TeamSelector from "../../components/ui/panel/TeamSelector";
import ScoreButtons from "../../components/ui/panel/ScoreButtons";
import TimerControls from "../../components/ui/panel/TimerControls";
import PlayerButtons from "../../components/ui/panel/PlayersButtons";
import { CircleArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ScorerPage() {
  const { matchId = "demo", side = "left" } = useParams(); // side = "left" or "right"
  const navigate = useNavigate();

  // Timer refs
  const timerIntervalRef = useRef(null);
  const isRunningRef = useRef(false);
  const controllerRef = useRef(null);

  // State
  const [state, setState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Subscriptions
  useEffect(() => subscribeScoreboard(matchId, setState), [matchId]);
  useEffect(() => subscribeTeams(setTeams), []);
  useEffect(() => subscribePlayers(setAllPlayers), []);

  // Init match if missing
  useEffect(() => {
    const unsub = onValue(ref(db, `scoreboard/${matchId}`), (snap) => {
      if (!snap.exists()) initMatch(matchId);
    });
    return () => unsub();
  }, [matchId]);

  // Sync refs
  useEffect(() => {
    isRunningRef.current = state?.timer?.running || false;
    controllerRef.current = state?.timer?.controller || null;
  }, [state?.timer?.running, state?.timer?.controller]);

  // Tick interval
  // --- Tick interval ---
  useEffect(() => {
    if (!matchId) return;

    // One interval for each panel is fine; tickTimer is safe
    const interval = setInterval(() => {
      tickTimer(matchId); // no panel-specific logic needed
    }, 1000);

    return () => clearInterval(interval);
  }, [matchId]);

  if (!state) return <div className="p-6">Loading…</div>;

  const team = state.teams?.[side] || { id: "", name: side, score: 0 };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2
        className={`text-xl font-medium mb-4 text-center ${
          side === "left" ? "text-red-500" : "text-blue-500"
        }`}
      >
        Scoring for - {side === "left" ? "Team 1 (Left)" : "Team 2 (Right)"}
      </h2>

      <button onClick={() => navigate("/admin/matches")}>
        <CircleArrowLeft
          className="text-gray-500 mb-6 hover:text-gray-700 cursor-pointer transition-all"
          size={32}
        />
      </button>

      <Header matchId={matchId} />

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

      {/* Team panel */}
      <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex-col justify-between mt-6">
        {/* Label for Team 1 / Team 2 */}

        <div className="flex items-center justify-between mb-3">
          <TeamSelector
            value={team}
            teams={teams}
            onChange={(t) => setTeam(matchId, side, t)}
          />
          <div className="text-6xl font-semibold tabular-nums">
            {team.score}
          </div>
        </div>
        <ScoreButtons
          onPlus1={() => adjustScore(matchId, side, 1)}
          onPlus2={() => adjustScore(matchId, side, 2)}
          onMinus1={() => adjustScore(matchId, side, -1)}
          onClear={() => clearScore(matchId, side)}
        />
      </div>

      {/* Players */}
      <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex flex-col justify-between mt-6">
        <h3 className="text-lg font-semibold mb-2 text-center">
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
          onSelect={(player) => {
            setSelectedPlayer(player);
            setTeam(matchId, side, {
              current_player: player?.name,
              jersey: player?.jersey_number,
            });
          }}
          teamColor={side === "left" ? "blue" : "red"}
        />
      </div>
      <div className="flex gap-2 justify-end mt-8">
        <button
          onClick={async () => {
            try {
              // Save the demo match as finished
              const savedMatchId = await finishMatch();

              // Reset both teams at once
              await Promise.all([
                setTeam("demo", "left", {
                  id: "",
                  name: "Left",
                  score: 0,
                  current_player: null,
                  jersey: null,
                }),
                setTeam("demo", "right", {
                  id: "",
                  name: "Right",
                  score: 0,
                  current_player: null,
                  jersey: null,
                }),
              ]);

              toast.success(`Match ${savedMatchId} saved successfully!`);
            } catch (err) {
              console.error(err);
              toast.error(`Error: ${err.message}`);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 flex gap-2 items-center cursor-pointer transition-colors"
        >
          <Save size={18} />
          Finish Match
        </button>
      </div>
    </div>
  );
}
