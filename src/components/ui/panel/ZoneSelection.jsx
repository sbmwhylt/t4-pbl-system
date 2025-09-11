import { zones } from "@/services";

export default function ZoneSelection({
  playerId,
  teamSide,
  selectedBoulder,
  playerBoulderData,
  onZoneClick,
  onZoneReset, // Add this prop for reset functionality
}) {
  if (!playerId) return null;

  // Extract current boulder data
  const boulderData =
    playerBoulderData?.[teamSide]?.[playerId]?.[selectedBoulder] || {};
  const currentZoneIndex = zones.indexOf(boulderData.currentZone);
  const hasZoneSelected = boulderData.currentZone && boulderData.currentZone !== "";

  return (
    <div className="flex flex-col items-center mt-4 w-full">
      <div className="flex gap-3 justify-center items-center w-full">
        {zones.map((zone, idx) => {
          const isCompleted = idx < currentZoneIndex;
          const isCurrent = idx === currentZoneIndex;

          return (
            <button
              key={zone}
              disabled={isCompleted}
              onClick={() => !isCompleted && onZoneClick(teamSide, playerId, zone)}
              className={`
                px-4 py-2 rounded font-medium transition-colors w-full 
                ${isCompleted ? "bg-gray-200 text-gray-400 cursor-not-allowed" : ""}
                ${isCurrent ? "bg-blue-500 text-white" : ""}
                ${!isCompleted && !isCurrent ? "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer" : ""}
              `}
            >
              {isCompleted ? "✔" : zone}
            </button>
          );
        })}
        
        {/* Reset Button */}
        {hasZoneSelected && (
          <button
            onClick={() => onZoneReset(teamSide, playerId)}
            className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 transition-colors cursor-pointer"
            title="Reset zone selection"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}