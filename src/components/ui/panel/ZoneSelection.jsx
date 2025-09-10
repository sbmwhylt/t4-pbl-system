import { zones } from "@/services";

export default function ZoneSelection({
  playerId,
  teamSide,
  selectedBoulder,
  playerBoulderData,
  onZoneClick,
}) {
  if (!playerId) return null;

  // Extract current boulder data
  const boulderData =
    playerBoulderData?.[teamSide]?.[playerId]?.[selectedBoulder] || {};
  const currentZoneIndex = zones.indexOf(boulderData.currentZone);

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
      </div>
    </div>
  );
}
