// teamSelectModal.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import Modal from "@/components/ui/Modal";
import { useUser } from "../../context/UserContext";

export default function TeamSelectModal({ matchId, userId, isOpen, onClose }) {
  const user = useUser();
  const [teams, setTeams] = useState({ left: {}, right: {} });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!matchId || !isOpen) return;
    const r = ref(db, `scoreboard/${matchId}/teams`);
    const unsub = onValue(r, (snap) => setTeams(snap.val() || {}));
    return () => unsub();
  }, [matchId, isOpen]);

  const selectTeam = async (side) => {
    if (!userId || isSubmitting) return;
    
    setIsSubmitting(true);
    const team = teams[side];
    
    try {
      // Check if team already has a scorer
      if (team?.scorer && team.scorer !== userId) {
        setSelectedTeam(side);
        setTimeout(() => setSelectedTeam(null), 2000); // Clear feedback after 2 seconds
        return;
      }
      
      // Update the team with the current user as scorer
      await update(ref(db, `scoreboard/${matchId}/teams/${side}`), {
        scorer: userId,
      });
      
      onClose(); // close modal after selecting
    } catch (error) {
      console.error("Error selecting team:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Team to Score">
      <div className="flex flex-col gap-3 mt-4">
        {["left", "right"].map((side) => {
          const team = teams[side];
          const isTaken = team?.scorer && team.scorer !== userId;
          const isCurrentUser = team?.scorer === userId;

          return (
            <div key={side} className="relative">
              <button
                onClick={() => selectTeam(side)}
                disabled={isTaken || isSubmitting}
                className={`w-full p-4 rounded text-white transition-colors ${
                  isTaken
                    ? "bg-gray-400 cursor-not-allowed"
                    : isCurrentUser
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                } ${isSubmitting ? "cursor-wait" : "cursor-pointer"}`}
              >
                {team?.name || side.toUpperCase()}
                {isTaken && " (Taken)"}
                {isCurrentUser && " (Your Team)"}
                {isSubmitting && " (Processing...)"}
              </button>
              
              {selectedTeam === side && isTaken && (
                <div className="text-red-500 text-sm mt-1 text-center">
                  This team is already being scored by another user.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}   