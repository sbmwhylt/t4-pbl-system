import React from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function PlayerSelection({ players, selectedPlayer, onSelectPlayer }) {
  return (
    <Card>
      <h2 className="font-semibold mb-2">Players</h2>
      <div className="grid grid-cols-5 gap-2">
        {players.map((player) => (
          <Button
            key={player.id}
            className={`p-2 rounded-lg text-md ${
              selectedPlayer === player.id
                ? "bg-red-600 text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => onSelectPlayer(player.id)}
          >
            {player.jersey_number} - {player.name}
          </Button>
        ))}
      </div>
    </Card>
  );
}
