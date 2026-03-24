import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useState, useEffect, useRef } from "react";
import { uploadImage } from "@/services/imagekit/imageUpload";
import { ImagePlus, X, Loader2, Check } from "lucide-react";
import TEAM_COLORS from "@/constants/teamColors";

export default function TeamFormModal({
  isOpen,
  onClose,
  initialData = {},
  onSubmit,
  mode = "create",
}) {
  const [formData, setFormData] = useState({ name: "", logo_url: "", color: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === "update" && initialData) {
      setFormData({ name: initialData.name || "", logo_url: initialData.logo_url || "", color: initialData.color || "" });
      setImagePreview(initialData.logo_url || null);
    } else if (mode === "create") {
      setFormData({ name: "", logo_url: "", color: "" });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [initialData, mode, isOpen]);

  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => applyFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    applyFile(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, logo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    try {
      setUploading(true);
      let logo_url = formData.logo_url;

      if (imageFile) {
        const safeName = `${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
        logo_url = await uploadImage(imageFile, safeName);
      }

      await onSubmit({ ...formData, logo_url });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add Team" : "Edit Team"}
      footer={
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Uploading...
              </span>
            ) : mode === "create" ? (
              "Add"
            ) : (
              "Update"
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Team Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Color Picker */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Team Color</label>
          <div className="grid grid-cols-8 gap-2">
            {TEAM_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.id })}
                className={`w-full aspect-square rounded-lg ${color.gradient} transition-all cursor-pointer flex items-center justify-center ${
                  formData.color === color.id
                    ? `ring-2 ${color.ring} ring-offset-2 scale-110`
                    : "hover:scale-105"
                }`}
                title={color.name}
              >
                {formData.color === color.id && (
                  <Check size={14} className="text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Team Logo</label>

          {imagePreview ? (
            /* Preview state */
            <div className="relative w-full rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
              <img
                src={imagePreview}
                alt="Logo preview"
                className="w-full h-40 object-contain p-4"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white border border-gray-300 rounded-full p-1 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-200 bg-white transition-colors"
              >
                Click to replace
              </button>
            </div>
          ) : (
            /* Drop zone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }`}
            >
              <ImagePlus size={28} className="text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG up to 10MB</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </Modal>
  );
}
