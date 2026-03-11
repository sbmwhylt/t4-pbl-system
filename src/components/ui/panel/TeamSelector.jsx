import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";

export default function TeamSelector({ label, teams, value, onChange, locked, onLockToggle }) {
  const [selectedTeamId, setSelectedTeamId] = useState(value?.id || "");

  useEffect(() => {
    setSelectedTeamId(value?.id || "");
  }, [value]); // Update internal state when parent changes `value`

  const handleChange = (e) => {
    if (locked) return;
    const team = teams.find((t) => t.id === e.target.value) || null;
    setSelectedTeamId(e.target.value);
    onChange?.(team);
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <select
          className={`flex-1 rounded-lg border px-3 py-2 text-base ${
            locked
              ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-100 border-gray-300"
          }`}
          value={selectedTeamId}
          onChange={handleChange}
          disabled={locked}
        >
          <option value="">-</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <button
          onClick={(e) => { e.stopPropagation(); onLockToggle?.(); }}
          className={`p-1.5 rounded transition-colors ${
            locked
              ? "text-orange-500 hover:text-orange-700"
              : "text-gray-400 hover:text-gray-600"
          }`}
          title={locked ? "Unlock team" : "Lock team"}
        >
          {locked ? <Lock size={18} /> : <Unlock size={18} />}
        </button>

        {selectedTeam?.logo_url && (
          <img
            src={selectedTeam.logo_url}
            alt={selectedTeam.name}
            className="w-10 h-10 rounded ml-1"
          />
        )}
      </div>
    </div>
  );
}
