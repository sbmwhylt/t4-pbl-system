import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  addPlayer,
  updatePlayer,
  deletePlayer,
} from "@/services";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { Settings, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    jersey_number: "",
    team_id: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 10;

  // Load data from Firebase
  useEffect(() => {
    const teamsRef = ref(db, "t4_bouldering/teams");
    const playersRef = ref(db, "t4_bouldering/players");

    let teamsData = {};
    let playersData = [];

    const unsubscribeTeams = onValue(teamsRef, (snapshot) => {
      const data = snapshot.val() || {};
      teamsData = data;
      setTeams(data);
      if (playersData.length) setLoading(false);
    });

    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      playersData = Object.entries(data).map(([id, player]) => ({
        id,
        ...player,
      }));
      setPlayers(playersData);
      if (Object.keys(teamsData).length) setLoading(false);
    });

    return () => {
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, []);

  // Filtered & sorted players
  const filteredPlayers = players
    .filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((player) => (teamFilter ? player.team_id === teamFilter : true))
    .sort((a, b) => b.id.localeCompare(a.id)); // latest first

  // Pagination calculations
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingPlayer(null);
    setFormData({ name: "", jersey_number: "", team_id: "" });
    setShowModal(true);
  };

  const openEditModal = (player) => {
    setEditingPlayer(player.id);
    setFormData({
      name: player.name,
      jersey_number: player.jersey_number,
      team_id: player.team_id,
    });
    setShowModal(true);
  };

  const openDeleteModal = (playerId) => {
    setPlayerToDelete(playerId);
    setShowDeleteModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.team_id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      if (editingPlayer) {
        await updatePlayer(editingPlayer, formData);
        toast.success("Player updated successfully!");
      } else {
        await addPlayer(formData);
        toast.success("Player added successfully!");
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;
    try {
      await deletePlayer(playerToDelete);
      toast.success("Player deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete player.");
    } finally {
      setShowDeleteModal(false);
      setPlayerToDelete(null);
    }
  };

  return (
    <AdminLayout>
      {/* Header with search/filter/add */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 w-full">
        <h2 className="text-2xl font-bold">Players</h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset page on search
            }}
            className="border border-gray-300 bg-white rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
          <Select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              setCurrentPage(1); // reset page on filter
            }}
            options={[
              { value: "", label: "All Teams" },
              ...Object.entries(teams).map(([id, team]) => ({
                value: id,
                label: team.name,
              })),
            ]}
            className="border border-gray-300 rounded p-2 text-lg outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
          />
          <Button onClick={openCreateModal}>Add Player</Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredPlayers.length === 0 ? (
        <p>No players found.</p>
      ) : (
        <>
          <Table
            columns={[
              { header: "ID", accessor: "id", sortable: true },
              { header: "Name", accessor: "name", sortable: true },
              { header: "Player Number", accessor: "jersey_number", sortable: true },
              {
                header: "Team",
                accessor: (row) => {
                  const team = teams[row.team_id];
                  if (team && team.logo_url) {
                    return (
                      <div className="flex items-center gap-2">
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="w-6 h-6"
                        />
                        <span>{team.name}</span>
                      </div>
                    );
                  }
                  return "Unknown Team";
                },
                sortable: true,
              },
              {
                header: "Status",
                accessor: (row) => (
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={row.status === "active"}
                      onChange={async () => {
                        try {
                          const newStatus =
                            row.status === "active" ? "inactive" : "active";

                          // Count active players in the same team
                          const activeCount = players.filter(
                            (p) =>
                              p.team_id === row.team_id && p.status === "active"
                          ).length;

                          if (newStatus === "active" && activeCount >= 5) {
                            toast.error("Max 5 active players per team");
                            return;
                          }

                          await updatePlayer(row.id, { status: newStatus });
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to update status");
                        }
                      }}
                    />
                    <div
                      className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500
      after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 
      after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full`}
                    ></div>
                  </label>
                ),
              },
              {
                header: "Actions",
                accessor: (row) => (
                  <div className="flex gap-3">
                    <button
                      className="border border-gray-300 rounded p-2 hover:bg-gray-400 hover:text-white cursor-pointer transition-all"
                      onClick={() => openEditModal(row)}
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      className="border border-gray-300 rounded p-2 hover:bg-gray-400 hover:text-white cursor-pointer transition-all"
                      onClick={() => openDeleteModal(row.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={paginatedPlayers}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {/* Prev button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => goToPage(i + 1)}
                  className={`px-3 py-1 rounded border border-gray-300 hover:bg-gray-200 ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              {/* Next button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlayer ? "Edit Player" : "Add Player"}
        footer={
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlayer ? "Update" : "Add"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Player Number"
            type="number"
            value={formData.jersey_number}
            onChange={(e) =>
              setFormData({ ...formData, jersey_number: e.target.value })
            }
          />
          <Select
            label="Team"
            name="team_id"
            value={formData.team_id}
            onChange={(e) =>
              setFormData({ ...formData, team_id: e.target.value })
            }
            options={[
              { value: "", label: "-", disabled: true },
              ...Object.entries(teams).map(([id, team]) => ({
                value: id,
                label: team.name,
              })),
            ]}
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        footer={
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to delete this player?</p>
      </Modal>
    </AdminLayout>
  );
}
