import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
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
          newAttempt
        );
      }
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center justify-center">
      <div className="flex gap-10 items-center">
        {/* Attempt Calendar */}
        <div className="grid grid-cols-15 gap-1">
          {[...Array(maxAttempts)].map((_, i) => {
            const num = i + 1; // display starts at 1
            const isActive = attempt === num;
            const isPast = num < attempt;

            return (
              <div
                key={num}
                className={`w-8 h-8 flex items-center justify-center rounded-full font-medium text-sm
                  ${
                    isActive
                      ? "bg-green-400 text-white"
                      : isPast
                      ? "opacity-40"
                      : ""
                  }`}
              >
                {num}
              </div>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleChange(-1)}
            disabled={attempt <= 0}
            className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-colors cursor-pointer
      ${
        attempt <= 0
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
      }
    `}
          >
            <ArrowLeft size={24} />
          </button>

          <button
            onClick={() => handleChange(1)}
            disabled={attempt >= maxAttempts}
            className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-colors cursor-pointer
      ${
        attempt >= maxAttempts
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }
    `}
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
