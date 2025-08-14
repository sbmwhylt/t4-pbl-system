import { useEffect, useState } from "react";
import AdminLayout from "./../../components/layout/AdminLayout";
import { db } from "../../firebase"; // adjust path as needed
import { ref, onValue, set, update } from "firebase/database";
import { SlidersHorizontal, CirclePlay, Gamepad2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import PlayButton from "../Scoreboard/PlayButton";

export default function Matches() {
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [leftTeam, setLeftTeam] = useState("");
  const [rightTeam, setRightTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scoreTeamModalOpen, setScoreTeamModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Load teams
  useEffect(() => {
    const teamsRef = ref(db, "t4_bouldering/teams");
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      setTeams(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, []);

  // Load matches
  useEffect(() => {
    const matchesRef = ref(db, "t4_bouldering/matches");
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      setMatches(snapshot.val() || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  function generateMatchId(matchCode, dateObj) {
    const dateStr = dateObj
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, ""); // e.g. 081325
    return `M${matchCode}${dateStr}`;
  }

  function getNextMatchCode() {
    const codes = Object.keys(matches)
      .map((id) => {
        const match = id.match(/^M(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
    return String(maxCode + 1).padStart(3, "0");
  }

  async function createMatch() {
    if (!leftTeam || !rightTeam || leftTeam === rightTeam) {
      alert("Select two different teams");
      return;
    }
    if (!matchDate || !matchTime) {
      alert("Select date and time");
      return;
    }

    setCreating(true);

    const scheduledTime = new Date(`${matchDate}T${matchTime}`);
    const now = new Date();
    const status = "scheduled";

    const matchCode = getNextMatchCode();
    const matchId = generateMatchId(matchCode, scheduledTime);

    // Create match
    await set(ref(db, `t4_bouldering/matches/${matchId}`), {
      teams: [leftTeam, rightTeam],
      start_time: scheduledTime.getTime(),
      end_time: null,
      status,
      quarters: 2,
      quarter_duration: 450, // 7:30
    });

    if (status === "Live") {
      // Initialize live_status
      await set(ref(db, `t4_bouldering/live_status/${matchId}`), {
        clock: "07:30",
        period: "1ST",
        on_boulders: {
          [leftTeam]: {
            player_id: "",
            boulder_id: "",
            attempts: 0,
            points: 0,
          },
          [rightTeam]: {
            player_id: "",
            boulder_id: "",
            attempts: 0,
            points: 0,
          },
        },
      });

      // Initialize scoreboard
      const leftTeamData = teams[leftTeam];
      const rightTeamData = teams[rightTeam];

      await set(ref(db, `t4_bouldering/scoreboard/${matchId}`), {
        [leftTeam]: {
          abbreviation: leftTeamData.abbreviation,
          current_player: "",
          jersey: 0,
          possible: 0,
          score: 0,
          side: "left",
          team_logo: leftTeamData.logo_url,
        },
        [rightTeam]: {
          abbreviation: rightTeamData.abbreviation,
          current_player: "",
          jersey: 0,
          possible: 0,
          score: 0,
          side: "right",
          team_logo: rightTeamData.logo_url,
        },
      });
    }

    // Reset form and close modal
    setLeftTeam("");
    setRightTeam("");
    setMatchDate("");
    setMatchTime("");
    setCreating(false);
    setModalOpen(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4">Matches</h2>
        <Button onClick={() => setModalOpen(true)}>Set a Match</Button>
      </div>

      {/* Existing Matches */}
      <div className="space-y-4">
        {Object.entries(matches).length === 0 && <p>No matches found.</p>}

        {Object.entries(matches).length > 0 &&
          (() => {
            // Check if there is a live match ongoing
            const hasLiveMatch = Object.values(matches).some(
              (m) => m.status?.toLowerCase() === "live"
            );

            return (
              <Table
                columns={[
                  { header: "Match ID", accessor: "id" },
                  {
                    header: "Teams",
                    accessor: (row) =>
                      row.teams.map((id) => teams[id]?.name || id).join(" vs "),
                  },
                  { header: "Status", accessor: "status" },
                  {
                    header: "Scheduled",
                    accessor: (row) =>
                      new Date(row.start_time).toLocaleString(),
                  },
                ]}
                data={Object.entries(matches)
                  .map(([matchId, match]) => ({
                    id: matchId,
                    ...match,
                  }))
                  .sort((a, b) => b.start_time - a.start_time)}
                actions={(row) => (
                  <div className="flex gap-2 justify-end items-center">
                    {/* Play Button */}
                    {row.status?.toLowerCase() === "scheduled" && (
                      <PlayButton row={row} disabled={hasLiveMatch} />
                    )}

                    {/* Team Selection */}
                    <button
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedMatchId(row.id);
                        setScoreTeamModalOpen(true);
                      }}
                    >
                      <Gamepad2
                        className="text-gray-600 hover:text-blue-600"
                        size={16}
                      />
                    </button>
                  </div>
                )}
              />
            );
          })()}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Match"
      >
        <div className="mb-8 p-4 rounded bg-white">
          <div className="flex flex-col gap-4">
            <Select
              label="Left Team"
              name="leftTeam"
              value={leftTeam}
              onChange={(e) => setLeftTeam(e.target.value)}
              options={[
                { value: "", label: "Select Left Team" },
                ...Object.entries(teams).map(([id, team]) => ({
                  value: id,
                  label: team.name,
                })),
              ]}
            />

            <Select
              label="Right Team"
              name="rightTeam"
              value={rightTeam}
              onChange={(e) => setRightTeam(e.target.value)}
              options={[
                { value: "", label: "Select Right Team" },
                ...Object.entries(teams).map(([id, team]) => ({
                  value: id,
                  label: team.name,
                })),
              ]}
            />

            <Input
              label="Match Date"
              type="date"
              name="matchDate"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />

            <Input
              label="Match Time"
              type="time"
              name="matchTime"
              value={matchTime}
              onChange={(e) => setMatchTime(e.target.value)}
            />

            <Button onClick={createMatch} disabled={creating}>
              {creating ? "Creating..." : "Create Match"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={scoreTeamModalOpen}
        onClose={() => setScoreTeamModalOpen(false)}
        title="Select Team to Score"
      >
        <div className="p-4 grid grid-cols-2 gap-4">
          {matches[selectedMatchId]?.teams?.map((teamId) => {
            const team = teams[teamId];
            return (
              <Button
                key={teamId}
                onClick={() => {
                  window.location.href = `/match-panel/${selectedMatchId}?teamId=${teamId}`;
                }}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer"
              >
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="w-20 object-contain"
                />
                <span className="text-sm font-regular mt-2">{team.name}</span>
              </Button>
            );
          })}
        </div>
      </Modal>
    </AdminLayout>
  );
}
