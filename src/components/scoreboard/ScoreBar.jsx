import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
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
  const [scoreData, setScoreData] = useState({ left: {}, right: {} });
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
        ([, match]) => match.status?.toLowerCase() === "live"
      );

      if (liveMatch) setMatchId(liveMatch[0]);
      else {
        setMatchId(null);
        setScoreData({ left: {}, right: {} });
        setTimeRemaining(450);
        setPeriod("1ST");
        setClockRunning(false);
      }
    });
  }, []);

  // Listen to scoreboard and auto-assign teams
  useEffect(() => {
    if (!matchId) return;

    const scoreRef = ref(db, `scoreboard/${matchId}`);

    const unsubscribe = onValue(scoreRef, async (snapshot) => {
      let data = snapshot.val() || {};
      console.log("Scoreboard snapshot:", data);

      let leftTeam = data.left;
      let rightTeam = data.right;

      if (!leftTeam || !rightTeam) {
        console.log("Left or right team missing, fetching match teams...");

        // Fetch match info
        const matchSnap = await new Promise((res) =>
          onValue(ref(db, `t4_bouldering/matches/${matchId}`), (s) => res(s), {
            onlyOnce: true,
          })
        );
        const match = matchSnap.val() || {};
        console.log("Match data fetched:", match);

        const teamIds = match.teams || [];

        if (teamIds.length >= 2) {
          console.log("Fetching full team info for left and right teams...");

          // Fetch full team data in parallel
          const [leftSnap, rightSnap] = await Promise.all([
            new Promise((res) =>
              onValue(
                ref(db, `t4_bouldering/teams/${teamIds[0]}`),
                (s) => res(s),
                { onlyOnce: true }
              )
            ),
            new Promise((res) =>
              onValue(
                ref(db, `t4_bouldering/teams/${teamIds[1]}`),
                (s) => res(s),
                { onlyOnce: true }
              )
            ),
          ]);

          leftTeam = {
            ...leftSnap.val(),
            score: 0,
            possible: 0,
            current_player: "",
            jersey: "",
          };
          rightTeam = {
            ...rightSnap.val(),
            score: 0,
            possible: 0,
            current_player: "",
            jersey: "",
          };

          console.log("Left team:", leftTeam);
          console.log("Right team:", rightTeam);

          // Persist assignment in scoreboard
          await update(ref(db, `scoreboard/${matchId}`), {
            left: leftTeam,
            right: rightTeam,
          });
          console.log("Scoreboard updated with assigned teams");
        }
      } else {
        console.log("Left and right teams already assigned:", {
          leftTeam,
          rightTeam,
        });
      }

      setScoreData({ left: leftTeam, right: rightTeam });
    });

    return () => unsubscribe();
  }, [matchId]);

  // Listen to live_status for timer, period, and running state
  useEffect(() => {
    if (!matchId) return;

    const liveStatusRef = ref(db, `t4_bouldering/live_status/${matchId}`);
    const unsubscribe = onValue(liveStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTimeRemaining(data.time_remaining ?? 450);
      setPeriod(data.period || "1ST");
      setClockRunning(data.clock_running ?? false);
    });

    return () => unsubscribe();
  }, [matchId]);

  // Countdown timer
  useEffect(() => {
    if (!matchId || !clockRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev - 1 >= 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [matchId, clockRunning, timeRemaining]);

  const { left, right } = scoreData;

  if (!matchId) {
    return (
      <div className="flex items-center justify-center w-[900px] h-[80px] bg-[#5f8bbb] rounded overflow-hidden text-white">
        <span className="text-xl font-bold">No live match</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-[900px] h-[80px] bg-[#5f8bbb] rounded overflow-hidden text-white">
      <TeamBlock
        side="left"
        logo={left.logo_url|| null}
        abbreviation={left.abbreviation || ""}
        score={Number(left.score) || 0}
        possible={Number(left.possible) || 0}
        player={`${left.jersey ?? ""} ${left.current_player ?? ""}`}
      />
      <MatchStatus period={period} clock={formatTime(timeRemaining)} />
      <TeamBlock
        side="right"
        logo={right.logo_url || null}
        abbreviation={right.abbreviation || ""}
        score={Number(right.score) || 0}
        possible={Number(right.possible) || 0}
        player={`${right.jersey ?? ""} ${right.current_player ?? ""}`}
      />
    </div>
  );
}
