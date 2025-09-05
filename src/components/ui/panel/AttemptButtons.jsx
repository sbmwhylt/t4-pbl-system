import { useState, useEffect } from "react";
import { updatePlayerAttempt } from "@/services";
import { StepForward, StepBack } from "lucide-react";

export default function AttemptButtons({
  matchId,
  side,
  playerId,
  currentAttempt = 1,
  maxAttempts = 20,
}) {
  const [attempt, setAttempt] = useState(currentAttempt);

  // Sync with Firebase-provided attempt
  useEffect(() => {
    setAttempt(currentAttempt || 1);
  }, [currentAttempt, playerId]);

  const handleChange = async (delta) => {
    const newAttempt = Math.min(Math.max(1, attempt + delta), maxAttempts);
    if (newAttempt !== attempt) {
      setAttempt(newAttempt);
      await updatePlayerAttempt(matchId, side, playerId, newAttempt);
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center justify-center">
      <h1 className="mb-6 text-lg font-semibold text-center">
        Player Attempts
      </h1>

      <div className="flex gap-10 items-center">
        {/* Left: Attempt "calendar" */}
        <div className="grid grid-cols-10 gap-3">
          {[...Array(maxAttempts)].map((_, i) => {
            const num = i + 1;
            const isActive = attempt === num;
            const isPast = num < attempt;

            return (
              <div
                key={num}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold text-sm
                  ${
                    isActive
                      ? "bg-green-500 text-white"
                      : isPast
                      ? "bg-gray-300 opacity-50"
                      : "bg-gray-200"
                  }
                `}
              >
                {num}
              </div>
            );
          })}
        </div>

        {/* Right: Navigation buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleChange(-1)}
            disabled={attempt <= 1}
            className={`px-3 py-3 rounded-lg font-semibold text-lg
              ${
                attempt <= 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-300 text-gray-600 hover:bg-gray-400"
              }
            `}
          >
            <StepBack size={28} />
          </button>
          <button
            onClick={() => handleChange(1)}
            disabled={attempt >= maxAttempts}
            className={`px-3 py-3 rounded-lg font-semibold text-lg
              ${
                attempt >= maxAttempts
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }
            `}
          >
            <StepForward size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
