import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KameraScreen from "../../components/beranda/KameraScreen";
import StatusBerhasil from "../../components/beranda/Statusberhasil";
import {
  mapExtraOralToPayload,
  mapPayloadToExtraOral,
  saveExtraOralExamination,
} from "../../services/extraOralExaminationService";
import { galleryState } from "../../services/galleryState";
import {
  buildPhysicalPayload,
  hasPhysicalData,
  savePhysicalExamination,
} from "../../services/physicalExaminationService";
import {
  getRontgenDetail,
  updateRontgenWithPhotos,
} from "../../services/rontgenService";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getDentalExaminations } from "../../services/dentalExaminationService";
import {
  generateMedicalNoteHTML,
  KunjunganItem,
} from "../../services/pdfExportService";

const { width: W } = Dimensions.get("window");
// 3 kolom seperti UploadFotoPasien: padding 16 kiri-kanan, gap 8 antar item
const FOTO_SIZE = (W - 32 - 16) / 3;

const fotoSectionsConfig = [
  {
    key: "xray",
    label: "X-RAY IMAGE",
    badgeColor: "#34B3B9",
    placeholderBg: "#D0E8E8",
    iconBg: "#E2F0F1",
    borderColor: "#34B3B9",
    color: "#34B3B9",
  },
  {
    key: "profil_gigi",
    label: "PROFIL GIGI IMAGE",
    badgeColor: "#7B8DE8",
    placeholderBg: "#EDEEFF",
    iconBg: "#EDEEFF",
    borderColor: "#7B8DE8",
    color: "#7B8DE8",
  },
  {
    key: "intraoral",
    label: "INTRAORAL IMAGE",
    badgeColor: "#B57BDD",
    placeholderBg: "#F3E8FF",
    iconBg: "#F3E8FF",
    borderColor: "#B57BDD",
    color: "#B57BDD",
  },
];

const fotoLabel: Record<string, string> = {
  xray: "Rontgen (X-Ray)",
  profil_gigi: "Profil Gigi",
  intraoral: "Foto Intraoral",
};

const fotoTagColor: Record<string, { bg: string; text: string }> = {
  xray: { bg: "#E2F0F1", text: "#34B3B9" },
  profil_gigi: { bg: "#EDEEFF", text: "#7B8DE8" },
  intraoral: { bg: "#F3E8FF", text: "#B57BDD" },
};

interface ExtraOralRowProps {
  label: string;
  leftOption: string;
  rightOption: string;
  active: string;
  onSelect: (value: string) => void;
  isEditing: boolean;
}

const ExtraOralRow = ({
  label,
  leftOption,
  rightOption,
  active,
  onSelect,
  isEditing,
}: ExtraOralRowProps) => (
  <View style={styles.exRowContainer}>
    <View style={styles.exRow}>
      <Text style={styles.exLabel}>{label}</Text>
      <View style={styles.exToggle}>
        <TouchableOpacity
          onPress={() => isEditing && onSelect(leftOption)}
          style={[
            styles.exBtn,
            active === leftOption && styles.exBtnActive,
            !isEditing && { opacity: 0.7 },
          ]}
          activeOpacity={isEditing ? 0.7 : 1}
        >
          <Text
            style={[
              styles.exText,
              active === leftOption && styles.exTextActive,
            ]}
          >
            {leftOption}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => isEditing && onSelect(rightOption)}
          style={[
            styles.exBtn,
            active === rightOption && styles.exBtnActive,
            !isEditing && { opacity: 0.7 },
          ]}
          activeOpacity={isEditing ? 0.7 : 1}
        >
          <Text
            style={[
              styles.exText,
              active === rightOption && styles.exTextActive,
            ]}
          >
            {rightOption}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default function ExamDetails() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const rontgenId = Number(params.rontgenId) || 0;

  // Mode edit
  const [isEditing, setIsEditing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Data dari API
  const [nama, setNama] = useState((params.nama as string) || "-");
  const [umur, setUmur] = useState("-");
  const [gender, setGender] = useState("-");
  const [dokter, setDokter] = useState((params.dokter as string) || "-");
  const [spesialisasi, setSpesialisasi] = useState("-");
  const [examDate, setExamDate] = useState("-");
  const [examTime, setExamTime] = useState((params.jam as string) || "-");
  const [notes, setNotes] = useState((params.notes as string) || "");
  const [status, setStatus] = useState("-");
  const [pasienNo, setPasienNo] = useState((params.no as string) || "-");
  const [kunjunganList, setKunjunganList] = useState<KunjunganItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // ✅ Pemeriksaan Fisik — sesuai tabel physical_examinations di ERD
  const [tekananDarah, setTekananDarah] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [nadi, setNadi] = useState("");
  const [respirasi, setRespirasi] = useState("");
  const [suhu, setSuhu] = useState("");

  // ✅ Extra Oral — sesuai tabel extra_oral_examinations di ERD
  const [extraOral, setExtraOral] = useState<Record<string, string>>({
    wajah: "Simetris",
    kulit: "Normal",
    limfa: "Tidak teraba",
    tmj: "Normal",
    massaOtot: "Normal",
    pembengkakan: "Tidak ada",
    mataHidung: "Normal",
  });

  // Tags dari API
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Foto dari API — key: image_type, value: array of image_url
  const [fotos, setFotos] = useState<Record<string, string[]>>({
    xray: [],
    profil_gigi: [],
    intraoral: [],
  });

  // Kamera
  const [kameraVisible, setKameraVisible] = useState(false);
  const [aktivSection, setAktivSection] = useState<string | null>(null);

  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rontgenId) {
      fetchDetail();
    } else {
      setLoadingData(false);
      setFotos({
        xray: Array.from(
          { length: Number(params.fotoRontgen) || 0 },
          () => "placeholder",
        ),
        profil_gigi: Array.from(
          { length: Number(params.fotoProfil) || 0 },
          () => "placeholder",
        ),
        intraoral: Array.from(
          { length: Number(params.fotoIntraoral) || 0 },
          () => "placeholder",
        ),
      });
    }
  }, [rontgenId]);

  const fetchDetail = async () => {
    setLoadingData(true);
    try {
      const res = await getRontgenDetail(rontgenId);
      if (res.success && res.data) {
        const d = res.data;

        setNama(d.patient?.name || "-");
        setUmur(
          d.patient?.birth_date
            ? `${calculateAge(d.patient.birth_date)} Years Old`
            : "-",
        );
        setGender(
          d.patient?.gender === "female"
            ? "Female"
            : d.patient?.gender === "male"
              ? "Male"
              : "-",
        );
        setPasienNo(
          d.patient?.patient_number ??
            (d.patient?.id
              ? "PT-" + String(d.patient.id).padStart(6, "0")
              : "-"),
        );
        setDokter(d.doctor?.name || "-");
        setSpesialisasi(d.doctor?.specialization || "-");
        setExamDate(d.created_at?.split(" ")[0] || "-");
        setExamTime(d.created_at?.split(" ")[1]?.slice(0, 5) || "-");
        setNotes(d.detail || "");
        setStatus(d.status || "-");
        setSelectedTags(d.tags?.map((t: any) => `#${t.tag_name}`) || []);

        // ✅ Load Pemeriksaan Fisik dari API
        if (d.physical_examination) {
          const pe = d.physical_examination;
          setTekananDarah(pe.blood_pressure || "");
          setTinggiBadan(pe.height ? String(pe.height) : "");
          setBeratBadan(pe.weight ? String(pe.weight) : "");
          setNadi(pe.pulse ? String(pe.pulse) : "");
          setRespirasi(pe.respiration ? String(pe.respiration) : "");
          setSuhu(pe.temperature ? String(pe.temperature) : "");
        }

        // ✅ Load Extra Oral dari API — mapping enum DB → label UI via service helper
        if (d.extra_oral_examination) {
          const eo = d.extra_oral_examination;
          setExtraOral(mapPayloadToExtraOral(eo));
        }

        // Load foto — hanya tipe yang dikenal saja (xray, profil_gigi, intraoral).
        // foto_before / foto_after dari dental_examinations TIDAK masuk ke sini.
        const VALID_FOTO_TYPES = ["xray", "profil_gigi", "intraoral"];
        const fotoByType: Record<string, string[]> = {
          xray: [],
          profil_gigi: [],
          intraoral: [],
        };
        d.examination_images?.forEach((img: any) => {
          const type = img.image_type;
          if (!VALID_FOTO_TYPES.includes(type)) return; // skip foto_before, foto_after, dll
          if (img.image_url) fotoByType[type].push(img.image_url);
        });
        setFotos(fotoByType);

        const examRes = await getDentalExaminations(rontgenId);
        if (examRes?.success && Array.isArray(examRes.data)) {
          setKunjunganList(
            examRes.data.map((item: any) => ({
              visit_number: item.visit_number,
              tanggal: item.visit_date || "",
              subyektif: item.subjective || "",
              obyektif: item.objective || "",
              assesment: item.assessment || "",
              planning: item.planning || "",
              treatment: item.treatment || "",
              fotoBefore: item.foto_before_url || "",
              fotoAfter: item.foto_after_url || "",
            })),
          );
        }
      }
    } catch (error) {
      console.log("Error fetch detail:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    return today.getFullYear() - birth.getFullYear();
  };

  const toggleTag = (tag: string) => {
    if (!isEditing) return;
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const bukaKamera = (sectionKey: string) => {
    if (!isEditing) return;
    setAktivSection(sectionKey);
    setKameraVisible(true);
  };

  const bukaGallery = (sectionKey: string) => {
    if (!isEditing) return;
    setAktivSection(sectionKey);
    galleryState.setCallback((uris: string[]) => {
      setFotos((prev) => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey] || []), ...uris].slice(0, 10),
      }));
    });
    router.push("/(admin)/GalleryScreen");
  };

  const handleCapture = (uri: string) => {
    if (!aktivSection) return;
    setFotos((prev) => ({
      ...prev,
      [aktivSection]: [...(prev[aktivSection] || []), uri],
    }));
    setKameraVisible(false);
    setAktivSection(null);
  };

  const hapusFoto = (sectionKey: string, index: number) => {
    setFotos((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const handleSaveChanges = async () => {
    if (!nama.trim() || !dokter.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setLoading(true);

    try {
      if (rontgenId) {
        const requests: Promise<any>[] = [];

        const hasNewPhotos = Object.values(fotos)
          .flat()
          .some((uri) => uri !== "placeholder" && !uri.startsWith("http"));

        if (hasNewPhotos) {
          requests.push(updateRontgenWithPhotos(rontgenId, fotos, notes));
        } else {
          requests.push(updateRontgenWithPhotos(rontgenId, fotos, notes));
        }

        const formFisik = {
          tekananDarah,
          tinggiBadan,
          beratBadan,
          nadi,
          respirasi,
          suhu,
        };
        if (hasPhysicalData(formFisik)) {
          requests.push(
            savePhysicalExamination(buildPhysicalPayload(rontgenId, formFisik)),
          );
        }

        const extraOralPayload = {
          rontgen_id: rontgenId,
          ...mapExtraOralToPayload(extraOral),
        };
        requests.push(saveExtraOralExamination(extraOralPayload));

        await Promise.all(requests);
      }

      setIsEditing(false);
      setShowSuccess(true);
    } catch (error) {
      console.log("Error save changes:", error);
      alert("Gagal menyimpan perubahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    router.replace({
      pathname: "/(admin)/(tabs)/rontgen",
      params: { tab: "history" },
    });
  };

  const handlePrintPDF = async () => {
    try {
      setIsPrinting(true);

      const html = generateMedicalNoteHTML({
        nama,
        umur,
        pasienNo,
        gender,
        dokter,
        spesialisasi,
        examDate,
        examTime,
        status,
        tekananDarah,
        tinggiBadan,
        beratBadan,
        nadi,
        respirasi,
        suhu,
        notes,
        extraOral,
        fotos: fotos as Record<string, string[]>,
        kunjunganList,
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Medical Note - ${nama}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        alert("Sharing tidak tersedia di perangkat ini.");
      }
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsPrinting(false);
    }
  };

  // Section tampil: saat editing semua section tampil; saat view hanya yang ada fotonya
  const activeSections = fotoSectionsConfig.filter(
    (s) => isEditing || (fotos[s.key] || []).some((u) => u !== "placeholder"),
  );

  if (loadingData) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#34B3B9" />
        <Text style={{ color: "#888", marginTop: 12 }}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBerhasil
        visible={showSuccess}
        title="Edit Record Berhasil!"
        subtitle="Perubahan telah tersimpan ke sistem"
        onDone={handleSuccessDone}
      />

      <Modal visible={kameraVisible} animationType="slide" statusBarTranslucent>
        <KameraScreen
          onCapture={handleCapture}
          onClose={() => setKameraVisible(false)}
          sectionColor={
            fotoSectionsConfig.find((s) => s.key === aktivSection)?.color ||
            "#34B3B9"
          }
        />
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
      >
        {/* ━━━━━ PASIEN CARD ━━━━━ */}
        <View style={styles.pasienCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#2E9DA4" />
          </View>
          <View style={styles.pasienInfo}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={nama}
                onChangeText={setNama}
              />
            ) : (
              <Text style={styles.pasienNama}>{nama}</Text>
            )}
            <Text style={styles.pasienSub}>
              No. {pasienNo} · {examTime} · {umur}
            </Text>
            {/* Foto type tags */}
            <View style={styles.fotoTagRow}>
              {activeSections.map((s) => {
                const color = fotoTagColor[s.key] || {
                  bg: "#E2F0F1",
                  text: "#34B3B9",
                };
                return (
                  <View
                    key={s.key}
                    style={[styles.fotoTag, { backgroundColor: color.bg }]}
                  >
                    <Text style={[styles.fotoTagText, { color: color.text }]}>
                      {fotoLabel[s.key]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ━━━━━ FOTO SECTIONS ━━━━━ */}
        {activeSections.map((section) => {
          const photos = fotos[section.key] || [];
          return (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: section.color }]}>
                  {section.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: section.badgeColor },
                  ]}
                >
                  <Text style={styles.countText}>
                    {photos.length}
                    {isEditing ? "/10" : " foto"}
                  </Text>
                </View>
              </View>

              {/* Upload box — sama persis dengan UploadFotoPasien */}
              <View
                style={[styles.uploadBox, { borderColor: section.borderColor }]}
              >
                {photos.length === 0 ? (
                  /* ── Kosong: tampilkan tombol Camera & Gallery ── */
                  <>
                    <View style={styles.uploadBtnRow}>
                      <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={() => bukaKamera(section.key)}
                        activeOpacity={isEditing ? 0.7 : 1}
                      >
                        <View
                          style={[
                            styles.uploadIconBox,
                            { backgroundColor: section.iconBg },
                          ]}
                        >
                          <Ionicons
                            name="camera-outline"
                            size={28}
                            color={section.color}
                          />
                        </View>
                        <Text style={styles.uploadBtnLabel}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={() => bukaGallery(section.key)}
                        activeOpacity={isEditing ? 0.7 : 1}
                      >
                        <View
                          style={[
                            styles.uploadIconBox,
                            { backgroundColor: section.iconBg },
                          ]}
                        >
                          <Ionicons
                            name="images-outline"
                            size={28}
                            color={section.color}
                          />
                        </View>
                        <Text style={styles.uploadBtnLabel}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.uploadHint}>
                      Capture or select high resolution{" "}
                      {section.label.toLowerCase()} files (JPEG, PNG up to 10MB)
                    </Text>
                  </>
                ) : (
                  /* ── Ada foto: grid foto + tombol tambah (jika editing) ── */
                  <>
                    <View style={styles.photoGrid}>
                      {photos.map((uri, index) => (
                        <View key={index} style={styles.photoItem}>
                          {uri === "placeholder" ? (
                            <View
                              style={[
                                styles.photoPlaceholder,
                                { backgroundColor: section.placeholderBg },
                              ]}
                            >
                              <Ionicons
                                name="image-outline"
                                size={24}
                                color="#aaa"
                              />
                            </View>
                          ) : (
                            <Image
                              source={{ uri }}
                              style={styles.photoImg}
                              resizeMode="cover"
                            />
                          )}
                          {!isEditing && uri !== "placeholder" && (
                            <View style={styles.fullscreenIcon}>
                              <Ionicons
                                name="expand-outline"
                                size={13}
                                color="#fff"
                              />
                            </View>
                          )}
                          {isEditing && (
                            <TouchableOpacity
                              style={styles.deleteBadge}
                              onPress={() => hapusFoto(section.key, index)}
                            >
                              <Ionicons name="close" size={11} color="#fff" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}

                      {/* Tombol Tambah — hanya saat editing dan belum 10 foto */}
                      {isEditing && photos.length < 10 && (
                        <TouchableOpacity
                          style={[
                            styles.photoItem,
                            styles.tambahBtn,
                            { backgroundColor: section.iconBg },
                          ]}
                          onPress={() => bukaGallery(section.key)}
                          onLongPress={() => bukaKamera(section.key)}
                        >
                          <Ionicons
                            name="add"
                            size={28}
                            color={section.color}
                          />
                          <Text
                            style={[
                              styles.tambahLabel,
                              { color: section.color },
                            ]}
                          >
                            Tambah
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.uploadHint}>
                      {isEditing
                        ? "Tap foto untuk hapus · Tap + untuk tambah"
                        : `${photos.length} foto tersimpan`}
                    </Text>
                  </>
                )}
              </View>
            </View>
          );
        })}

        {/* ━━━━━ DATA PASIEN CARD ━━━━━ */}
        <View style={styles.dataPasienCard}>
          <View style={styles.cardIconRow}>
            <Ionicons name="person" size={14} color="#34B3B9" />
            <Text style={styles.cardSmallTitle}>DATA PASIEN</Text>
          </View>
          <View style={styles.dataContent}>
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={24} color="#2E9DA4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dataLabel}>Patient Name</Text>
              <Text style={styles.dataMainVal}>{nama}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dataLabel}>Age</Text>
              <Text style={styles.dataMainVal}>{umur.split(" ")[0]} Years</Text>
            </View>
          </View>
          {/* Dokter & Tanggal */}
          <View style={[styles.dataContent, { marginTop: 14, gap: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dataLabel}>Dokter</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={dokter}
                  onChangeText={setDokter}
                />
              ) : (
                <Text style={styles.dataMainVal}>{dokter}</Text>
              )}
              <Text style={styles.dataLabel}>{spesialisasi}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dataLabel}>Tanggal</Text>
              <Text style={styles.dataMainVal}>{examDate}</Text>
              <Text style={styles.dataLabel}>{examTime}</Text>
            </View>
          </View>
          {/* Status */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.dataLabel}>Status</Text>
            <Text style={[styles.dataMainVal, { color: "#34B3B9" }]}>
              {status}
            </Text>
          </View>
        </View>

        {/* ━━━━━ PEMERIKSAAN FISIK ━━━━━ */}
        <Text style={styles.subTitleBold}>PEMERIKSAAN FISIK</Text>
        <View style={styles.fisikGrid}>
          <View style={styles.fisikItem}>
            <View style={styles.fisikIcon}>
              <Ionicons name="pulse" size={18} color="#34B3B9" />
            </View>
            <View>
              <Text style={styles.fLabel}>Tekanan Darah</Text>
              <View style={styles.fInputRow}>
                <TextInput
                  style={styles.fInput}
                  keyboardType="numeric"
                  value={tekananDarah}
                  onChangeText={setTekananDarah}
                  placeholder="120"
                  placeholderTextColor="#ccc"
                  editable={isEditing}
                />
                <Text style={styles.fUnit}>mm/Hg</Text>
              </View>
            </View>
          </View>

          <View style={styles.fisikItem}>
            <View style={styles.fisikIcon}>
              <Ionicons name="person" size={18} color="#34B3B9" />
            </View>
            <View>
              <Text style={styles.fLabel}>TB/BB</Text>
              <View style={styles.fInputRow}>
                <TextInput
                  style={styles.fInputSmall}
                  keyboardType="numeric"
                  value={tinggiBadan}
                  onChangeText={setTinggiBadan}
                  placeholder="170"
                  placeholderTextColor="#ccc"
                  editable={isEditing}
                />
                <Text>/</Text>
                <TextInput
                  style={styles.fInputSmall}
                  keyboardType="numeric"
                  value={beratBadan}
                  onChangeText={setBeratBadan}
                  placeholder="60"
                  placeholderTextColor="#ccc"
                  editable={isEditing}
                />
                <Text style={styles.fUnit}>cm / Kg</Text>
              </View>
            </View>
          </View>

          <View style={styles.fisikItem}>
            <View style={styles.fisikIcon}>
              <Ionicons name="heart" size={18} color="#34B3B9" />
            </View>
            <View>
              <Text style={styles.fLabel}>Nadi</Text>
              <View style={styles.fInputRow}>
                <TextInput
                  style={styles.fInput}
                  keyboardType="numeric"
                  value={nadi}
                  onChangeText={setNadi}
                  placeholder="80"
                  placeholderTextColor="#ccc"
                  editable={isEditing}
                />
                <Text style={styles.fUnit}>beats/min</Text>
              </View>
            </View>
          </View>

          <View style={styles.fisikItem}>
            <View style={styles.fisikIcon}>
              <Ionicons name="thermometer" size={18} color="#34B3B9" />
            </View>
            <View>
              <Text style={styles.fLabel}>Respirasi</Text>
              <View style={styles.fInputRow}>
                <TextInput
                  style={styles.fInput}
                  keyboardType="numeric"
                  value={respirasi}
                  onChangeText={setRespirasi}
                  placeholder="18"
                  placeholderTextColor="#ccc"
                  editable={isEditing}
                />
                <Text style={styles.fUnit}>breaths/min</Text>
              </View>
            </View>
          </View>

          <View style={styles.fisikItem}>
            <View style={styles.fisikIcon}>
              <Ionicons name="thermometer-outline" size={18} color="#34B3B9" />
            </View>
            <View>
              <Text style={styles.fLabel}>Suhu</Text>
              <View style={styles.fInputRow}>
                <TextInput
                  style={styles.fInput}
                  keyboardType="decimal-pad"
                  value={suhu}
                  onChangeText={setSuhu}
                  placeholder="36.5"
                  placeholderTextColor="#ccc"
                  editable={isEditing}
                />
                <Text style={styles.fUnit}>°C</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ━━━━━ KELUHAN UTAMA / CLINICAL NOTES ━━━━━ */}
        <Text style={styles.subTitleBold}>KELUHAN UTAMA</Text>
        <TextInput
          style={[styles.textAreaFigma, !isEditing && { color: "#444" }]}
          placeholder="Contoh : Gigi depan goyang, gigi taring goyang..."
          multiline
          value={notes}
          onChangeText={setNotes}
          editable={isEditing}
          textAlignVertical="top"
        />

        {/* ━━━━━ EXTRA ORAL EXAMINATION ━━━━━ */}
        <Text style={styles.subTitleCyan}>EXTRA ORAL EXAMINATION</Text>
        <View style={styles.extraOralBox}>
          <ExtraOralRow
            label="Wajah"
            leftOption="Simetris"
            rightOption="Asimetris"
            active={extraOral.wajah}
            onSelect={(v) => setExtraOral({ ...extraOral, wajah: v })}
            isEditing={isEditing}
          />
          <ExtraOralRow
            label="Kulit wajah & leher"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.kulit}
            onSelect={(v) => setExtraOral({ ...extraOral, kulit: v })}
            isEditing={isEditing}
          />
          <ExtraOralRow
            label="Kelenjar limfa submandibula"
            leftOption="Teraba"
            rightOption="Tidak teraba"
            active={extraOral.limfa}
            onSelect={(v) => setExtraOral({ ...extraOral, limfa: v })}
            isEditing={isEditing}
          />
          <ExtraOralRow
            label="Sendi Rahang / TMJ"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.tmj}
            onSelect={(v) => setExtraOral({ ...extraOral, tmj: v })}
            isEditing={isEditing}
          />
          <ExtraOralRow
            label="Massa otot pengunyah palpasi otot masseter & temporalis"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.massaOtot}
            onSelect={(v) => setExtraOral({ ...extraOral, massaOtot: v })}
            isEditing={isEditing}
          />
          <ExtraOralRow
            label="Pembengkakan area wajah atau leher"
            leftOption="Ada"
            rightOption="Tidak ada"
            active={extraOral.pembengkakan}
            onSelect={(v) => setExtraOral({ ...extraOral, pembengkakan: v })}
            isEditing={isEditing}
          />
          <ExtraOralRow
            label="Kondisi mata & hidung"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.mataHidung}
            onSelect={(v) => setExtraOral({ ...extraOral, mataHidung: v })}
            isEditing={isEditing}
          />
        </View>

        {/* ━━━━━ LEMBAR PEMERIKSAAN GIGI ━━━━━ */}
        <TouchableOpacity
          style={styles.btnLembar}
          onPress={() =>
            router.push({
              pathname: "/(admin)/Lembarpemeriksaangigi",
              params: {
                rontgenId: rontgenId,
                nama: nama,
                no: pasienNo,
              }, // rontgenId sudah ada di baris 147
            })
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../../assets/icons/Tooth.png")}
              style={styles.tipsIcon}
            />
            <Text style={styles.btnLembarText}>Lembar pemeriksaan gigi</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color="#000" />
        </TouchableOpacity>

        {/* ━━━━━ TAGS ━━━━━ */}
        <Text style={styles.subTitleBold}>TAGS</Text>
        <View style={styles.tagRow}>
          {selectedTags.length === 0 ? (
            <Text style={{ color: "#aaa", fontSize: 13 }}>Tidak ada tag</Text>
          ) : (
            selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={styles.tagChipTextActive}>{tag}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Error */}
        {showError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#e05c5c" />
            <Text style={styles.errorText}>
              Nama dan dokter tidak boleh kosong
            </Text>
          </View>
        )}

        {/* ━━━━━ BUTTONS ━━━━━ */}
        {!isEditing ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={[styles.printBtn, isPrinting && { opacity: 0.7 }]}
              onPress={handlePrintPDF}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={20} color="#fff" />
                  <Text style={styles.printBtnText}>Print / Export PDF</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editRecordBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#A66C64" />
              <Text style={styles.editRecordBtnText}>Edit Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSaveChanges}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2F0F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  backBtn: { width: 36, height: 36, justifyContent: "center" },

  // Pasien Card
  pasienCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 14,
    marginBottom: 25,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsIcon: { width: 25, height: 25 },
  pasienInfo: { flex: 1, gap: 4, marginLeft: 10 },
  pasienNama: { fontSize: 16, fontWeight: "700" },
  pasienSub: { fontSize: 12, color: "#888" },
  fotoTagRow: { flexDirection: "row", gap: 5, marginTop: 4 },
  fotoTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  fotoTagText: { fontSize: 10, fontWeight: "600" },
  editInput: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    borderBottomWidth: 1.5,
    borderBottomColor: "#34B3B9",
    paddingVertical: 2,
    marginBottom: 2,
  },

  // Foto Section
  section: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionLabel: { fontSize: 14, fontWeight: "800" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 15 },
  countText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  uploadBtnRow: { flexDirection: "row", gap: 30, marginBottom: 15 },
  uploadBtn: { alignItems: "center" },
  uploadIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBtnLabel: { fontSize: 13, color: "#555", marginTop: 5 },
  uploadHint: { fontSize: 11, color: "#aaa", textAlign: "center" },

  // Foto Grid — 3 kolom seperti UploadFotoPasien
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  photoItem: {
    width: FOTO_SIZE,
    height: FOTO_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  photoImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  tambahBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  tambahLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  fullscreenIcon: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    padding: 3,
  },
  deleteBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF4D4D",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },

  // Data Pasien Card
  dataPasienCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  cardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  cardSmallTitle: { fontSize: 12, fontWeight: "800", color: "#34B3B9" },
  dataContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  dataLabel: { fontSize: 10, color: "#aaa" },
  dataMainVal: { fontSize: 16, fontWeight: "800" },

  // Pemeriksaan Fisik
  subTitleBold: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 15,
    marginTop: 5,
  },
  subTitleCyan: {
    fontSize: 14,
    fontWeight: "800",
    color: "#34B3B9",
    marginBottom: 15,
  },
  fisikGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  fisikItem: {
    width: (W - 42) / 2,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fisikIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  fLabel: { fontSize: 10, color: "#aaa" },
  fInputRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  fInput: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    width: 40,
    fontSize: 12,
    padding: 0,
    color: "#1a1a1a",
  },
  fInputSmall: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    width: 28,
    fontSize: 12,
    padding: 0,
    textAlign: "center",
    color: "#1a1a1a",
  },
  fUnit: { fontSize: 8, fontWeight: "700", marginRight: 2, color: "#888" },

  // Keluhan Utama
  textAreaFigma: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    height: 100,
    textAlignVertical: "top",
    fontSize: 14,
    marginBottom: 25,
  },

  // Extra Oral
  extraOralBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 5,
    marginBottom: 25,
    overflow: "hidden",
  },
  exRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  exRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exLabel: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    color: "#1a1a1a",
    paddingRight: 10,
  },
  exToggle: { flexDirection: "row", gap: 8 },
  exBtn: {
    width: 80,
    height: 30,
    borderRadius: 18,
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
  },
  exBtnActive: { backgroundColor: "#34B3B9" },
  exText: { fontSize: 11, color: "#555" },
  exTextActive: { color: "#fff", fontWeight: "700" },

  // Lembar Pemeriksaan
  btnLembar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#BDE7E9",
    padding: 14,
    borderRadius: 15,
    marginBottom: 25,
  },
  btnLembarText: { fontSize: 15, fontWeight: "800" },

  // Tags
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tagChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagChipActive: {
    backgroundColor: "#E2F0F1",
    borderWidth: 1,
    borderColor: "#34B3B9",
  },
  tagChipTextActive: { color: "#34B3B9", fontWeight: "600", fontSize: 12 },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e05c5c33",
  },
  errorText: { fontSize: 13, color: "#e05c5c", fontWeight: "500" },

  // Buttons
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34B3B9",
    borderRadius: 30,
    paddingVertical: 15,
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  printBtnText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  editRecordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  editRecordBtnText: { fontSize: 14, color: "#A66C64", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#34B3B9",
    borderRadius: 30,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
