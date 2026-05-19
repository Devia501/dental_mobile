import { apiRequest } from "./api";

export const getPasienHadir = async () => {
  const today = new Date().toISOString().split("T")[0];
  return await apiRequest(
    `/admin/reservations?date=${today}&status=validated`,
    "GET",
    null,
    true,
  );
};

/**
 * Buat rontgen baru untuk pasien.
 * PENTING: target_foto wajib dikirim agar tab rontgen bisa tampilkan
 * jenis foto yang diminta dokter (rontgen_xray, profil_gigi, intraoral).
 */
export const createRontgen = async (
  patientId: number,
  doctorId: number,
  status: string,
  targetFoto?: string[], // ← TAMBAHAN: array key jenis foto
) => {
  return await apiRequest(
    "/admin/rontgens",
    "POST",
    {
      patient_id: patientId,
      doctor_id: doctorId,
      status,
      // Kirim sebagai string CSV agar mudah di-split saat fetch
      ...(targetFoto && targetFoto.length > 0
        ? { target_foto: targetFoto.join(",") }
        : {}),
    },
    true,
  );
};

export const updateStatusRontgen = async (
  rontgenId: number,
  status: string,
) => {
  return await apiRequest(
    `/admin/rontgens/${rontgenId}`,
    "PUT",
    { status },
    true,
  );
};

export const getRontgenByPatient = async (patientId: number) => {
  return await apiRequest(
    `/admin/rontgens?patient_id=${patientId}`,
    "GET",
    null,
    true,
  );
};

// pasienService.ts - tambah fungsi baru
export const updateTargetFotoRontgen = async (
  rontgenId: number,
  status: string,
  targetFoto?: string[],
) => {
  return await apiRequest(
    `/admin/rontgens/${rontgenId}`,
    "PUT",
    {
      status,
      ...(targetFoto && targetFoto.length > 0
        ? { target_foto: targetFoto.join(",") }
        : {}),
    },
    true,
  );
};
