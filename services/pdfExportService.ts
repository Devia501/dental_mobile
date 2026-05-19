/**
 * pdfExportService.ts
 *
 * Generates an HTML string for the Medical Note PDF.
 * Used with expo-print: await Print.printToFileAsync({ html })
 */

export interface KunjunganItem {
  visit_number: number;
  tanggal: string;
  subyektif: string;
  obyektif: string;
  assesment: string;
  planning: string;
  treatment: string;
  fotoBefore?: string;
  fotoAfter?: string;
}

export interface MedicalNotePDFData {
  // Data Pasien
  nama: string;
  umur: string; // e.g. "8 Years Old"
  pasienNo: string;
  gender: string;
  dokter: string;
  spesialisasi: string;
  examDate: string;
  examTime: string;
  status: string;

  // Pemeriksaan Fisik
  tekananDarah: string;
  tinggiBadan: string;
  beratBadan: string;
  nadi: string;
  respirasi: string;
  suhu: string;

  // Keluhan Utama
  notes: string;

  // Extra Oral
  extraOral: Record<string, string>;

  // Foto — key: "xray" | "profil_gigi" | "intraoral"
  fotos: Record<string, string[]>;

  // Lembar Pemeriksaan Gigi
  kunjunganList: KunjunganItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const val = (v: string | undefined, fallback = "…………") =>
  v && v.trim() ? v.trim() : fallback;

const imgTag = (uri: string, style = "") =>
  isValidUrl(uri)
    ? `<img src="${uri}" style="max-width:160px;max-height:120px;object-fit:cover;border-radius:6px;${style}" />`
    : "";

const isValidUrl = (u: string) =>
  Boolean(
    u && u !== "placeholder" && (u.startsWith("http") || u.startsWith("file")),
  );

const fotoGrid = (uris: string[]) => {
  const imgs = (uris || [])
    .filter(isValidUrl)
    .map(
      (u) =>
        `<img src="${u}" style="width:160px;height:120px;object-fit:cover;border-radius:6px;margin:4px;" />`,
    )
    .join("");
  return imgs
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0;">${imgs}</div>`
    : `<p style="color:#aaa;font-size:11px;margin:4px 0;">— Tidak ada foto —</p>`;
};

const extraOralLabel: Record<string, string> = {
  wajah: "Wajah (Asimetris / Simetris)",
  kulit: "Kulit wajah & leher (Normal / Tidak Normal)",
  limfa: "Kelenjar limfa submandibula, servikal (Teraba / Tidak teraba)",
  tmj: "Sendi Rahang, TMJ (Normal / Tidak Normal)",
  massaOtot:
    "Massa otot pengunyah palpasi otot masseter & temporalis (Normal / Tidak Normal)",
  pembengkakan: "Pembengkakan area wajah atau leher (Ada / Tidak Ada)",
  mataHidung: "Kondisi mata & hidung, jika relevan (Normal / Tidak Normal)",
};

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateMedicalNoteHTML(data: MedicalNotePDFData): string {
  const {
    nama,
    umur,
    pasienNo,
    dokter,
    spesialisasi,
    examDate,
    examTime,
    tekananDarah,
    tinggiBadan,
    beratBadan,
    nadi,
    respirasi,
    suhu,
    notes,
    extraOral,
    fotos,
    kunjunganList,
  } = data;

  // ── Extra Oral rows ──
  const extraOralRows = Object.entries(extraOralLabel)
    .map(([key, label]) => {
      const v = extraOral[key] ? ` : <strong>${extraOral[key]}</strong>` : "";
      return `<p style="margin:3px 0;font-size:12px;">${label}${v}</p>`;
    })
    .join("");

  const tdStyle =
    "border:1px solid #ccc;padding:8px 6px;vertical-align:top;font-size:11px;";
  const thStyle =
    "border:1px solid #ccc;padding:8px 6px;background:#34B3B9;color:#fff;font-size:11px;font-weight:700;text-align:left;";

  // ── Lembar Pemeriksaan Gigi rows ──
  const lembarRows =
    kunjunganList.length > 0
      ? kunjunganList
          .map(
            (k) => `
          <tr>
            <td style="${tdStyle}">${k.visit_number}</td>
            <td style="${tdStyle}">${val(k.tanggal)}</td>
            <td style="${tdStyle}">${val(k.subyektif)}</td>
            <td style="${tdStyle}">${val(k.obyektif)}</td>
            <td style="${tdStyle}">${val(k.assesment)}</td>
            <td style="${tdStyle}">${val(k.planning)}</td>
            <td style="${tdStyle}">
              ${val(k.treatment)}
              <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                ${
                  k.fotoBefore
                    ? `<div><div style="font-size:9px;color:#666;margin-bottom:2px;">BEFORE</div>${imgTag(k.fotoBefore)}</div>`
                    : ""
                }
                ${
                  k.fotoAfter
                    ? `<div><div style="font-size:9px;color:#666;margin-bottom:2px;">AFTER</div>${imgTag(k.fotoAfter)}</div>`
                    : ""
                }
              </div>
            </td>
          </tr>`,
          )
          .join("")
      : `<tr><td colspan="7" style="${tdStyle}text-align:center;color:#aaa;">Belum ada data pemeriksaan</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      padding: 32px 36px;
      line-height: 1.5;
    }
    h1 {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
      margin-bottom: 18px;
      text-decoration: underline;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      margin: 14px 0 6px;
      text-transform: uppercase;
    }
    .info-row {
      display: flex;
      gap: 40px;
      margin-bottom: 3px;
    }
    .info-row span { font-size: 12px; }
    .separator {
      border: none;
      border-top: 1.5px solid #1a1a1a;
      margin: 14px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .no-data { color: #aaa; font-size: 11px; margin: 4px 0; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

  <!-- ═══════════════════════════════════════════ -->
  <!--  HALAMAN 1 — MEDICAL NOTE                  -->
  <!-- ═══════════════════════════════════════════ -->

  <h1>MEDICAL NOTE</h1>

  <p style="font-size:12px;margin-bottom:10px;"><strong>No. :</strong> ${val(pasienNo)}</p>

  <!-- Data Pasien -->
  <p class="section-title">DATA PASIEN :</p>
  <div class="info-row">
    <span>Nama &nbsp;: ${val(nama)}</span>
  </div>
  <div class="info-row">
    <span>Usia &nbsp;&nbsp;: ${umur ? umur.replace(" Years Old", "") : "…"} tahun</span>
    <span>Jenis Kelamin : ${val(data.gender)}</span>
  </div>
  <div class="info-row">
    <span>Dokter : ${val(dokter)}${spesialisasi ? " — " + spesialisasi : ""}</span>
    <span>Tanggal : ${val(examDate)} &nbsp; ${val(examTime)}</span>
  </div>

  <hr class="separator" />

  <!-- Pemeriksaan Fisik -->
  <p class="section-title">PEMERIKSAAN FISIK :</p>
  <div class="info-row">
    <span>Tekanan Darah : ${val(tekananDarah)} mm/Hg</span>
    <span>Tb/BB : ${val(tinggiBadan)} Cm / ${val(beratBadan)} Kg</span>
  </div>
  <div class="info-row">
    <span>Nadi &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${val(nadi)} Kali/menit</span>
    <span>Respirasi &nbsp;: ${val(respirasi)} Kali/menit</span>
  </div>
  <div class="info-row">
    <span>Suhu &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${val(suhu)} °C</span>
  </div>

  <hr class="separator" />

  <!-- Keluhan Utama -->
  <p class="section-title">KELUHAN UTAMA :</p>
  <p style="font-size:12px;margin-bottom:4px;">${val(notes, "—")}</p>

  <hr class="separator" />

  <!-- Pemeriksaan Ekstra Oral -->
  <p class="section-title">PEMERIKSAAN EKSTRA ORAL :</p>
  ${extraOralRows}

  <hr class="separator" />

  <!-- Foto Profil Gigi (Ekstra Oral) -->
  <p class="section-title">FOTO EKSTRA ORAL :</p>
  ${fotoGrid(fotos.profil_gigi)}

  <!-- Foto Intraoral -->
  <p class="section-title">FOTO GIGI &amp; INTRAORAL :</p>
  ${fotoGrid(fotos.intraoral)}

  <!-- Foto Rontgen -->
  <p class="section-title">FOTO RADIOGRAF :</p>
  ${fotoGrid(fotos.xray)}

  <!-- ═══════════════════════════════════════════ -->
  <!--  HALAMAN 2 — LEMBAR PEMERIKSAAN GIGI       -->
  <!-- ═══════════════════════════════════════════ -->

  <div class="page-break"></div>

  <h1>LEMBAR PEMERIKSAAN GIGI</h1>

  <div class="info-row" style="margin-bottom:12px;">
    <span><strong>Nama Pasien :</strong> ${val(nama)}</span>
    <span><strong>No. Pasien &nbsp;:</strong> ${val(pasienNo)}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="${thStyle}width:28px;">NO</th>
        <th style="${thStyle}width:70px;">TANGGAL</th>
        <th style="${thStyle}">SUBYEKTIF (S)</th>
        <th style="${thStyle}">OBYEKTIF (O)</th>
        <th style="${thStyle}">ASSESSMENT (A)</th>
        <th style="${thStyle}">PLANNING (P)</th>
        <th style="${thStyle}">TREATMENT (Tx)</th>
      </tr>
    </thead>
    <tbody>
      ${lembarRows}
    </tbody>
  </table>

</body>
</html>
`;
}
