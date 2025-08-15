import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import Card from "../ui/Card";

export default function MatchInfo({ team, matchId }) {
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const [teams, setTeams] = useState({ left: {}, right: {} });

  useEffect(() => {
    const scoreboardRef = ref(db, `t4_bouldering/scoreboard/${matchId}`);
    return onValue(scoreboardRef, (snap) => {
      const data = snap.val() || {};
      setScores({
        left: data.left?.score || 0,
        right: data.right?.score || 0,
      });
      setTeams({
        left: data.left || {},
        right: data.right || {},
      });
    });
  }, [matchId]);

  return (
    <div className="flex items-center justify-between">
      {/* Team Info */}
      <div className="flex items-center space-x-4">
        {team?.team_logo ? <img src={team.team_logo} alt="Team Logo" /> : null}
        <div>
          <h1 className="text-3xl font-bold">{team?.name || "Loading..."}</h1>
          <p className="text-gray-500">Match ID: {matchId}</p>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="flex space-x-6 text-center">
        <div>
          <h2 className="text-2xl font-semibold">{scores.left}</h2>
          <p className="text-gray-500">{teams.left.abbreviation || "N/A"}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{scores.right}</h2>
          <p className="text-gray-500">{teams.right.abbreviation || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}
