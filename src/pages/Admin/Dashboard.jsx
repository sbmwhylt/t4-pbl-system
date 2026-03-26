import AdminLayout from "./../../components/layout/AdminLayout";
import PlayerRankings from "./components/playerRankings";
import TeamRankings from "./components/teamRankings";

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        <div className=" p-6 rounded-lg border border-gray-200">
          <TeamRankings />
        </div>
        <div className=" p-6 rounded-lg border border-gray-200"></div>
      </div>
      <div className="mt-6">
        <div className="p-6 rounded-lg border border-gray-200">
          <PlayerRankings />
        </div>
      </div>
    </AdminLayout>
  );
}
