import React from "react";  
import Card from "../ui/Card";

export default function MatchInfo({ team, matchId }) {
  return (
    <Card variant="primary" className="">
      <h1 className="text-xl font-bold">{team?.name || "Loading..."}</h1>
      <p className="text-gray-500">Match ID: {matchId}</p>
    </Card>
  );
}
