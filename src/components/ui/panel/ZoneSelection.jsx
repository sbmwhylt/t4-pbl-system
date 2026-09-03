import { Check, RotateCcw } from "lucide-react";
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
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Zone
        </p>
        {hasZoneSelected && (
          <button
            onClick={() => onZoneReset(teamSide, playerId)}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
            title="Reset zone selection"
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {/* Zone tiles — big touch targets showing what each is worth */}
      <div className="grid grid-cols-5 gap-2">
        {zones.map((zone, idx) => {
          const isCompleted = idx < currentZoneIndex;
          const isCurrent = idx === currentZoneIndex && !noAttempt;
          const isDisabled = isCompleted || noAttempt;
          const pts = getZonePoints(zone, isAnchor);
          const hasBonus = isAnchor && pts !== zonesPoints[zone];

          return (
            <button
              key={zone}
              disabled={isDisabled}
              onClick={() => !isDisabled && onZoneClick(teamSide, playerId, zone)}
              className={`relative min-h-[76px] rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                isCompleted
                  ? "bg-green-100 text-green-600 ring-1 ring-green-200 cursor-not-allowed"
                  : noAttempt
                    ? "bg-gray-100 text-gray-300 ring-1 ring-gray-200 cursor-not-allowed"
                    : isCurrent
                      ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 cursor-pointer active:scale-[0.97]"
                      : "bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50 hover:ring-gray-400 cursor-pointer active:scale-[0.97]"
              }`}
            >
              {isCompleted ? (
                <Check size={26} strokeWidth={3} />
              ) : (
                <>
                  <span className="text-base leading-none">{zone}</span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      isCurrent
                        ? "text-white/70"
                        : noAttempt
                          ? "text-gray-300"
                          : hasBonus
                            ? "text-amber-600"
                            : "text-gray-400"
                    }`}
                  >
                    {pts} pt{pts === 1 ? "" : "s"}
                  </span>
                </>
              )}
              {hasBonus && !isCompleted && (
                <span className="absolute top-1 right-1 text-[10px]">⚓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Attempt status feedback */}
      <div
        className={`mt-2 text-center text-sm font-semibold px-3 py-2 rounded-lg ${
          noAttempt
            ? "text-amber-700 bg-amber-100"
            : "text-green-700 bg-green-100"
        }`}
      >
        {noAttempt
          ? "Press + to start attempt 1 — zones unlock after that"
          : `Scoring attempt #${attempts}`}
      </div>
    </div>
  );
}
