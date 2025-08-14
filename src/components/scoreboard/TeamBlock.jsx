export default function TeamBlock({
  side,
  logo,
  abbreviation,
  score,
  possible,
  player,
}) {
  const isLeft = side === "left";
  const baseClass = "flex items-center w-full h-full";

  return (
    <div className={`${baseClass} ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
      {/* Player name on the far side */}
      <div className="w-24 text-md font-medium text-white text-center truncate">
        {player}
      </div>

      {/* Spacer */}
      <div className="flex-1 bg-black" />

      {/* Possible Score */}
      <div className="w-fit p-3 h-full flex justify-center items-center bg-blue-100 text-black font-bold text-2xl">
        +{possible}
      </div>

      {/* Team Info */}
      <div
        className={`flex items-center gap-2 px-2 ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <img
          src={logo}
          alt={abbreviation}
          className="w-18 h-18 "
        />
        <span className="text-2xl font-semibold">{abbreviation}</span>
      </div>

      {/* Score */}
      <div className="text-4xl font-semibold pl-2 pr-4">{score}</div>
    </div>
  );
}
