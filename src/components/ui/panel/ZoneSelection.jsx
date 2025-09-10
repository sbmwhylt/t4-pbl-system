// components/ui/panel/ZoneSelection.jsx
import React from "react";
import { zones } from "@/services";

export default function ZoneSelection({
  playerId,
  teamSide,
  selectedBoulder,
  playerBoulderData,
  onZoneClick,
}) {
  if (!playerId) return null;

  const currentZoneIndex =
    zones.indexOf(
      playerBoulderData?.[teamSide]?.[playerId]?.[selectedBoulder]?.currentZone
    ) || -1;

  return (
    <div className="flex gap-2 justify-center flex-wrap mt-4">
      {zones.map((zone, idx) => (
        <button
          key={zone}
          disabled={idx < currentZoneIndex}
          onClick={() => onZoneClick(teamSide, playerId, zone)}
          className={`px-4 py-2 rounded-md transition-colors ${
            idx < currentZoneIndex
              ? "bg-gray-400 text-white"
              : "bg-blue-500 text-white hover:bg-blue-700"
          }`}
        >
          {idx < currentZoneIndex ? "✔" : zone}
        </button>
      ))}
      <div className="w-full text-center mt-2">
        Points:{" "}
        {playerBoulderData?.[teamSide]?.[playerId]?.[selectedBoulder]?.points ||
          0}{" "}
        | Attempts:{" "}
        {playerBoulderData?.[teamSide]?.[playerId]?.[selectedBoulder]?.attempts ||
          0}
      </div>
    </div>
  );
}
