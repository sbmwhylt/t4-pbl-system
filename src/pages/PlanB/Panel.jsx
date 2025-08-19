import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeScoreboard,
  subscribeTeams,
  initMatch,
  setTeam,
  adjustScore,
  clearScore,
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  updatePeriod,
  DEFAULT_DURATION,
} from "./PlanBService";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebase";

import Header from "../PlanB/components/Header";
import TeamSelector from "../PlanB/components/TeamSelector";
import ScoreButtons from "../PlanB/components/ScoreButtons";
import TimerControls from "../PlanB/components/TimerControls";

export default function PanelPage() {
  const { matchId = "demo" } = useParams();
  
  // Default state to render immediately
  const [state, setState] = useState({
    teams: { left: { name: "Left", score: 0 }, right: { name: "Right", score: 0 } },
    timer: { duration: DEFAULT_DURATION, remaining: DEFAULT_DURATION, running: false },
    period: "1ST",
  });

  const [teams, setTeams] = useState([]);
  const tickingRef = useRef(null);

  // Subscribe to scoreboard
  useEffect(() => {
    const unsub = subscribeScoreboard(matchId, (data) => setState(data));
    return () => unsub();
  }, [matchId]);

  // Initialize match if not existing
  useEffect(() => {
    const unsub = onValue(ref(db, `scoreboard/${matchId}`), (snap) => {
      if (!snap.exists()) initMatch(matchId);
    });
    return () => unsub();
  }, [matchId]);

  // Subscribe to teams
  useEffect(() => {
    const unsubTeams = subscribeTeams(setTeams);
    return () => unsubTeams();
  }, []);

  // Timer: local decrement + Firebase sync
  useEffect(() => {
    if (tickingRef.current) return;

    tickingRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev?.timer?.running) return prev;

        const remaining = Math.max(0, (prev.timer.remaining || 0) - 1);

        // Sync to Firebase every second
        tickTimer(matchId);

        return { ...prev, timer: { ...prev.timer, remaining } };
      });
    }, 1000);

    return () => clearInterval(tickingRef.current);
  }, [matchId]);

  const left = state.teams.left;
  const right = state.teams.right;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header matchId={matchId} />

      <div className="mt-6 grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left team */}
        <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <TeamSelector
              value={left}
              teams={teams}
              onChange={(t) => setTeam(matchId, "left", t)}
            />
            <div className="text-6xl font-semibold tabular-nums">{left.score}</div>
          </div>
          <ScoreButtons
            onPlus1={() => adjustScore(matchId, "left", 1)}
            onPlus2={() => adjustScore(matchId, "left", 2)}
            onMinus1={() => adjustScore(matchId, "left", -1)}
            onClear={() => clearScore(matchId, "left")}
          />
        </div>

        {/* Right team */}
        <div className="rounded-xl bg-gray-100 p-6 border border-gray-300 flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <TeamSelector
              value={right}
              teams={teams}
              onChange={(t) => setTeam(matchId, "right", t)}
            />
            <div className="text-6xl font-semibold tabular-nums">{right.score}</div>
          </div>
          <ScoreButtons
            onPlus1={() => adjustScore(matchId, "right", 1)}
            onPlus2={() => adjustScore(matchId, "right", 2)}
            onMinus1={() => adjustScore(matchId, "right", -1)}
            onClear={() => clearScore(matchId, "right")}
          />
        </div>
      </div>

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
    </div>
  );
}
