import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { ChartNoAxesColumn } from "lucide-react";
import Table from "@/components/ui/Table";
import { matchesService, teamService } from "@/services";

function isMultiTeamMatch(match) {
  const teams = match.teams || {};
  return !teams.left && !teams.right && Object.keys(teams).length > 0;
}

function formatTeams(match) {
  const teams = match.teams || {};
  if (teams.left && teams.right) {
    return `${teams.left.name} vs ${teams.right.name}`;
  }
  const names = Object.values(teams)
    .map((t) => t.name || t.id || "?")
    .join(", ");
  return names || "N/A";
}

export default function Matches() {
  const [setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ------------------- Load teams

  useEffect(() => {
    const unsubTeams = teamService.subscribeTeams(setTeams);
    return () => unsubTeams();
  }, []);

  // ------------------- Load matches

  useEffect(() => {
    const unsubscribe = matchesService.getMatches(setMatches, setLoading);
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4">Matches</h2>
      </div>

      <div className="space-y-4">
        {Object.entries(matches).length === 0 && <p>No matches found.</p>}
        {Object.entries(matches).length > 0 && (
          <Table
            columns={[
              { header: "Match ID", accessor: "id" },
              {
                header: "Type",
                accessor: (row) =>
                  isMultiTeamMatch(row) ? "Multi-Team" : "Standard",
              },
              {
                header: "Teams",
                accessor: (row) => formatTeams(row),
              },
              {
                header: "Date",
                accessor: (row) =>
                  row.start_time
                    ? new Date(row.start_time).toLocaleString()
                    : "N/A",
              },
            ]}
            data={Object.entries(matches)
              .map(([matchId, match]) => ({ id: matchId, ...match }))
              .filter((m) => m.status?.toLowerCase() === "finished")
              .sort((a, b) => b.start_time - a.start_time)}
            actions={(row) => (
              <div className="flex gap-2 justify-end items-center">
                <button
                  className="cursor-pointer text-white bg-purple-600 hover:bg-purple-700 rounded p-2 flex gap-1 items-center"
                  onClick={() =>
                    isMultiTeamMatch(row)
                      ? navigate(`/admin/multi-match-stats/${row.id}`)
                      : navigate(`/match-stats/${row.id}`)
                  }
                >
                  <ChartNoAxesColumn size={16} />
                </button>
              </div>
            )}
          />
        )}
      </div>
    </AdminLayout>
  );
}
