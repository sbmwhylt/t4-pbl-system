const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const PRIVATE_KEY = import.meta.env.VITE_IMAGE_KIT_PRIVATE_KEY;

export async function uploadImage(file, fileName) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", fileName);
  formData.append("folder", "/t4-bouldering-system/assets");

  const credentials = btoa(`${PRIVATE_KEY}:`);

  const res = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Image upload failed");
  }

  const data = await res.json();
  return data.url;
}
