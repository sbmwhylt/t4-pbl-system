import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  addPlayer,
  updatePlayer,
  deletePlayer,
} from "../../services/playerService";
import { db } from "../../firebase";
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
    if (!formData.name || !formData.jersey_number || !formData.team_id) {
      toast.error("Please fill in all fields.");
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Players</h2>
        <Button onClick={openCreateModal}>Add Player</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : players.length === 0 ? (
        <p>No players found.</p>
      ) : (
        <Table
          columns={[
            { header: "ID", accessor: "id" },
            { header: "Name", accessor: "name" },
            { header: "Jersey", accessor: "jersey_number" },
            {
              header: "Team",
              accessor: (row) => teams[row.team_id]?.name || "Unknown Team",
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
          data={players}
        />
      )}

      {/* Modal with Select */}
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
            label="Jersey Number"
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
            options={Object.entries(teams).map(([id, team]) => ({
              value: id,
              label: team.name,
            }))}
          />
        </div>
      </Modal>

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
