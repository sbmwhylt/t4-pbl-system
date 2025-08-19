import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  subscribePlayersBySide,
  subscribeLiveStatus,
  subscribeScoreboard,
  updateLiveStatus,
  startTimer,
  pauseTimer,
  tickTimer,
  resetTimer,
  updateMatchStatus,
  updatePeriod,
} from "../../services/matchPanelService";

import MatchInfo from "../../components/matchpanel/MatchInfo";
import BoulderSelection from "../../components/matchpanel/BoulderSelection";
import PlayerSelection from "../../components/matchpanel/PlayerSelection";
import AttemptsSelection from "../../components/matchpanel/AttemptsSelection";
import ProgressSelection from "../../components/matchpanel/ProgressSelection";
import TimerControl from "../../components/matchpanel/TimerControl";
import { CircleArrowLeft } from "lucide-react";

export default function MatchPanel() {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // This is passed from the "pick a team" step
  const selectedSide = location.state?.side || "left"; // "left" or "right"

  const [players, setPlayers] = useState({ left: [], right: [] });
  const [teams, setTeams] = useState({ left: null, right: null });

  const [currentBoulder, setCurrentBoulder] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [progress, setProgress] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(450);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [period, setPeriod] = useState("1ST");

  // Subscriptions
  useEffect(() => {
    if (!matchId) return;
    const unsub = subscribePlayersBySide(matchId, ({ leftPlayers, rightPlayers }) => {
      setPlayers({ left: leftPlayers, right: rightPlayers });
    });
    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    return subscribeLiveStatus(matchId, (data) => {
      if (data.time_remaining !== undefined) setTimeRemaining(data.time_remaining);
      if (data.clock_running !== undefined && data.clock_running !== isTimerRunning) {
        setIsTimerRunning(data.clock_running);
      }
      if (data.period !== undefined) setPeriod(data.period);
    });
  }, [matchId, isTimerRunning]);

  useEffect(() => {
    const unsub = subscribeScoreboard(matchId, (data) => {
      const leftTeam = data.left ? { ...data.left, side: "left" } : null;
      const rightTeam = data.right ? { ...data.right, side: "right" } : null;
      setTeams({ left: leftTeam, right: rightTeam });
    });
    return () => unsub();
  }, [matchId]);

  // Timer ticking
  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          tickTimer(matchId, newTime, period);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining, matchId, period]);

  // End Match
  const handleFinishMatch = async () => {
    try {
      setIsTimerRunning(false);
      pauseTimer(matchId);

      await updateMatchStatus(matchId, {
        status: "finished",
        final_period: period,
        final_time_remaining: timeRemaining,
        finished_at: Date.now(),
      });

      navigate("/admin/matches");
    } catch (err) {
      console.error("Error finishing match:", err);
    }
  };

  // Pick the correct team/players based on side chosen
  const activeTeam = teams[selectedSide];
  const activePlayers = players[selectedSide] || [];

  return (
    <div className="p-10 bg-gray-100 h-screen">
      <button onClick={() => navigate("/admin/matches")}>
        <CircleArrowLeft className="w-10 h-10 text-gray-300 mb-6 hover:text-gray-400" />
      </button>

      <div className="space-y-6">
        <MatchInfo team={activeTeam} matchId={matchId} />

        <BoulderSelection
          currentBoulder={currentBoulder}
          onSelectBoulder={(boulderId) => {
            setCurrentBoulder(boulderId);
            updateLiveStatus(
              matchId,
              activeTeam?.team_id,
              activeTeam,
              activePlayers,
              { boulder_id: boulderId },
              period,
              timeRemaining
            );
          }}
        />

        <PlayerSelection
          players={activePlayers}
          selectedPlayer={selectedPlayer}
          onSelectPlayer={(playerId) => {
            setSelectedPlayer(playerId);
            updateLiveStatus(
              matchId,
              activeTeam?.team_id,
              activeTeam,
              activePlayers,
              { player_id: playerId },
              period,
              timeRemaining
            );
          }}
        />

        <AttemptsSelection
          attempts={attempts}
          onSelectAttempt={(value) => {
            setAttempts(value);
            updateLiveStatus(
              matchId,
              activeTeam?.team_id,
              activeTeam,
              activePlayers,
              { attempts: value },
              period,
              timeRemaining
            );
          }}
        />

        <ProgressSelection
          progress={progress}
          onSelectProgress={(value) => {
            setProgress(value);
            updateLiveStatus(
              matchId,
              activeTeam?.team_id,
              activeTeam,
              activePlayers,
              { points: value },
              period,
              timeRemaining
            );
          }}
        />

        <TimerControl
          timeRemaining={timeRemaining}
          isTimerRunning={isTimerRunning}
          period={period}
          onStart={() => {
            setIsTimerRunning(true);
            startTimer(matchId);
          }}
          onPause={() => {
            setIsTimerRunning(false);
            pauseTimer(matchId);
          }}
          onFinish={handleFinishMatch}
          onPeriodChange={(newPeriod) => {
            setPeriod(newPeriod);
            setTimeRemaining(450);
            updatePeriod(matchId, newPeriod);
          }}
        />
      </div>
    </div>
  );
}
