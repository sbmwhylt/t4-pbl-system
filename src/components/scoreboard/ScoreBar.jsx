import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import TeamBlock from "./TeamBlock";
import MatchStatus from "./MatchStatus";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString();
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScoreBar() {
  const [scoreData, setScoreData] = useState(null);
  const [matchId, setMatchId] = useState(null);

  // Find the live match
  useEffect(() => {
    const matchesRef = ref(db, "t4_bouldering/matches");
    return onValue(matchesRef, (snapshot) => {
      const matches = snapshot.val() || {};
      const liveMatch = Object.entries(matches).find(
        ([, match]) => match.status === "Live"
      );
      if (liveMatch) {
        setMatchId(liveMatch[0]); // matchId
      } else {
        setMatchId(null);
        setScoreData(null);
      }
    });
  }, []);

  // Listen to scoreboard for the live match
  useEffect(() => {
    if (!matchId) return;
    const scoreRef = ref(db, `scoreboard/${matchId}`);
    return onValue(scoreRef, (snapshot) => {
      setScoreData(snapshot.exists() ? snapshot.val() : null);
    });
  }, [matchId]);

  if (!scoreData) {
    return (
      <div className="flex items-center justify-center w-[900px] h-[80px] bg-gray-700 rounded text-white">
        Waiting for live match data...
      </div>
    );
  }

  const { left, right, period, timeLeft } = scoreData;

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
      <MatchStatus period={period} clock={formatTime(Number(timeLeft) || 0)} />
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
