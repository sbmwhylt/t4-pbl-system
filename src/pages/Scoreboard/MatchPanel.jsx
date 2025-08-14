// pages/admin/MatchPanel.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import AdminLayout from "../../components/layout/AdminLayout";
import MatchInfo from "../../components/matchpanel/MatchInfo";
import BoulderSelection from "../../components/matchpanel/BoulderSelection";
import PlayerSelection from "../../components/matchpanel/PlayerSelection";
import AttemptsSelection from "../../components/matchpanel/AttemptsSelection";
import ProgressSelection from "../../components/matchpanel/ProgressSelection";
import TimerControl from "../../components/matchpanel/TimerControl";

export default function MatchPanel() {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [liveStatus, setLiveStatus] = useState({});
  const [currentBoulder, setCurrentBoulder] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [progress, setProgress] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(450);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load team info
  useEffect(() => {
    const teamRef = ref(db, `t4_bouldering/teams/${teamId}`);
    return onValue(teamRef, (snap) => setTeam(snap.val()));
  }, [teamId]);

  // Load players and include key as `id`
  useEffect(() => {
    const playersRef = ref(db, `t4_bouldering/players`);
    return onValue(playersRef, (snap) => {
      const allPlayers = snap.val() || {};
      const teamPlayers = Object.entries(allPlayers)
        .filter(([key, player]) => player.team_id === teamId)
        .map(([key, player]) => ({ ...player, id: key })); // add id
      setPlayers(teamPlayers);
    });
  }, [teamId]);

  // Load live status and sync timer
  useEffect(() => {
    const liveRef = ref(db, `t4_bouldering/live_status/${matchId}`);
    return onValue(liveRef, (snap) => {
      const data = snap.val() || {};
      setLiveStatus(data);

      if (data.time_remaining !== undefined)
        setTimeRemaining(data.time_remaining);
      if (data.clock_running !== undefined)
        setIsTimerRunning(data.clock_running);
    });
  }, [matchId]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          update(ref(db, `t4_bouldering/live_status/${matchId}`), {
            time_remaining: newTime,
          });
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining <= 0) {
      setIsTimerRunning(false);
      update(ref(db, `t4_bouldering/live_status/${matchId}`), {
        clock_running: false,
      });
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining, matchId]);

  // Update live_status and scoreboard
  const updateLiveStatus = (updates) => {
    update(
      ref(db, `t4_bouldering/live_status/${matchId}/on_boulders/${teamId}`),
      updates
    );

    if (team?.side) {
      const scoreboardUpdates = {};

      if (updates.player_id) {
        const player = players.find((p) => p.id === updates.player_id);
        scoreboardUpdates.jersey = player?.jersey_number || "";
        scoreboardUpdates.current_player = player?.name || "";
      }
      if (updates.points !== undefined) {
        scoreboardUpdates.possible = calculatePossiblePoints(updates.points);
        scoreboardUpdates.score = calculateScore(updates.points);
      }

      update(ref(db, `scoreboard/${matchId}/${team.side}`), {
        team_logo: team?.team_logo || "",
        abbreviation: team?.abbreviation || "",
        ...scoreboardUpdates,
      });
    }
  };

  const calculatePossiblePoints = (stage) =>
    stage === "Z1" ? 1 : stage === "Z2" ? 2 : stage === "Top" ? 5 : 0;

  const calculateScore = (stage) =>
    stage === "Top" ? 5 : stage === "Z2" ? 2 : stage === "Z1" ? 1 : 0;

  const resetTimer = () => {
    const newTime = 450;
    setTimeRemaining(newTime);
    update(ref(db, `t4_bouldering/live_status/${matchId}`), {
      time_remaining: newTime,
      clock_running: false,
    });
    setIsTimerRunning(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <MatchInfo team={team} matchId={matchId} />
          <BoulderSelection
            currentBoulder={currentBoulder}
            onSelectBoulder={(boulder) => {
              setCurrentBoulder(boulder);
              updateLiveStatus({ boulder_id: boulder });
            }}
          />
          <PlayerSelection
            players={players}
            selectedPlayer={selectedPlayer}
            onSelectPlayer={(playerId) => {
              setSelectedPlayer(playerId); // single selection
              updateLiveStatus({ player_id: playerId });
            }}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AttemptsSelection
            attempts={attempts}
            onSelectAttempt={(value) => {
              setAttempts(value);
              updateLiveStatus({ attempts: value });
            }}
          />

          <ProgressSelection
            progress={progress}
            onSelectProgress={(value) => {
              setProgress(value);
              updateLiveStatus({ points: value });
            }}
          />

          <TimerControl
            timeRemaining={timeRemaining}
            isTimerRunning={isTimerRunning}
            onStart={() => {
              setIsTimerRunning(true);
              update(ref(db, `t4_bouldering/live_status/${matchId}`), {
                clock_running: true,
              });
            }}
            onPause={() => {
              setIsTimerRunning(false);
              update(ref(db, `t4_bouldering/live_status/${matchId}`), {
                clock_running: false,
              });
            }}
            onReset={resetTimer}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
