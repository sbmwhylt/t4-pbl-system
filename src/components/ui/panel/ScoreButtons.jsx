export default function ScoreButtons({ onPlus1, onPlus2, onMinus1, onClear }) {
  const baseBtn =
    "px-6 py-3 w-full rounded-md text-xl text-white transition-colors hover:opacity-90 cursor-pointer";
  return (
    <div className="flex gap-3 mt-8">
      <button onClick={onPlus1} className={`${baseBtn} bg-blue-400`}>
        +1
      </button>
      <button onClick={onPlus2} className={`${baseBtn} bg-blue-500`}>
        +2
      </button>
      <button onClick={onMinus1} className={`${baseBtn} bg-red-500`}>
        -1
      </button>
      <button onClick={onClear} className={`${baseBtn} bg-gray-400`}>
        Clear
      </button>
    </div>
  );
}
