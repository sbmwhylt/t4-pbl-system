import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  subscribeTeam,
  subscribePlayers,
  subscribeLiveStatus,
  updateLiveStatus,
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  updatePeriod,
  updateMatchStatus,
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
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentBoulder, setCurrentBoulder] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [progress, setProgress] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(450);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [period, setPeriod] = useState("1ST");

  const navigate = useNavigate();

  // Subscriptions
  useEffect(() => subscribeTeam(teamId, setTeam), [teamId]);
  useEffect(() => subscribePlayers(teamId, setPlayers), [teamId]);
  useEffect(() => {
    return subscribeLiveStatus(matchId, (data) => {
      if (data.time_remaining !== undefined)
        setTimeRemaining(data.time_remaining);
      if (
        data.clock_running !== undefined &&
        data.clock_running !== isTimerRunning
      ) {
        setIsTimerRunning(data.clock_running);
      }
      if (data.period !== undefined) setPeriod(data.period);
    });
  }, [matchId, isTimerRunning]);

  // Timer effect
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

  //End Match
  const handleFinishMatch = async () => {
    try {
      // Stop timer in UI and DB
      setIsTimerRunning(false);
      pauseTimer(matchId);

      // Save final game state
      await updateMatchStatus(matchId, {
        status: "finished",
        final_period: period,
        final_time_remaining: timeRemaining,
        // Add whatever else you want to snapshot
        // scores, players, etc.
        finished_at: Date.now(),
      });

      // Redirect to matches list
      navigate("/admin/matches");
    } catch (err) {
      console.error("Error finishing match:", err);
    }
  };

  return (
    <div className="p-10 grid md:grid-cols-1 lg:grid-cols-2 lg:gap-6 bg-gray-100 h-screen">
      {/* Left Column */}
      <div className="space-y-6">
        <button onClick={() => navigate("/admin/matches")}>
          <CircleArrowLeft className="w-10 h-10 text-gray-300 mb-6 hover:text-gray-400" />
        </button>
        <MatchInfo team={team} matchId={matchId} />
        <BoulderSelection
          currentBoulder={currentBoulder}
          onSelectBoulder={(boulder) => {
            setCurrentBoulder(boulder);
            updateLiveStatus(
              matchId,
              teamId,
              team,
              players,
              { boulder_id: boulder },
              period,
              timeRemaining
            );
          }}
        />
        <PlayerSelection
          players={players}
          selectedPlayer={selectedPlayer}
          onSelectPlayer={(playerId) => {
            setSelectedPlayer(playerId);
            updateLiveStatus(
              matchId,
              teamId,
              team,
              players,
              { player_id: playerId },
              period,
              timeRemaining
            );
          }}
        />
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <AttemptsSelection
          attempts={attempts}
          onSelectAttempt={(value) => {
            setAttempts(value);
            updateLiveStatus(
              matchId,
              teamId,
              team,
              players,
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
              teamId,
              team,
              players,
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
          onFinish={handleFinishMatch} // <-- new
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
