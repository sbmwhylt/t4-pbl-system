import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useState, useEffect } from "react";

export default function UserFormModal({
  isOpen,
  onClose,
  initialData = {},
  onSubmit,
  mode = "create", // 'create' or 'update'
}) {
  const [formData, setFormData] = useState({
    fullname: "",
    role: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (mode === "update" && initialData) {
      // Only pre-fill data when editing
      setFormData({ ...initialData, password: "" });
    } else if (mode === "create") {
      // Reset form for new user
      setFormData({
        fullname: "",
        role: "",
        email: "",
        password: "",
      });
    }
  }, [initialData, mode]);

  const handleSubmit = async () => {
    if (
      !formData.fullname ||
      !formData.role ||
      (mode === "create" && !formData.password)
    ) {
      return;
    }
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add User" : "Edit User"}
      footer={
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "create" ? "Add" : "Update"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Full Name"
          value={formData.fullname}
          onChange={(e) =>
            setFormData({ ...formData, fullname: e.target.value })
          }
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={mode === "update"} // usually you don't allow changing Auth email here
        />
        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          options={[
            { value: "", label: "Select role", disabled: true },
            { value: "admin", label: "Admin" },
            { value: "user", label: "User" },
            { value: "moderator", label: "Moderator" },
          ]}
        />
        {mode === "create" && (
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        )}
      </div>
    </Modal>
  );
}
