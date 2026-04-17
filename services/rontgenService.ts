import { apiRequest } from "./api";

// Ambil list rontgen dengan filter status
export const getRontgenList = async (status?: string) => {
  const query = status ? `?status=${status}` : "";
  return await apiRequest(`/admin/rontgens${query}`, "GET", null, true);
};

// Ambil detail rontgen
export const getRontgenDetail = async (id: number) => {
  return await apiRequest(`/admin/rontgens/${id}`, "GET", null, true);
};

// Upload foto ke rontgen yang sudah ada
export const uploadFotoRontgen = async (
  rontgenId: number,
  capturedPhotos: Record<string, string[]>,
  doctorId: number,
  detail: string,
  tagIds: number[],
) => {
  const formData = new FormData();
  formData.append("_method", "PUT");
  formData.append("doctor_id", String(doctorId));
  formData.append("detail", detail);
  formData.append("status", "selesai");

  let index = 0;
  for (const [sectionKey, uris] of Object.entries(capturedPhotos)) {
    for (const uri of uris) {
      const filename = uri.split("/").pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append(`images[${index}]`, {
        uri,
        name: filename,
        type,
      } as any);
      formData.append(
        `image_types[${index}]`,
        sectionKey === "rontgen_xray" ? "xray" : sectionKey,
      );
    }
  }

  tagIds.forEach((id, i) => {
    formData.append(`tag_ids[${i}]`, String(id));
  });

  return await apiRequest(
    `/admin/rontgens/${rontgenId}`,
    "POST",
    formData,
    true,
  );
};

// Ambil daftar dokter
export const getDokterList = async () => {
  return await apiRequest("/admin/doctors", "GET", null, true);
};

// Ambil daftar tags
export const getTagList = async () => {
  return await apiRequest("/admin/tags", "GET", null, true);
};
