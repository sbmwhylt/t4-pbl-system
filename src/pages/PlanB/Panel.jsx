// PanelPage.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  subscribeScoreboard,
  subscribeTeams,
  subscribePlayers,
  initMatch,
  setTeam,
  adjustScore,
  clearScore,
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  updatePeriod,
  finishMatch,
} from "./PlanBService";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

// Components
import Header from "../PlanB/components/Header";
import TeamSelector from "../PlanB/components/TeamSelector";
import ScoreButtons from "../PlanB/components/ScoreButtons";
import TimerControls from "../PlanB/components/TimerControls";
import PlayerButtons from "../PlanB/components/PlayersButtons";
import { CircleArrowLeft } from "lucide-react";

export default function PanelPage() {
  const { matchId = "demo" } = useParams();

  // --- Refs for interval and running state ---
  const timerIntervalRef = useRef(null);
  const isRunningRef = useRef(false);
  const controllerRef = useRef(null);

  // State
  const [state, setState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedLeftPlayer, setSelectedLeftPlayer] = useState(null);
  const [selectedRightPlayer, setSelectedRightPlayer] = useState(null);
  const navigate = useNavigate();

  // --- Subscriptions ---
  useEffect(() => subscribeScoreboard(matchId, setState), [matchId]);
  useEffect(() => subscribeTeams(setTeams), []);
  useEffect(() => subscribePlayers(setAllPlayers), []);

  // --- Initialize match if missing ---
  useEffect(() => {
    const unsub = onValue(ref(db, `scoreboard/${matchId}`), (snap) => {
      if (!snap.exists()) initMatch(matchId);
    });
    return () => unsub();
  }, [matchId]);

  // --- Keep running state in sync ---
  useEffect(() => {
    isRunningRef.current = state?.timer?.running || false;
    controllerRef.current = state?.timer?.controller || null;
  }, [state?.timer?.running, state?.timer?.controller]);

  // --- Single stable interval ---
  useEffect(() => {
    if (!matchId) return;

    if (!timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        // Only the controller decrements
        if (isRunningRef.current && controllerRef.current === "panel") {
          tickTimer(matchId);
        }
      }, 1000);
    }

    return () => {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    };
  }, [matchId]);

  if (!state) return <div className="p-6">Loading…</div>;

  // --- Left/Right team shortcuts ---
  const left = state.teams?.left || { id: "", name: "Left", score: 0 };
  const right = state.teams?.right || { id: "", name: "Right", score: 0 };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate("/admin/matches")}>
        <CircleArrowLeft
          className=" text-gray-500 mb-6 hover:text-gray-700 cursor-pointer transition-all"
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

      <div className="mt-6 grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left team panel */}
        <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <TeamSelector
              value={left}
              teams={teams}
              onChange={(t) => setTeam(matchId, "left", t)}
            />
            <div className="text-6xl font-semibold tabular-nums">
              {left.score}
            </div>
          </div>
          <ScoreButtons
            onPlus1={() => adjustScore(matchId, "left", 1)}
            onPlus2={() => adjustScore(matchId, "left", 2)}
            onMinus1={() => adjustScore(matchId, "left", -1)}
            onClear={() => clearScore(matchId, "left")}
          />
        </div>

        {/* Right team panel */}
        <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <TeamSelector
              value={right}
              teams={teams}
              onChange={(t) => setTeam(matchId, "right", t)}
            />
            <div className="text-6xl font-semibold tabular-nums">
              {right.score}
            </div>
          </div>
          <ScoreButtons
            onPlus1={() => adjustScore(matchId, "right", 1)}
            onPlus2={() => adjustScore(matchId, "right", 2)}
            onMinus1={() => adjustScore(matchId, "right", -1)}
            onClear={() => clearScore(matchId, "right")}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Left team players */}
        <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex flex-col justify-between">
          <h3 className="text-lg font-semibold mb-2 text-center">
            Team 1 Players
          </h3>
          <PlayerButtons
            players={
              left?.id ? allPlayers.filter((p) => p.team_id === left.id) : []
            }
            activePlayerId={selectedLeftPlayer?.id}
            onSelect={(player) => {
              setSelectedLeftPlayer(player);
              setTeam(matchId, "left", {
                current_player: player?.name,
                jersey: player?.jersey_number,
              });
            }}
            teamColor="blue"
          />
        </div>

        {/* Right team players */}
        <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex flex-col justify-between">
          <h3 className="text-lg font-semibold mb-2 text-center">
            Team 2 Players
          </h3>
          <PlayerButtons
            players={allPlayers.filter((p) => p.team_id === right.id)}
            activePlayerId={selectedRightPlayer?.id}
            onSelect={(player) => {
              setSelectedRightPlayer(player);
              setTeam(matchId, "right", {
                current_player: player?.name,
                jersey: player?.jersey_number,
              });
            }}
            teamColor="red"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-8">
        <button
          onClick={async () => {
            try {
              // Save the demo match as finished
              const savedMatchId = await finishMatch();

              // Reset selected players in state
              setSelectedLeftPlayer(null);
              setSelectedRightPlayer(null);

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
