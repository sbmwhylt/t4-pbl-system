import { zones, zonesPoints, getZonePoints } from "@/services";

export default function ZoneSelection({
  playerId,
  teamSide,
  selectedBoulder,
  playerBoulderData,
  onZoneClick,
  onZoneReset,
  isAnchor = false,
}) {
  if (!playerId) return null;

  // Extract current boulder data
  const boulderData =
    playerBoulderData?.[teamSide]?.[playerId]?.[selectedBoulder] || {};
  const currentZoneIndex = zones.indexOf(boulderData.currentZone);
  const hasZoneSelected =
    boulderData.currentZone && boulderData.currentZone !== "";
  const attempts = boulderData.attempts || 0;
  const noAttempt = attempts <= 0;

  return (
    <div className="flex flex-col items-center mt-4 w-full">
      <div className="flex gap-3 justify-center items-center w-full">
        {zones.map((zone, idx) => {
          const isCompleted = idx < currentZoneIndex;
          const isCurrent = idx === currentZoneIndex;
          const isDisabled = isCompleted || noAttempt;
          const pts = getZonePoints(zone, isAnchor);
          const hasBonus = isAnchor && pts !== zonesPoints[zone];
          const label = hasBonus ? `${zone} (${pts})` : zone;

          return (
            <button
              key={zone}
              disabled={isDisabled}
              onClick={() =>
                !isDisabled && onZoneClick(teamSide, playerId, zone)
              }
              className={`
                px-4 py-2 rounded font-medium transition-colors w-full
                ${isDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : ""}
                ${!noAttempt && isCurrent ? "bg-blue-500 text-white" : ""}
                ${!isDisabled && !isCurrent ? "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer" : ""}
              `}
            >
              {isCompleted ? "✔" : label}
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
      {/* Attempt status feedback */}
      {noAttempt ? (
        <p className="mt-6 text-md font-medium text-amber-600 bg-amber-100 px-3 py-1.5 rounded animate-pulse">
          Press the attempt button to start scoring
        </p>
      ) : (
        <p className="mt-6 text-md font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded animate-pulse">
          Currently scoring attempt #{attempts}
        </p>
      )}
    </div>
  );
}
