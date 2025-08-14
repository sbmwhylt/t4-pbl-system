import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import Button from "../../components/ui/Button";
import AdminLayout from "../../components/layout/AdminLayout";
import { Play, Pause, Square } from "lucide-react";

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
  const [timeRemaining, setTimeRemaining] = useState(450); // 5 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load team info
  useEffect(() => {
    const teamRef = ref(db, `t4_bouldering/teams/${teamId}`);
    return onValue(teamRef, (snap) => {
      setTeam(snap.val());
    });
  }, [teamId]);

  // Load players
  useEffect(() => {
    const playersRef = ref(db, `t4_bouldering/players`);
    return onValue(playersRef, (snap) => {
      const allPlayers = snap.val() || {};
      const teamPlayers = Object.values(allPlayers).filter(
        (p) => p.team_id === teamId
      );
      setPlayers(teamPlayers);
    });
  }, [teamId]);

  // Load live status and timer
  useEffect(() => {
    const liveRef = ref(db, `t4_bouldering/live_status/${matchId}`);
    return onValue(liveRef, (snap) => {
      const data = snap.val() || {};
      setLiveStatus(data);
      
      // Sync timer state from Firebase
      if (data.time_remaining !== undefined) {
        setTimeRemaining(data.time_remaining);
      }
      if (data.clock_running !== undefined) {
        setIsTimerRunning(data.clock_running);
      }
    });
  }, [matchId]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          // Update Firebase every second to keep in sync
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

  // Helper: update live_status AND scoreboard
  const updateLiveStatus = (updates) => {
    // Update live status for this team
    update(
      ref(db, `t4_bouldering/live_status/${matchId}/on_boulders/${teamId}`),
      updates
    );

    // ALSO update scoreboard
    if (team?.side) {
      const scoreboardUpdates = {};

      // Pass through known values
      if (updates.player_id) {
        const player = players.find((p) => p.id === updates.player_id);
        scoreboardUpdates.jersey = player?.jersey || "";
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

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset timer to 5 minutes
  const resetTimer = () => {
    const newTime = 450; // 5 minutes
    setTimeRemaining(newTime);
    update(ref(db, `t4_bouldering/live_status/${matchId}`), {
      time_remaining: newTime,
      clock_running: false,
    });
    setIsTimerRunning(false);
  };

  // Simple scoring rules (adjust if needed)
  const calculatePossiblePoints = (stage) => {
    if (stage === "Z1") return 1;
    if (stage === "Z2") return 2;
    if (stage === "Top") return 5;
    return 0;
  };

  const calculateScore = (stage) => {
    if (stage === "Top") return 5;
    if (stage === "Z2") return 2;
    if (stage === "Z1") return 1;
    return 0;
  };

  return (
    <AdminLayout>
      <div className="p-4 grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Match Info */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h1 className="text-xl font-bold">{team?.name}</h1>
            <p className="text-gray-500">Match ID: {matchId}</p>
          </div>

          {/* Boulder Selection */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Boulders</h2>
            <div className="flex gap-2">
              {["A", "B", "C", "D"].map((boulder) => (
                <Button
                  key={boulder}
                  className={`w-16 h-16 text-lg rounded-lg ${
                    currentBoulder === boulder
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => {
                    setCurrentBoulder(boulder);
                    updateLiveStatus({ boulder_id: boulder });
                  }}
                >
                  {boulder}
                </Button>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Players</h2>
            <div className="grid grid-cols-3 gap-2">
              {players.map((player) => (
                <Button
                  key={player.id}
                  className={`p-2 rounded-lg text-sm ${
                    selectedPlayer === player.id
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedPlayer(player.id);
                    updateLiveStatus({ player_id: player.id });
                  }}
                >
                  #{player.jersey} {player.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Attempts */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Attempts</h2>
            <div className="flex gap-2 flex-wrap">
              {[...Array(20).keys()].map((i) => {
                const attemptNum = i + 1;
                return (
                  <Button
                    key={attemptNum}
                    className={`w-10 h-10 rounded-lg ${
                      attempts === attemptNum
                        ? "bg-yellow-500 text-white shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setAttempts(attemptNum);
                      updateLiveStatus({ attempts: attemptNum });
                    }}
                  >
                    {attemptNum}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Progress</h2>
            <div className="flex gap-2">
              {["No Points", "Z1", "Z2", "Top"].map((stage) => (
                <Button
                  key={stage}
                  className={`px-4 py-2 rounded-lg ${
                    progress === stage
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setProgress(stage);
                    updateLiveStatus({ points: stage });
                  }}
                >
                  {stage}
                </Button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Timer</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl font-mono bg-gray-100 px-4 py-2 rounded-lg">
                {formatTime(timeRemaining)}
              </div>
              <Button
                className="bg-gray-200 hover:bg-gray-300"
                onClick={resetTimer}
              >
                <Square className="inline-block" size={18} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isTimerRunning
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                onClick={() => {
                  if (!isTimerRunning) {
                    setIsTimerRunning(true);
                    update(ref(db, `t4_bouldering/live_status/${matchId}`), {
                      clock_running: true,
                    });
                  }
                }}
                disabled={isTimerRunning}
              >
                <Play size={18} /> Start
              </Button>
              <Button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  !isTimerRunning
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-700 text-white"
                }`}
                onClick={() => {
                  if (isTimerRunning) {
                    setIsTimerRunning(false);
                    update(ref(db, `t4_bouldering/live_status/${matchId}`), {
                      clock_running: false,
                    });
                  }
                }}
                disabled={!isTimerRunning}
              >
                <Pause size={18} /> Pause
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}