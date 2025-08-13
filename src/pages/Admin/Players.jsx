import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import AdminLayout from "../../components/layout/AdminLayout";
import Table from "../../components/ui/Table"; // assuming this is where your Table component is

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamsRef = ref(db, "t4_bouldering/teams");
    const playersRef = ref(db, "t4_bouldering/players");

    let teamsData = {};
    let playersData = [];

    const unsubscribeTeams = onValue(teamsRef, (snapshot) => {
      const data = snapshot.val() || {};
      teamsData = data;
      setTeams(data);
      if (playersData.length) setLoading(false);
    });

    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      playersData = Object.entries(data).map(([id, player]) => ({
        id,
        ...player,
      }));
      setPlayers(playersData);
      if (Object.keys(teamsData).length) setLoading(false);
    });

    return () => {
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Players</h2>

      {loading ? (
        <p>Loading...</p>
      ) : players.length === 0 ? (
        <p>No players found.</p>
      ) : (
        <Table
          columns={[
            { header: "ID", accessor: "id" },
            { header: "Name", accessor: "name" },
            { header: "Jersey Number", accessor: "jersey_number" },
            {
              header: "Team",
              accessor: (row) => teams[row.team_id]?.name || "Unknown Team",
            },
          ]}
          data={players}
        />
      )}
    </AdminLayout>
  );
}
