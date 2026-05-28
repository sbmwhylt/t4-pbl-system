export default function PlayerButtons({
  players = [],
  activePlayerId,
  onSelect,
  teamColor = "blue",
}) {
  if (!players.length) {
    return (
      <div className="mt-4 text-center text-gray-500 font-semibold tracking-wide">
        Choose a team to show players
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 grid grid-cols-5 gap-3">
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          const activeClass =
            teamColor === "blue"
              ? "bg-black/90 text-white hover:bg-opacity-70"
              : "bg-black/90 text-white hover:bg-opacity-70";

          return (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className={`p-2 rounded text-md font-medium w-full transition-colors cursor-pointer  ${
                isActive
                  ? activeClass
                  : "bg-gray-300 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {player.first_name ? `${player.first_name} ${player.last_name || ""}`.trim() : (player.last_name || player.name)}
              {player.jersey_number ? ` #${player.jersey_number}` : ""}
            </button>
          );
        })}
      </div>
    </>
  );
}
