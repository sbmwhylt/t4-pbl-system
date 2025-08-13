import TeamBlock from "../../components/ui//TeamBlock";
import MatchStatus from "../../components/ui//MatchStatus"; // also fixed typo

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString();
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScoreBar() {
  // Temporary dummy data
  const left = {
    team_logo: "/logos/team-left.png",
    abbreviation: "LFT",
    score: 12,
    possible: 5,
    jersey: 7,
    current_player: "Alice",
  };

  const right = {
    team_logo: "/logos/team-right.png",
    abbreviation: "RGT",
    score: 10,
    possible: 3,
    jersey: 9,
    current_player: "Bob",
  };

  const period = "1ST";
  const timeLeft = 450; // 7:30

  return (
    <div className="flex items-center justify-center w-[900px] h-[80px] bg-[#5f8bbb] rounded overflow-hidden text-white">
      <TeamBlock
        side="left"
        logo={left.team_logo}
        abbreviation={left.abbreviation}
        score={Number(left.score) || 0}
        possible={Number(left.possible) || 0}
        player={`${left.jersey ?? ""} ${left.current_player ?? ""}`}
      />

      <MatchStatus period={period} clock={formatTime(timeLeft)} />

      <TeamBlock
        side="right"
        logo={right.team_logo}
        abbreviation={right.abbreviation}
        score={Number(right.score) || 0}
        possible={Number(right.possible) || 0}
        player={`${right.jersey ?? ""} ${right.current_player ?? ""}`}
      />
    </div>
  );
}
