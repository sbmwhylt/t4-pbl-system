import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { ChartNoAxesColumn, Play, Gamepad2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import PlayButton from "../Scoreboard/PlayButton";
import matchesService from "../../services/matchesService";

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
  const navigate = useNavigate();

  // Load teams
  useEffect(() => {
    const unsubscribe = matchesService.getTeams(setTeams);
    return () => unsubscribe();
  }, []);

  // Load matches
  useEffect(() => {
    const unsubscribe = matchesService.getMatches(setMatches, setLoading);
    return () => unsubscribe();
  }, []);

  async function handleCreateMatch() {
    try {
      setCreating(true);
      await matchesService.createMatch({
        leftTeam,
        rightTeam,
        matchDate,
        matchTime,
        teams,
      });
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setLeftTeam("");
    setRightTeam("");
    setMatchDate("");
    setMatchTime("");
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

      <div className="space-y-4">
        {Object.entries(matches).length === 0 && <p>No matches found.</p>}

        {Object.entries(matches).length > 0 &&
          (() => {
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
                actions={(row) => {
                  const status = row.status?.toLowerCase();
                  return (
                    <div className="flex gap-2 justify-end items-center">
                      {status === "scheduled" && (
                        <button
                          onClick={async () => {
                            if (hasLiveMatch) return;

                            const match = matches[row.id];
                            await matchesService.startMatch({
                              matchId: row.id,
                              leftTeam: match.teams[0],
                              rightTeam: match.teams[1],
                              teams,
                            });
                          }}
                          disabled={hasLiveMatch}
                          className={`p-2 flex gap-1 items-center rounded 
      ${
        hasLiveMatch
          ? "cursor-not-allowed bg-gray-200 text-black/30"
          : "cursor-pointer bg-green-500 hover:bg-green-600 text-white"
      }`}
                        >
                          <Play size={16} />
                        </button>
                      )}

                      {status === "live" && (
                        <button
                          className="cursor-pointer text-white bg-orange-500 hover:bg-orange-600 rounded p-2 flex gap-1 items-center"
                          onClick={() => {
                            setSelectedMatchId(row.id);
                            setScoreTeamModalOpen(true);
                          }}
                        >
                          <Gamepad2 size={16} />
                          {/* Start Game */}
                        </button>
                      )}

                      {status === "finished" && (
                        <button
                          className="cursor-pointer text-white bg-purple-600 hover:bg-purple-700 rounded p-2 flex gap-1 items-center"
                          onClick={() => navigate(`/match-stats/${row.id}`)}
                        >
                          <ChartNoAxesColumn size={16} />
                        </button>
                      )}
                    </div>
                  );
                }}
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
            <Button onClick={handleCreateMatch} disabled={creating}>
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
