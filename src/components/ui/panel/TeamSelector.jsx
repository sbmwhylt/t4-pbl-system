import { useEffect, useState } from "react";

export default function TeamSelector({ label, teams, value, onChange }) {
  const [selectedTeamId, setSelectedTeamId] = useState(value?.id || "");

  useEffect(() => {
    setSelectedTeamId(value?.id || "");
  }, [value]); // Update internal state when parent changes `value`

  const handleChange = (e) => {
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
          className="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-lg"
          value={selectedTeamId}
          onChange={handleChange}
        >
          <option value="">-</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

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
