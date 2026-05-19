import { apiRequest } from "./api";

export type FaceType = "symmetric" | "asymmetric";
export type NormalAbnormal = "normal" | "abnormal";
export type PalpableType = "palpable" | "not_palpable";
export type PresentAbsent = "present" | "absent";

export interface ExtraOralExaminationPayload {
  rontgen_id: number;
  face?: FaceType | null;
  facial_skin_neck?: NormalAbnormal | null;
  lymph_nodes?: PalpableType | null;
  temporomandibular_joint?: NormalAbnormal | null;
  muscle_mass?: NormalAbnormal | null;
  facial_swelling?: PresentAbsent | null;
  eyes_nose?: NormalAbnormal | null;
}

/**
 * Ambil data extra oral berdasarkan rontgen_id.
 * Route: GET /admin/extra-oral-examinations/{rontgenId}
 */
export const getExtraOralExamination = async (rontgenId: number) => {
  return await apiRequest(
    `/admin/extra-oral-examinations/${rontgenId}`,
    "GET",
    null,
    true,
  );
};

/**
 * Simpan ATAU update extra oral.
 * Backend pakai updateOrCreate(rontgen_id) — POST ini
 * berlaku untuk create maupun update, tidak perlu PUT terpisah.
 * Route: POST /admin/extra-oral-examinations
 *
 * Dipakai di: UploadFotoPasien & ExamDetails (mode edit).
 */
export const saveExtraOralExamination = async (
  payload: ExtraOralExaminationPayload,
) => {
  return await apiRequest(
    "/admin/extra-oral-examinations",
    "POST",
    payload,
    true,
  );
};

// ── Alias agar import lama tidak perlu diubah ──────────────────
export const createExtraOralExamination = saveExtraOralExamination;

/**
 * Alias update — tetap terima examId agar ExamDetails
 * tidak perlu direfactor, tapi tetap panggil POST
 * karena route PUT tidak terdaftar di backend.
 */
export const updateExtraOralExamination = (
  _examId: number,
  payload: Partial<ExtraOralExaminationPayload> & { rontgen_id: number },
) => saveExtraOralExamination(payload as ExtraOralExaminationPayload);

// ── Helper konversi UI ↔ DB ────────────────────────────────────

/**
 * Konversi state extraOral (label Indonesia di UI)
 * ke payload enum yang diterima API.
 */
export const mapExtraOralToPayload = (
  extraOral: Record<string, string>,
): Omit<ExtraOralExaminationPayload, "rontgen_id"> => ({
  face: extraOral.wajah === "Simetris" ? "symmetric" : "asymmetric",
  facial_skin_neck: extraOral.kulit === "Normal" ? "normal" : "abnormal",
  lymph_nodes: extraOral.limfa === "Teraba" ? "palpable" : "not_palpable",
  temporomandibular_joint: extraOral.tmj === "Normal" ? "normal" : "abnormal",
  muscle_mass: extraOral.massaOtot === "Normal" ? "normal" : "abnormal",
  facial_swelling: extraOral.pembengkakan === "Ada" ? "present" : "absent",
  eyes_nose: extraOral.mataHidung === "Normal" ? "normal" : "abnormal",
});

/**
 * Konversi nilai enum dari API ke label UI (Indonesia).
 * Dipakai di ExamDetails saat memuat data dari fetchDetail.
 */
export const mapPayloadToExtraOral = (eo: {
  face?: string;
  facial_skin_neck?: string;
  lymph_nodes?: string;
  temporomandibular_joint?: string;
  muscle_mass?: string;
  facial_swelling?: string;
  eyes_nose?: string;
}): Record<string, string> => ({
  wajah: eo.face === "symmetric" ? "Simetris" : "Asimetris",
  kulit: eo.facial_skin_neck === "normal" ? "Normal" : "Tidak normal",
  limfa: eo.lymph_nodes === "palpable" ? "Teraba" : "Tidak teraba",
  tmj: eo.temporomandibular_joint === "normal" ? "Normal" : "Tidak normal",
  massaOtot: eo.muscle_mass === "normal" ? "Normal" : "Tidak normal",
  pembengkakan: eo.facial_swelling === "present" ? "Ada" : "Tidak ada",
  mataHidung: eo.eyes_nose === "normal" ? "Normal" : "Tidak normal",
});
