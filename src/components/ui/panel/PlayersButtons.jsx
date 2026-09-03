export default function PlayerButtons({
  players = [],
  activePlayerId,
  onSelect,
}) {
  if (!players.length) {
    return (
      <div className="py-8 text-center text-gray-400 font-medium">
        No active players for this team
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
        Player
      </p>
      {/* Two rows on narrow tablets, one row once there's width — keeps every
          target comfortably wide instead of squeezing 6 names onto one line. */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          const name = player.first_name
            ? `${player.first_name} ${player.last_name || ""}`.trim()
            : player.last_name || player.name;

          return (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              aria-pressed={isActive}
              className={`min-h-[68px] px-2 py-2 rounded-xl font-semibold transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? "bg-gray-900 text-white shadow-md ring-2 ring-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 ring-1 ring-gray-200"
              }`}
            >
              {player.jersey_number ? (
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    isActive ? "text-white/60" : "text-gray-400"
                  }`}
                >
                  #{player.jersey_number}
                </span>
              ) : null}
              <span className="text-sm leading-tight text-center line-clamp-2">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
