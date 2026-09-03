import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { updatePlayerAttempt } from "@/services";

export default function AttemptButtons({
  matchId,
  side,
  playerId,
  selectedBoulder,
  playerBoulderData,
  maxAttempts = 20,
}) {
  const [attempt, setAttempt] = useState(0); // internal starts at 0

  useEffect(() => {
    const boulderAttempts =
      playerBoulderData?.[side]?.[playerId]?.[selectedBoulder]?.attempts || 0;
    setAttempt(boulderAttempts);
  }, [playerBoulderData, playerId, selectedBoulder, side]);

  const handleChange = async (delta) => {
    let newAttempt = attempt + delta;
    newAttempt = Math.min(Math.max(0, newAttempt), maxAttempts); // clamp 0..max

    if (newAttempt !== attempt) {
      setAttempt(newAttempt);

      // Only update if attempt > 0
      if (newAttempt > 0) {
        await updatePlayerAttempt(
          matchId,
          side,
          playerId,
          selectedBoulder,
          newAttempt,
        );
      }
    }
  };

  const atMin = attempt <= 0;
  const atMax = attempt >= maxAttempts;

  return (
    <div
      className={`rounded-xl p-2.5 transition-colors ${
        atMin ? "bg-amber-50 ring-1 ring-amber-200" : "bg-gray-50 ring-1 ring-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Attempt
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-bold tabular-nums leading-none ${
                atMin ? "text-amber-500" : "text-gray-900"
              }`}
            >
              {atMin ? "–" : attempt}
            </span>
            {/* The attempt number caps what the boulder can still be worth */}
            {!atMin && (
              <span className="text-xs font-semibold text-gray-400">
                max {attempt <= 1 ? 6 : attempt === 2 ? 5 : 4} pts
              </span>
            )}
          </div>
        </div>

        {/* Big, thumb-sized steppers */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleChange(-1)}
            disabled={atMin}
            aria-label="Previous attempt"
            className={`w-14 h-14 grid place-items-center rounded-xl transition-all cursor-pointer ${
              atMin
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100 active:scale-95"
            }`}
          >
            <Minus size={24} />
          </button>
          <button
            onClick={() => handleChange(1)}
            disabled={atMax}
            aria-label="Next attempt"
            className={`h-14 px-6 grid place-items-center rounded-xl font-bold transition-all cursor-pointer ${
              atMax
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : atMin
                  ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-sm"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm"
            }`}
          >
            <Plus size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
