import { apiRequest } from "./api";

// ── List & detail ──────────────────────────────────────────────

/** Ambil list rontgen. Route: GET /admin/rontgens */
export const getRontgenList = async (status?: string) => {
  const query = status ? `?status=${status}` : "";
  return await apiRequest(`/admin/rontgens${query}`, "GET", null, true);
};

/**
 * Ambil detail rontgen beserta semua relasi:
 * patient, doctor, examination_images,
 * physical_examination, extra_oral_examination, tags.
 * Route: GET /admin/rontgens/{id}
 */
export const getRontgenDetail = async (id: number) => {
  return await apiRequest(`/admin/rontgens/${id}`, "GET", null, true);
};

// ── Upload foto (UploadFotoPasien — pertama kali) ──────────────

/**
 * Upload foto ke rontgen yang sudah ada.
 * Menggunakan POST + _method=PUT (method spoofing Laravel).
 * Route: PUT /admin/rontgens/{id}  (via POST + _method)
 *
 * Dipakai di: UploadFotoPasien
 */
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

      formData.append(`images[${index}]`, { uri, name: filename, type } as any);
      formData.append(
        `image_types[${index}]`,
        sectionKey === "rontgen_xray" ? "xray" : sectionKey,
      );
      index++;
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

// ── Update rontgen (ExamDetails mode edit) ─────────────────────

/**
 * Update rontgen tanpa foto — hanya field detail/notes.
 * Route: PUT /admin/rontgens/{id}
 */
export const updateRontgenDetail = async (
  rontgenId: number,
  detail: string,
) => {
  return await apiRequest(
    `/admin/rontgens/${rontgenId}`,
    "PUT",
    { detail },
    true,
  );
};

/**
 * Update rontgen dengan foto baru dan/atau penghapusan foto lama.
 * Menggunakan POST + _method=PUT (method spoofing).
 *
 * Logika foto:
 * - URI yang dimulai "http"  → foto LAMA yang masih dipertahankan
 *   → dikirim sebagai existing_images[] agar backend tidak menghapusnya
 * - URI lokal (bukan http)   → foto BARU dari kamera/galeri
 *   → dikirim sebagai file binary images[]
 * - Foto yang sudah dihapus user TIDAK ada di allPhotos sama sekali
 *   → backend otomatis menghapusnya karena tidak ada di existing_images[]
 *
 * Flag _update_photos=1 wajib ada agar backend tahu ini operasi update foto
 * meskipun semua foto dihapus (loop tidak jalan → tanpa flag backend skip).
 */
export const updateRontgenWithPhotos = async (
  rontgenId: number,
  allPhotos: Record<string, string[]>,
  detail: string,
) => {
  const formData = new FormData();
  formData.append("_method", "PUT");
  formData.append("detail", detail);
  formData.append("_update_photos", "1"); // ← wajib: sinyal ke backend ini operasi update foto

  let existingIndex = 0;
  let newIndex = 0;

  for (const [sectionKey, uris] of Object.entries(allPhotos)) {
    for (const uri of uris) {
      if (uri === "placeholder") continue;

      if (uri.startsWith("http")) {
        // Foto lama yang masih dipertahankan user
        formData.append(`existing_images[${existingIndex}]`, uri);
        formData.append(`existing_image_types[${existingIndex}]`, sectionKey);
        existingIndex++;
      } else {
        // Foto baru dari kamera/galeri
        const filename = uri.split("/").pop() || `photo_${newIndex}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append(`images[${newIndex}]`, {
          uri,
          name: filename,
          type,
        } as any);
        formData.append(`image_types[${newIndex}]`, sectionKey);
        newIndex++;
      }
    }
  }

  return await apiRequest(
    `/admin/rontgens/${rontgenId}`,
    "POST",
    formData,
    true,
  );
};

// ── Referensi ──────────────────────────────────────────────────

/** Ambil daftar dokter. Route: GET /admin/doctors */
export const getDokterList = async () => {
  return await apiRequest("/admin/doctors", "GET", null, true);
};

/** Ambil daftar tag. Route: GET /admin/tags */
export const getTagList = async () => {
  return await apiRequest("/admin/tags", "GET", null, true);
};
