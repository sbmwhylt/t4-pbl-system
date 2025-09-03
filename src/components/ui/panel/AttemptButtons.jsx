import { updatePlayerAttempt } from "@/services";

export default function AttemptButtons({
  matchId,
  side,
  playerId,
  currentAttempt = 1,
}) {
  const handleClick = async (num) => {
    await updatePlayerAttempt(matchId, side, playerId, num);
  };

  return (
    <div className="mt-6 flex items-center justify-center flex-col">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-center">Player Attempts</h1>
      </div>
      <div className="grid grid-cols-7 gap-6 w-full justify-items-center">
        {[...Array(21)].map((_, i) => {
          const num = i + 1;
          const isActive = currentAttempt === num;

          return (
            <button
              key={num}
              onClick={() => handleClick(num)}
              disabled={num < currentAttempt}
              className={`w-16 h-16 flex items-center justify-center rounded-lg font-semibold transition-colors text-xl
                ${
                  isActive
                    ? "bg-green-500 text-white border-none"
                    : "bg-gray-300 hover:bg-gray-400"
                }
                ${num < currentAttempt ? "opacity-40 cursor-not-allowed" : ""}
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
