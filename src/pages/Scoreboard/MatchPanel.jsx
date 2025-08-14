import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import Button from "../../components/ui/Button";
import AdminLayout from "../../components/layout/AdminLayout";

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

  // Load live status
  useEffect(() => {
    const liveRef = ref(db, `t4_bouldering/live_status/${matchId}`);
    return onValue(liveRef, (snap) => {
      setLiveStatus(snap.val() || {});
    });
  }, [matchId]);

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
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">
          Match Panel – {team?.name || "Loading..."}
        </h1>

        {/* Boulder Selection */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Select Boulder</h2>
          <div className="flex gap-2">
            {["A", "B", "C", "D"].map((boulder) => (
              <Button
                key={boulder}
                onClick={() => {
                  setCurrentBoulder(boulder);
                  updateLiveStatus({ boulder_id: boulder });
                }}
                className={
                  currentBoulder === boulder ? "bg-blue-600 text-white" : ""
                }
              >
                {boulder}
              </Button>
            ))}
          </div>
        </div>

        {/* Player Selection */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Select Player</h2>
          <div className="grid grid-cols-5 gap-2">
            {players.map((player) => (
              <Button
                key={player.id}
                onClick={() => {
                  setSelectedPlayer(player.id);
                  updateLiveStatus({ player_id: player.id });
                }}
                className={
                  selectedPlayer === player.id
                    ? "bg-green-600 text-white"
                    : ""
                }
              >
                #{player.jersey} {player.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Attempts */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Attempts</h2>
          <div className="flex gap-2 flex-wrap">
            {[...Array(20).keys()].map((i) => {
              const attemptNum = i + 1;
              return (
                <Button
                  key={attemptNum}
                  onClick={() => {
                    setAttempts(attemptNum);
                    updateLiveStatus({ attempts: attemptNum });
                  }}
                  className={
                    attempts === attemptNum
                      ? "bg-yellow-500 text-white"
                      : ""
                  }
                >
                  {attemptNum}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Progress</h2>
          <div className="flex gap-2">
            {["No Points", "Z1", "Z2", "Top"].map((stage) => (
              <Button
                key={stage}
                onClick={() => {
                  setProgress(stage);
                  updateLiveStatus({ points: stage });
                }}
                className={
                  progress === stage ? "bg-purple-600 text-white" : ""
                }
              >
                {stage}
              </Button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <h2 className="font-semibold mb-2">Timer</h2>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                update(ref(db, `t4_bouldering/live_status/${matchId}`), {
                  clock_running: true,
                })
              }
            >
              Start
            </Button>
            <Button
              onClick={() =>
                update(ref(db, `t4_bouldering/live_status/${matchId}`), {
                  clock_running: false,
                })
              }
            >
              Stop
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
