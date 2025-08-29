import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import UserFormModal from "@/components/modals/userFormModal";
import { getUsers, createUser, updateUser, deleteUser } from "@/services";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal"; // use your existing modal wrapper
import { toast } from "react-hot-toast";
import { Settings, Trash2 } from "lucide-react";
import { auth } from "@/firebase";
import { createAuthUser } from "@/services"; // secondary auth service
import { useAuthState } from "react-firebase-hooks/auth";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // track user to delete
  const [currentUser] = useAuthState(auth);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(Object.entries(data).map(([uid, user]) => ({ uid, ...user })));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.uid, formData);
        toast.success("User updated!");
      } else {
        const user = await createAuthUser(formData.email, formData.password);
        const uid = user.uid;
        await createUser(uid, {
          fullname: formData.fullname,
          role: formData.role,
          email: formData.email,
        });
        toast.success("User added!");
      }
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const confirmDelete = (uid) => {
    if (currentUser?.uid === uid) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setDeleteTarget(uid); // open confirmation modal
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget);
      toast.success("User deleted!");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <Button onClick={openCreateModal}>Add User</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table
          columns={[
            { header: "Full Name", accessor: "fullname" },
            { header: "Email", accessor: "email" },
            { header: "Role", accessor: "role" },
            {
              header: "Actions",
              accessor: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(row)}
                    className="border border-gray-300 rounded p-2 hover:bg-gray-400 hover:text-white cursor-pointer transition-all"
                  >
                    <Settings size={16} />
                  </button>
                  {currentUser?.uid !== row.uid && (
                    <button
                      onClick={() => confirmDelete(row.uid)}
                      className="border border-gray-300 rounded p-2 hover:bg-gray-400 hover:text-white cursor-pointer transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={users}
        />
      )}

      <UserFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingUser || {}}
        onSubmit={handleSubmit}
        mode={editingUser ? "update" : "create"}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              Delete
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to delete this user? This action cannot be undone.</p>
      </Modal>
    </AdminLayout>
  );
}
