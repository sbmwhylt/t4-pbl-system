export default function MatchStatus({ period, clock }) {
  return (
    <div className="flex flex-col items-center justify-center w-fit p-5 h-full bg-[#2F3E4E]">
      <div className="text-sm font-semibold uppercase">{period}</div>
      <div className="w-full border-t-2 border-red-600 my-2 opacity-50"></div>
      <div className="text-2xl font-mono">{clock}</div>
    </div>
  );
}
