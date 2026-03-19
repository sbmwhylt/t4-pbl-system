import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TeamFormModal from "@/components/modals/teamFormModal";
import { Users, Swords, Star, Settings, Trash2 } from "lucide-react";
import { getTeamWins, getTeamPlayersCount, getTeamMatches } from "@/services";
import { addTeam, updateTeam, deleteTeam } from "@/services";
import { toast } from "react-hot-toast";
import { getGradientById } from "@/constants/teamColors";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamWins, setTeamWins] = useState({});
  const [teamPlayersCount, setTeamPlayersCount] = useState({});
  const [teamMatches, setTeamMatches] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // ---------------- get teams ----------------

  useEffect(() => {
    const teamsRef = ref(db, "t4_bouldering/teams");
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formatted = Object.entries(data).map(([id, team]) => ({
          id,
          ...team,
        }));
        setTeams(formatted);
      } else {
        setTeams([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------------- get wins + players + matches ----------------

  useEffect(() => {
    async function fetchData() {
      const wins = await getTeamWins();
      const counts = await getTeamPlayersCount();
      const matches = await getTeamMatches();
      setTeamWins(wins);
      setTeamPlayersCount(counts);
      setTeamMatches(matches);
    }
    fetchData();
  }, []);

  // ---------------- handlers ----------------

  const openCreateModal = () => {
    setEditingTeam(null);
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setShowModal(true);
  };

  const openDeleteModal = (team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, formData);
        toast.success("Team updated successfully!");
      } else {
        await addTeam(formData);
        toast.success("Team added successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeam(teamToDelete.id);
      toast.success("Team deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete team.");
    } finally {
      setShowDeleteModal(false);
      setTeamToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Teams</h2>
        <Button onClick={openCreateModal}>Add Team</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : teams.length === 0 ? (
        <p>No teams found</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {teams.map((team) => {
            const wins = teamWins[team.id] || 0;
            const playerCount = teamPlayersCount[team.id] || 0;
            const matchesPlayed = teamMatches[team.id] || 0;

            return (
              <div
                key={team.id}
                className="relative bg-white shadow-md rounded-lg p-6 grid grid-cols-2 items-center overflow-hidden"
              >
                {/* Color bar */}
                {team.color && (
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${getGradientById(team.color).gradient}`} />
                )}
                {/* Background logo */}
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="absolute top-1/2 left-30 w-[130%] h-[130%] -translate-x- -translate-y-1/2 object-contain opacity-75 pointer-events-none select-none"
                />

                {/* Text content */}
                <div className="relative flex flex-col items-start justify-center gap-4 z-10 pl-2">
                  <div>
                    <h3 className="text-2xl font-semibold">{team.name}</h3>
                    <div className="flex gap-2 items-center">
                      <p className="text-gray-500">
                        ID: <span className="font-semibold">{team.id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2 w-full">
                    <div className="flex gap-2 items-center">
                      <Users className="inline-block" size={18} />
                      <p>
                        Players:{" "}
                        <span className="font-semibold">{playerCount}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Swords className="inline-block" size={18} />
                      <p>
                        Matches:{" "}
                        <span className="font-semibold">{matchesPlayed}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Star
                        className="inline-block text-yellow-500"
                        size={18}
                        fill="currentColor"
                      />
                      <p>
                        Wins: <span className="font-semibold">{wins}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="border border-gray-300 rounded p-2 hover:bg-gray-400 hover:text-white cursor-pointer transition-all"
                      onClick={() => openEditModal(team)}
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      className="border border-gray-300 rounded p-2 hover:bg-red-500 hover:text-white cursor-pointer transition-all"
                      onClick={() => openDeleteModal(team)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <TeamFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingTeam || {}}
        onSubmit={handleSubmit}
        mode={editingTeam ? "update" : "create"}
      />

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        footer={
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{teamToDelete?.name}</span>?
        </p>
      </Modal>
    </AdminLayout>
  );
}
