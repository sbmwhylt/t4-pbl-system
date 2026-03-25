import { useEffect, useState } from "react";
import { Lock, Unlock, ChevronDown } from "lucide-react";

export default function TeamSelector({
  label,
  teams,
  value,
  onChange,
  locked,
  onLockToggle,
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(value?.id || "");

  useEffect(() => {
    setSelectedTeamId(value?.id || "");
  }, [value]);

  const handleChange = (e) => {
    if (locked) return;
    const team = teams.find((t) => t.id === e.target.value) || null;
    setSelectedTeamId(e.target.value);
    onChange?.(team);
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            className={`w-full appearance-none rounded-lg border pl-3 pr-8 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              locked
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-300 text-gray-800 hover:border-gray-400 cursor-pointer"
            }`}
            value={selectedTeamId}
            onChange={handleChange}
            disabled={locked}
          >
            <option value="">Select team...</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {onLockToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle?.();
            }}
            className={`p-2 rounded-lg transition-colors ${
              locked
                ? "bg-orange-50 text-orange-500 hover:bg-orange-100"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            title={locked ? "Unlock team" : "Lock team"}
          >
            {locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        )}

        {selectedTeam?.logo_url && (
          <img
            src={selectedTeam.logo_url}
            alt={selectedTeam.name}
            className="w-12 h-12 rounded-lg object-cover "
          />
        )}
      </div>
    </div>
  );
}
