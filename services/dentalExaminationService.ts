import { apiRequest } from "./api";

// ─────────────────────────────────────────────
//  Tipe data sesuai tabel dental_examinations
// ─────────────────────────────────────────────
export interface DentalExaminationPayload {
  rontgen_id: number;
  visit_number: number;
  visit_date?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  planning?: string | null;
  treatment?: string | null;
  foto_before?: string | null;
  foto_after?: string | null;
}

/**
 * Ambil semua kunjungan (SOAP) berdasarkan rontgen_id.
 * Response backend sudah menyertakan foto_before_url & foto_after_url
 * per kunjungan melalui relasi dental_examination_id.
 */
export const getDentalExaminations = async (rontgenId: number) => {
  return await apiRequest(
    `/admin/dental-examinations?rontgen_id=${rontgenId}`,
    "GET",
    null,
    true,
  );
};

/**
 * Simpan satu kunjungan baru (SOAP) beserta foto jika ada.
 */
export const createDentalExamination = async (
  payload: DentalExaminationPayload,
) => {
  const formData = new FormData();

  formData.append("rontgen_id", String(payload.rontgen_id));
  formData.append("visit_number", String(payload.visit_number));
  if (payload.visit_date) formData.append("visit_date", payload.visit_date);
  if (payload.subjective) formData.append("subjective", payload.subjective);
  if (payload.objective) formData.append("objective", payload.objective);
  if (payload.assessment) formData.append("assessment", payload.assessment);
  if (payload.planning) formData.append("planning", payload.planning);
  if (payload.treatment) formData.append("treatment", payload.treatment);

  // Foto hanya dikirim jika URI lokal (bukan http — bukan foto lama dari server)
  if (payload.foto_before && !payload.foto_before.startsWith("http")) {
    const filename = payload.foto_before.split("/").pop() || "foto_before.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("foto_before", {
      uri: payload.foto_before,
      name: filename,
      type,
    } as any);
  }

  if (payload.foto_after && !payload.foto_after.startsWith("http")) {
    const filename = payload.foto_after.split("/").pop() || "foto_after.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("foto_after", {
      uri: payload.foto_after,
      name: filename,
      type,
    } as any);
  }

  return await apiRequest("/admin/dental-examinations", "POST", formData, true);
};

/**
 * Update kunjungan yang sudah ada.
 * Foto hanya dikirim jika user memilih foto baru (URI lokal).
 * Foto lama (http://...) tidak perlu dikirim — backend tidak menyentuh
 * foto lama kecuali ada foto baru yang dikirim.
 */
export const updateDentalExamination = async (
  examId: number,
  payload: Partial<Omit<DentalExaminationPayload, "rontgen_id">>,
) => {
  const formData = new FormData();
  formData.append("_method", "PUT");

  if (payload.visit_date !== undefined)
    formData.append("visit_date", payload.visit_date ?? "");
  if (payload.subjective !== undefined)
    formData.append("subjective", payload.subjective ?? "");
  if (payload.objective !== undefined)
    formData.append("objective", payload.objective ?? "");
  if (payload.assessment !== undefined)
    formData.append("assessment", payload.assessment ?? "");
  if (payload.planning !== undefined)
    formData.append("planning", payload.planning ?? "");
  if (payload.treatment !== undefined)
    formData.append("treatment", payload.treatment ?? "");

  // Kirim foto hanya jika URI lokal (foto baru yang dipilih user)
  if (payload.foto_before && !payload.foto_before.startsWith("http")) {
    const filename = payload.foto_before.split("/").pop() || "foto_before.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("foto_before", {
      uri: payload.foto_before,
      name: filename,
      type,
    } as any);
  }

  if (payload.foto_after && !payload.foto_after.startsWith("http")) {
    const filename = payload.foto_after.split("/").pop() || "foto_after.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("foto_after", {
      uri: payload.foto_after,
      name: filename,
      type,
    } as any);
  }

  return await apiRequest(
    `/admin/dental-examinations/${examId}`,
    "POST",
    formData,
    true,
  );
};

/**
 * Simpan semua kunjungan sekaligus (batch).
 * - Ada examId  → update
 * - Tidak ada   → create baru
 */
export const saveDentalExaminationsBatch = async (
  rontgenId: number,
  kunjunganList: Array<{
    examId?: number | null;
    visit_number: number;
    visit_date?: string | null;
    subjective?: string;
    objective?: string;
    assessment?: string;
    planning?: string;
    treatment?: string;
    fotoBefore?: string;
    fotoAfter?: string;
  }>,
) => {
  const requests = kunjunganList.map((k) => {
    if (k.examId) {
      return updateDentalExamination(k.examId, {
        visit_date: k.visit_date || null,
        subjective: k.subjective || null,
        objective: k.objective || null,
        assessment: k.assessment || null,
        planning: k.planning || null,
        treatment: k.treatment || null,
        foto_before: k.fotoBefore || null,
        foto_after: k.fotoAfter || null,
      });
    } else {
      return createDentalExamination({
        rontgen_id: rontgenId,
        visit_number: k.visit_number,
        visit_date: k.visit_date || null,
        subjective: k.subjective || null,
        objective: k.objective || null,
        assessment: k.assessment || null,
        planning: k.planning || null,
        treatment: k.treatment || null,
        foto_before: k.fotoBefore || null,
        foto_after: k.fotoAfter || null,
      });
    }
  });

  return await Promise.all(requests);
};
