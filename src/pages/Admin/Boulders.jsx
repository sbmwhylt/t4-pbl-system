import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import AdminLayout from "@/components/layout/AdminLayout";
import Table from "@/components/ui/Table"; 

export default function Boulders() {
  const [boulders, setBoulders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bouldersRef = ref(db, "t4_bouldering/boulders");
    const unsubscribe = onValue(bouldersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBoulders(
          Object.entries(data).map(([id, boulder]) => ({
            id,
            ...boulder,
          }))
        );
      } else {
        setBoulders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Boulders</h2>

      {loading ? (
        <p>Loading...</p>
      ) : boulders.length === 0 ? (
        <p>No boulders found.</p>
      ) : (
        <Table
          columns={[
            { header: "ID", accessor: "id" },
            { header: "Points Zone 1", accessor: "Z1" },
            { header: "Points Zone 2", accessor: "Z2" },
            { header: "Points Top", accessor: "TOP" },
            { header: "Points Top Attempt 2", accessor: "TOP2" },
            { header: "Flash Bonus", accessor: "FLASH" },
          ]}
          data={boulders}
        />
      )}
    </AdminLayout>
  );
}
