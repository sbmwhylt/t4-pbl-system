import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import TeamBlock from "./TeamBlock";
import MatchStatus from "./MatchStatus";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString();
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScoreBar() {
  const [scoreData, setScoreData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(450);
  const [period, setPeriod] = useState("1ST");
  const [clockRunning, setClockRunning] = useState(false);
  const [matchId, setMatchId] = useState(null);

  // Find live match
  useEffect(() => {
    const matchesRef = ref(db, "t4_bouldering/matches");
    return onValue(matchesRef, (snapshot) => {
      const matches = snapshot.val() || {};
      const liveMatch = Object.entries(matches).find(
        ([, match]) => match.status.toLowerCase() === "live"
      );
      if (liveMatch) {
        setMatchId(liveMatch[0]);
      } else {
        setMatchId(null);
        setScoreData(null);
        setTimeRemaining(450);
        setPeriod("1ST");
        setClockRunning(false);
      }
    });
  }, []);

  // Listen to scoreboard
  useEffect(() => {
    if (!matchId) return;
    const scoreRef = ref(db, `t4_bouldering/scoreboard/${matchId}`);
    return onValue(scoreRef, (snapshot) => {
      setScoreData(snapshot.exists() ? snapshot.val() : null);
    });
  }, [matchId]);

  // Listen to live_status for timer, period, and running state
  useEffect(() => {
    if (!matchId) return;

    const liveStatusRef = ref(db, `t4_bouldering/live_status/${matchId}`);
    return onValue(liveStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTimeRemaining(data.time_remaining ?? 450);
      setPeriod(data.period || "1ST");
      setClockRunning(data.clock_running ?? false);
    });
  }, [matchId]);

  // Countdown timer
  useEffect(() => {
    if (!matchId || !clockRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        update(ref(db, `t4_bouldering/live_status/${matchId}`), {
          time_remaining: next >= 0 ? next : 0,
        });
        return next >= 0 ? next : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchId, clockRunning, timeRemaining]);

  if (!scoreData) {
    return (
      <div className="flex items-center justify-center w-[900px] h-[80px] bg-gray-700 rounded text-white">
        Waiting for live match data...
      </div>
    );
  }

  const { left, right } = scoreData;

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
      <MatchStatus period={period} clock={formatTime(timeRemaining)} />
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
