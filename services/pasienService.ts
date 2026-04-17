import { apiRequest } from "./api";

// Ambil daftar pasien hadir hari ini
export const getPasienHadir = async () => {
  const today = new Date().toISOString().split("T")[0];
  return await apiRequest(
    `/admin/reservations?date=${today}&status=validated`,
    "GET",
    null,
    true,
  );
};

// Buat rontgen baru untuk pasien (saat pertama kali ubah status)
export const createRontgen = async (
  patientId: number,
  doctorId: number,
  status: string,
) => {
  return await apiRequest(
    "/admin/rontgens",
    "POST",
    {
      patient_id: patientId,
      doctor_id: doctorId,
      status,
    },
    true,
  );
};

// Update status rontgen yang sudah ada
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

// Cek apakah pasien sudah punya rontgen hari ini
export const getRontgenByPatient = async (patientId: number) => {
  return await apiRequest(
    `/admin/rontgens?patient_id=${patientId}`,
    "GET",
    null,
    true,
  );
};
