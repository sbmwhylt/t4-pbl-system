export default function PlayerButtons({
  players = [],
  activePlayerId,
  onSelect,
  teamColor = "blue",
}) {
  // Show up to 5 placeholders if no players exist yet
  const displayPlayers = players.length
    ? players
    : Array.from({ length: 5 }, (_, i) => ({
        id: `placeholder-${i}`,
        name: "Player",
        jersey_number: "--",
      }));

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {displayPlayers.map((player) => {
        const isActive = player.id === activePlayerId; // compare to the active player
        const activeClass =
          teamColor === "blue"
            ? "bg-black/90 text-white hover:bg-opacity-70"
            : "bg-black/90 text-white hover:bg-opacity-70";
        return (
          <button
            key={player.id}
            onClick={() => players.length && onSelect(player)}
            className={`p-2 rounded text-lg font-semibold w-full transition-colors cursor-pointer border border-gray-400 ${
              players.length
                ? isActive
                  ? activeClass
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {player.name} #{player.jersey_number}
          </button>
        );
      })}
    </div>
  );
}
