import { useState } from "react";
import { updatePlayerAttempt } from "@/services";

export default function AttemptButtons({
  matchId,
  side,
  playerId,
  currentAttempt,
}) {
  const [attempt, setAttempt] = useState(currentAttempt || 1);

  const handleClick = async (num) => {
    setAttempt(num);
    await updatePlayerAttempt(matchId, side, playerId, num);
  };

  return (
    <div className="mt-6 flex items-center justify-center flex-col ">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-center">Player Attempts</h1>
      </div>
      <div className="grid grid-cols-7 gap-6 items-center justify-cente w-full">
        {[...Array(21)].map((_, i) => {
          const num = i + 1;
          const isActive = attempt === num;

          return (
            <button
              key={num}
              onClick={() => handleClick(num)}
              disabled={num < attempt}
              className={`w-18 h-18 flex items-center justify-center rounded-lg font-semibold transition-colors text-xl text-center
                ${
                  isActive
                    ? "bg-green-500 text-white border-none"
                    : "bg-gray-300 hover:bg-gray-300"
                }
                ${num < attempt ? "opacity-40 cursor-not-allowed" : ""}
                `}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
