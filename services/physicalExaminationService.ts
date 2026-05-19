import { apiRequest } from "./api";

export interface PhysicalExaminationPayload {
  rontgen_id: number;
  blood_pressure?: string | null;
  height?: number | null;
  weight?: number | null;
  pulse?: number | null;
  respiration?: number | null;
  temperature?: number | null;
}

/**
 * Ambil data pemeriksaan fisik berdasarkan rontgen_id.
 * Route: GET /admin/physical-examinations/{rontgenId}
 */
export const getPhysicalExamination = async (rontgenId: number) => {
  return await apiRequest(
    `/admin/physical-examinations/${rontgenId}`,
    "GET",
    null,
    true,
  );
};

/**
 * Simpan ATAU update pemeriksaan fisik.
 * Backend pakai updateOrCreate(rontgen_id) — jadi POST ini
 * berlaku untuk create maupun update, tidak perlu PUT terpisah.
 * Route: POST /admin/physical-examinations
 *
 * Dipakai di: UploadFotoPasien & ExamDetails (mode edit).
 */
export const savePhysicalExamination = async (
  payload: PhysicalExaminationPayload,
) => {
  return await apiRequest(
    "/admin/physical-examinations",
    "POST",
    payload,
    true,
  );
};

// ── Alias agar import lama tidak perlu diubah ──────────────────
export const createPhysicalExamination = savePhysicalExamination;

/**
 * Alias update — tetap terima examId agar ExamDetails
 * tidak perlu direfactor, tapi tetap panggil POST
 * karena route PUT tidak terdaftar di backend.
 */
export const updatePhysicalExamination = (
  _examId: number,
  payload: Partial<PhysicalExaminationPayload> & { rontgen_id: number },
) => savePhysicalExamination(payload as PhysicalExaminationPayload);

/**
 * Helper: konversi state form UI → payload API.
 */
export const buildPhysicalPayload = (
  rontgenId: number,
  form: {
    tekananDarah: string;
    tinggiBadan: string;
    beratBadan: string;
    nadi: string;
    respirasi: string;
    suhu: string;
  },
): PhysicalExaminationPayload => ({
  rontgen_id: rontgenId,
  blood_pressure: form.tekananDarah || null,
  height: form.tinggiBadan ? parseInt(form.tinggiBadan) : null,
  weight: form.beratBadan ? parseInt(form.beratBadan) : null,
  pulse: form.nadi ? parseInt(form.nadi) : null,
  respiration: form.respirasi ? parseInt(form.respirasi) : null,
  temperature: form.suhu ? parseFloat(form.suhu) : null,
});

/**
 * Cek apakah ada nilai di form pemeriksaan fisik.
 */
export const hasPhysicalData = (form: {
  tekananDarah: string;
  tinggiBadan: string;
  beratBadan: string;
  nadi: string;
  respirasi: string;
  suhu: string;
}): boolean =>
  !!(
    form.tekananDarah ||
    form.tinggiBadan ||
    form.beratBadan ||
    form.nadi ||
    form.respirasi ||
    form.suhu
  );
