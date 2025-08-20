import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { ref, get } from "firebase/database";
import { db } from "../../firebase";

export default function MatchStats() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const snap = await get(ref(db, `t4_bouldering/matches/${matchId}`));
        if (snap.exists()) setMatch(snap.val());
      } catch (err) {
        console.error("Failed to fetch match:", err);
      } finally {
        setLoading(false);
      }
    }

    if (matchId) fetchMatch();
  }, [matchId]);

  if (loading) return <AdminLayout>Loading…</AdminLayout>;
  if (!match) return <AdminLayout>No match found</AdminLayout>;

  const { teams, start_time, status } = match;

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Match Statistics</h2>

      <div className="flex justify-between items-center mb-6">
        <p className="text-lg">
          Status: <span className="font-semibold">{status}</span>
        </p>
        <p className="text-lg">
          Date:{" "}
          <span className="font-semibold">
            {start_time ? new Date(start_time).toLocaleString() : "N/A"}
          </span>
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {["left", "right"].map((side) => (
          <div
            key={side}
            className="p-6 rounded-xl bg-white flex items-center justify-center"
          >
            <h3 className="text-2xl font-bold mb-4">{teams[side].name}</h3>
            <p className="text-6xl font-extrabold text-purple-600">
              {teams[side].score}
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
