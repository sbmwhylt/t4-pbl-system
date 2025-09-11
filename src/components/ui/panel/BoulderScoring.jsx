import { useEffect, useState } from "react";
import { boulders, zones, initPlayerBoulders, resetBoulder, setPlayerZone, getPlayerBoulders, calculateTeamScore } from "@/services";

const BoulderScoring = ({ matchId, teams }) => {
  const [selectedBoulder, setSelectedBoulder] = useState("A");
  const [playerData, setPlayerData] = useState({ left: {}, right: {} });
  const [teamScores, setTeamScores] = useState({ left: 0, right: 0 });

  // Initialize boulders for all players
  useEffect(() => {
    async function init() {
      for (let side of ["left", "right"]) {
        for (let playerId in teams[side].players) {
          await initPlayerBoulders(matchId, side, playerId);
        }
      }
      await loadData();
    }
    init();
  }, [matchId, teams]);

  const loadData = async () => {
    const data = { left: {}, right: {} };
    for (let side of ["left", "right"]) {
      for (let playerId in teams[side].players) {
        data[side][playerId] = await getPlayerBoulders(matchId, side, playerId);
      }
    }
    setPlayerData(data);

    // Update team scores
    setTeamScores({
      left: calculateTeamScore(teams.left.players),
      right: calculateTeamScore(teams.right.players)
    });
  };

  const handleBoulderChange = async (boulder) => {
    setSelectedBoulder(boulder);
    for (let side of ["left", "right"]) {
      for (let playerId in teams[side].players) {
        await resetBoulder(matchId, side, playerId, boulder);
      }
    }
    await loadData();
  };

  const handleZoneClick = async (teamSide, playerId, zone) => {
    await setPlayerZone(matchId, teamSide, playerId, selectedBoulder, zone);
    await loadData();
  };

  return (
    <div>
      {/* Boulder Selection */}
      <div style={{ marginBottom: "1rem" }}>
        {boulders.map(b => (
          <button
            key={b}
            onClick={() => handleBoulderChange(b)}
            style={{ fontWeight: b === selectedBoulder ? "bold" : "normal", marginRight: "0.5rem" }}
          >
            Boulder {b}
          </button>
        ))}
      </div>

      {/* Player Tables */}
      {["left", "right"].map(side => (
        <div key={side} style={{ marginBottom: "2rem" }}>
          <h3>{teams[side].name} (Score: {teamScores[side]})</h3>
          <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "center" }}>
            <thead>
              <tr>
                <th>Player</th>
                {zones.map(z => <th key={z}>{z}</th>)}
                <th>Points</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(teams[side].players).map(([playerId, player]) => {
                const bData = playerData[side][playerId]?.[selectedBoulder] || {};
                const currentZoneIndex = zones.indexOf(bData.currentZone);

                return (
                  <tr key={playerId}>
                    <td>{player.name}</td>
                    {zones.map((zone, idx) => (
                      <td key={zone}>
                        <button
                          disabled={idx < currentZoneIndex}
                          onClick={() => handleZoneClick(side, playerId, zone)}
                        >
                          {idx < currentZoneIndex ? "✔" : zone}
                        </button>
                      </td>
                    ))}
                    <td>{bData.points || 0}</td>
                    <td>{bData.attempts || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default BoulderScoring;
