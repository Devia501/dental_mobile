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
  saveExtraOralExamination,
} from "../../services/extraOralExaminationService";
import { galleryState } from "../../services/galleryState";
import { updateStatusRontgen } from "../../services/pasienService";
import {
  buildPhysicalPayload,
  hasPhysicalData,
  savePhysicalExamination,
} from "../../services/physicalExaminationService";
import {
  getDokterList,
  getTagList,
  updateRontgenDetail,
  uploadFotoRontgen,
} from "../../services/rontgenService";

const { width: W } = Dimensions.get("window");
// Ukuran item foto dalam grid: 3 kolom, padding 16 kiri-kanan, gap 8
const FOTO_SIZE = (W - 32 - 16) / 3;

interface ExtraOralRowProps {
  label: string;
  leftOption: string;
  rightOption: string;
  active: string;
  onSelect: (value: string) => void;
}

const fotoSections = [
  {
    key: "rontgen_xray",
    label: "X-RAY IMAGE",
    color: "#34B3B9",
    iconBg: "#E2F0F1",
    borderColor: "#34B3B9",
  },
  {
    key: "profil_gigi",
    label: "PROFIL GIGI IMAGE",
    color: "#7B8DE8",
    iconBg: "#EDEEFF",
    borderColor: "#7B8DE8",
  },
  {
    key: "intraoral",
    label: "INTRAORAL IMAGE",
    color: "#B57BDD",
    iconBg: "#F3E8FF",
    borderColor: "#B57BDD",
  },
];

const getFotoTagIcon = (key: string) => {
  try {
    switch (key) {
      case "rontgen_xray":
        return require("../../assets/icons/icon_foto_rontgen.png");
      case "profil_gigi":
        return require("../../assets/icons/icon_foto_profil.png");
      case "intraoral":
        return require("../../assets/icons/icon_foto_intraoral.png");
      default:
        return null;
    }
  } catch {
    return null;
  }
};

export default function UploadFotoPasien() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // ─── Params dari navigasi ───────────────────────────────────────────────────
  const pasienNama = (params.nama as string) || "Pasien";
  const pasienNo = (params.no as string) || "-";
  const pasienJam = (params.jam as string) || "-";
  const pasienUmur = (params.umur as string) || "-";

  const rontgenId = Number(params.rontgenId) || 0;
  const doctorIdParam = Number(params.doctorId) || 0;

  const fotoKeysRaw = (params.fotoKeys as string) || "";
  const fotoKeys = fotoKeysRaw.split(",").filter(Boolean);

  /**
   * tanpaFoto = true  → navigasi dari "Selesai (Tanpa Foto)"
   *   - Seksi upload foto TIDAK ditampilkan
   *   - Validasi foto dihapus
   *   - handleSave tidak memanggil uploadFotoRontgen,
   *     melainkan hanya update status + simpan data pemeriksaan
   *
   * tanpaFoto = false → navigasi dari "Upload Foto" (behaviour lama)
   */
  const tanpaFoto = params.tanpaFoto === "true";

  const fotoLabel: Record<string, string> = {
    rontgen_xray: "Rontgen (X-Ray)",
    profil_gigi: "Profil Gigi",
    intraoral: "Foto Intraoral",
  };
  const fotoTagColor: Record<string, { bg: string; text: string }> = {
    rontgen_xray: { bg: "#E2F0F1", text: "#34B3B9" },
    profil_gigi: { bg: "#EDEEFF", text: "#7B8DE8" },
    intraoral: { bg: "#F3E8FF", text: "#B57BDD" },
  };

  // ─── State ──────────────────────────────────────────────────────────────────
  const [dokterList, setDokterList] = useState<any[]>([]);
  const [tagList, setTagList] = useState<any[]>([]);
  const [selectedDokter, setSelectedDokter] = useState("");
  const [selectedDokterObj, setSelectedDokterObj] = useState<any>(null);
  const [showDokterDropdown, setShowDokterDropdown] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [kameraVisible, setKameraVisible] = useState(false);
  const [aktivSection, setAktivSection] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<
    Record<string, string[]>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pemeriksaan Fisik
  const [tekananDarah, setTekananDarah] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [nadi, setNadi] = useState("");
  const [respirasi, setRespirasi] = useState("");
  const [suhu, setSuhu] = useState("");

  // Extra Oral
  const [extraOral, setExtraOral] = useState<Record<string, string>>({
    wajah: "Simetris",
    kulit: "Normal",
    limfa: "Tidak teraba",
    tmj: "Normal",
    massaOtot: "Normal",
    pembengkakan: "Tidak ada",
    mataHidung: "Normal",
  });

  // Hanya tampilkan seksi foto yang diminta dokter (kosong jika tanpaFoto)
  const activeSections = fotoSections.filter((s) => fotoKeys.includes(s.key));

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDokterDanTag();
  }, []);

  const fetchDokterDanTag = async () => {
    try {
      const [dokterRes, tagRes] = await Promise.all([
        getDokterList(),
        getTagList(),
      ]);
      setDokterList(dokterRes.success ? dokterRes.data?.doctors || [] : []);
      setTagList(tagRes.success ? tagRes.data || [] : []);
    } catch (error) {
      console.log("Error fetch dokter/tag:", error);
      setDokterList([]);
      setTagList([]);
    }
  };

  // ─── Handler Foto ────────────────────────────────────────────────────────────
  const bukaGallery = (sectionKey: string) => {
    setAktivSection(sectionKey);
    galleryState.setCallback((uris: string[]) => {
      setCapturedPhotos((prev) => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey] || []), ...uris].slice(0, 10),
      }));
    });
    router.push("/(admin)/GalleryScreen");
  };

  const bukaKamera = (sectionKey: string) => {
    setAktivSection(sectionKey);
    setKameraVisible(true);
  };

  const handleCapture = (uri: string) => {
    if (!aktivSection) return;
    setCapturedPhotos((prev) => ({
      ...prev,
      [aktivSection]: [...(prev[aktivSection] || []), uri],
    }));
    setKameraVisible(false);
    setAktivSection(null);
  };

  const hapusFoto = (sectionKey: string, index: number) => {
    setCapturedPhotos((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  // ─── handleSave ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!rontgenId) {
      alert("Data pasien tidak valid (ID Kosong)!");
      return;
    }

    // Validasi foto HANYA jika bukan mode tanpa foto
    if (!tanpaFoto) {
      const totalFoto = Object.values(capturedPhotos).flat().length;
      if (totalFoto === 0) {
        alert("Minimal upload 1 foto!");
        return;
      }
    }

    setLoading(true);
    try {
      const dokId = selectedDokterObj?.id || doctorIdParam;
      const requests: Promise<any>[] = [];

      if (tanpaFoto) {
        const dokId = selectedDokterObj?.id || doctorIdParam;
        requests.push(updateStatusRontgen(rontgenId, "selesai"));
        // Kirim dokter + tags + notes sekaligus
        requests.push(
          uploadFotoRontgen(rontgenId, {}, dokId, notes, selectedTags),
        );

        // 2. Simpan notes/keluhan utama ke field detail rontgen
        if (notes.trim()) {
          requests.push(updateRontgenDetail(rontgenId, notes));
        }
      } else {
        // ── Mode Upload Foto (behaviour lama) ───────────────────────────────
        requests.push(
          uploadFotoRontgen(
            rontgenId,
            capturedPhotos,
            dokId,
            notes,
            selectedTags,
          ),
        );
      }

      // Pemeriksaan Fisik — disimpan di kedua mode
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

      // Extra Oral — disimpan di kedua mode
      requests.push(
        saveExtraOralExamination({
          rontgen_id: rontgenId,
          ...mapExtraOralToPayload(extraOral),
        }),
      );

      const results = await Promise.all(requests);

      // Cek sukses: hasil pertama adalah uploadFoto atau updateStatus
      const firstRes = results[0];
      if (firstRes?.success !== false) {
        setShowSuccess(true);
      } else {
        alert(firstRes.message || "Gagal menyimpan data");
      }
    } catch (error) {
      console.log("Error handleSave:", error);
      alert("Gagal konek ke server");
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBerhasil
        visible={showSuccess}
        title={tanpaFoto ? "Data Tersimpan!" : "Upload Foto Berhasil!"}
        subtitle={
          tanpaFoto
            ? "Data pemeriksaan telah tersimpan. Pasien dapat di-print."
            : "Data pemeriksaan telah tersimpan"
        }
        onDone={handleSuccessDone}
      />

      <Modal visible={kameraVisible} animationType="slide" statusBarTranslucent>
        <KameraScreen
          onCapture={handleCapture}
          onClose={() => setKameraVisible(false)}
          sectionColor={
            fotoSections.find((s) => s.key === aktivSection)?.color || "#34B3B9"
          }
        />
      </Modal>

      {/* Header — judul berbeda tergantung mode */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {tanpaFoto ? "Data Pemeriksaan" : "Upload Foto Pasien"}
        </Text>
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
            <Text style={styles.pasienNama}>{pasienNama}</Text>
            <Text style={styles.pasienSub}>
              No. {pasienNo} · {pasienJam} · {pasienUmur}
            </Text>

            {/* Badge mode tanpa foto */}
            {tanpaFoto ? (
              <View style={styles.fotoTagRow}>
                <View style={[styles.fotoTag, { backgroundColor: "#edfaf3" }]}>
                  <Text style={[styles.fotoTagText, { color: "#1b8a5a" }]}>
                    Selesai · Tanpa Foto
                  </Text>
                </View>
              </View>
            ) : (
              /* Badge jenis foto yang diminta */
              <View style={styles.fotoTagRow}>
                {fotoKeys.map((key) => {
                  const color = fotoTagColor[key] || {
                    bg: "#E2F0F1",
                    text: "#34B3B9",
                  };
                  return (
                    <View
                      key={key}
                      style={[styles.fotoTag, { backgroundColor: color.bg }]}
                    >
                      <Text style={[styles.fotoTagText, { color: color.text }]}>
                        {fotoLabel[key]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ━━━━━ INFO BANNER — hanya tampil saat mode tanpa foto ━━━━━ */}
        {tanpaFoto && (
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#1b8a5a"
            />
            <Text style={styles.infoBannerText}>
              Tidak ada foto yang perlu diupload. Silakan lengkapi data
              pemeriksaan di bawah agar Medical Note dapat dicetak.
            </Text>
          </View>
        )}

        {/* ━━━━━ FOTO SECTIONS — hanya tampil jika bukan mode tanpa foto ━━━━━ */}
        {!tanpaFoto &&
          activeSections.map((section) => {
            const photos = capturedPhotos[section.key] || [];
            const isFull = photos.length >= 10;

            return (
              <View key={section.key} style={styles.section}>
                {/* Header label + badge count */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: section.color }]}>
                    {section.label}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: section.color },
                    ]}
                  >
                    <Text style={styles.countText}>{photos.length}/10</Text>
                  </View>
                </View>

                {/* Frame dashed */}
                <View
                  style={[
                    styles.uploadBox,
                    { borderColor: section.borderColor },
                  ]}
                >
                  {photos.length === 0 ? (
                    /* ── Kosong: tampilkan tombol Camera & Gallery ── */
                    <>
                      <View style={styles.uploadBtnRow}>
                        <TouchableOpacity
                          style={styles.uploadBtn}
                          onPress={() => bukaKamera(section.key)}
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
                        {section.label.toLowerCase()} files (JPEG, PNG up to
                        10MB)
                      </Text>
                    </>
                  ) : (
                    /* ── Ada foto: grid foto + tombol Tambah ── */
                    <>
                      <View style={styles.photoGrid}>
                        {photos.map((uri, index) => (
                          <View key={index} style={styles.photoItem}>
                            <Image
                              source={{ uri }}
                              style={styles.photoImg}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.deleteBadge}
                              onPress={() => hapusFoto(section.key, index)}
                            >
                              <Ionicons name="close" size={11} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ))}

                        {/* Tombol Tambah */}
                        {!isFull && (
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
                        Tap foto untuk hapus · Tap + untuk tambah
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
              <Text style={styles.dataMainVal}>{pasienNama}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dataLabel}>Age</Text>
              <Text style={styles.dataMainVal}>
                {pasienUmur.split(" ")[0]} Years
              </Text>
            </View>
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
                />
                <Text>/</Text>
                <TextInput
                  style={styles.fInputSmall}
                  keyboardType="numeric"
                  value={beratBadan}
                  onChangeText={setBeratBadan}
                  placeholder="60"
                  placeholderTextColor="#ccc"
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
                />
                <Text style={styles.fUnit}>°C</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ━━━━━ KELUHAN UTAMA ━━━━━ */}
        <Text style={styles.subTitleBold}>KELUHAN UTAMA</Text>
        <TextInput
          style={styles.textAreaFigma}
          placeholder="Contoh : Gigi depan goyang, gigi taring goyang..."
          multiline
          value={notes}
          onChangeText={setNotes}
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
          />
          <ExtraOralRow
            label="Kulit wajah & leher"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.kulit}
            onSelect={(v) => setExtraOral({ ...extraOral, kulit: v })}
          />
          <ExtraOralRow
            label="Kelenjar limfa submandibula"
            leftOption="Teraba"
            rightOption="Tidak teraba"
            active={extraOral.limfa}
            onSelect={(v) => setExtraOral({ ...extraOral, limfa: v })}
          />
          <ExtraOralRow
            label="Sendi Rahang / TMJ"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.tmj}
            onSelect={(v) => setExtraOral({ ...extraOral, tmj: v })}
          />
          <ExtraOralRow
            label="Massa otot pengunyah palpasi otot masseter & temporalis"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.massaOtot}
            onSelect={(v) => setExtraOral({ ...extraOral, massaOtot: v })}
          />
          <ExtraOralRow
            label="Pembengkakan area wajah atau leher"
            leftOption="Ada"
            rightOption="Tidak ada"
            active={extraOral.pembengkakan}
            onSelect={(v) => setExtraOral({ ...extraOral, pembengkakan: v })}
          />
          <ExtraOralRow
            label="Kondisi mata & hidung"
            leftOption="Normal"
            rightOption="Tidak normal"
            active={extraOral.mataHidung}
            onSelect={(v) => setExtraOral({ ...extraOral, mataHidung: v })}
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
                nama: pasienNama,
                no: pasienNo,
              },
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

        {/* ━━━━━ SELECT DOKTER — tampil di semua mode ━━━━━ */}
        <Text style={styles.subTitleBold}>SELECT DOKTER</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDokterDropdown(!showDokterDropdown)}
        >
          <Text style={styles.dropdownText}>
            {selectedDokter || "Pilih Dokter"}
          </Text>
          <Ionicons
            name={showDokterDropdown ? "chevron-up" : "chevron-down"}
            size={16}
            color="#888"
          />
        </TouchableOpacity>
        {showDokterDropdown && (
          <View style={styles.dropdownList}>
            {dokterList.map((d: any) => (
              <TouchableOpacity
                key={d.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedDokter(d.name);
                  setSelectedDokterObj(d);
                  setShowDokterDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{d.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tags — tampil di semua mode */}
        <View style={styles.tagRow}>
          {tagList.map((tag: any) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tagChip,
                selectedTags.includes(tag.id) && styles.tagChipActive,
              ]}
              onPress={() => toggleTag(tag.id)}
            >
              <Text
                style={[
                  styles.tagChipText,
                  selectedTags.includes(tag.id) && styles.tagChipTextActive,
                ]}
              >
                #{tag.tag_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ━━━━━ SAVE BUTTON ━━━━━ */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>
                {tanpaFoto ? "Simpan Data Pemeriksaan" : "Save Data"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── ExtraOralRow Component ──────────────────────────────────────────────────
const ExtraOralRow = ({
  label,
  leftOption,
  rightOption,
  active,
  onSelect,
}: ExtraOralRowProps) => (
  <View style={styles.exRowContainer}>
    <View style={styles.exRow}>
      <Text style={styles.exLabel}>{label}</Text>
      <View style={styles.exToggle}>
        <TouchableOpacity
          onPress={() => onSelect(leftOption)}
          style={[styles.exBtn, active === leftOption && styles.exBtnActive]}
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
          onPress={() => onSelect(rightOption)}
          style={[styles.exBtn, active === rightOption && styles.exBtnActive]}
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

// ─── Styles ──────────────────────────────────────────────────────────────────
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
    marginBottom: 16,
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
  fotoTagRow: { flexDirection: "row", gap: 5, marginTop: 4, flexWrap: "wrap" },
  fotoTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  fotoTagText: { fontSize: 10, fontWeight: "600" },

  // Info Banner (mode tanpa foto)
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#edfaf3",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#a8e6c9",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#1b8a5a",
    lineHeight: 20,
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

  // Upload box — frame dashed
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fff",
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
  uploadHint: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "center",
    marginTop: 10,
  },

  // Grid foto
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
  photoImg: { width: "100%", height: "100%", borderRadius: 12 },
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
  tambahBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  tambahLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },

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
  pasienThumb: { width: 45, height: 45, borderRadius: 10 },
  dataLabel: { fontSize: 10, color: "#aaa" },
  dataMainVal: { fontSize: 16, fontWeight: "800" },
  avatarSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
  },

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
  fUnit: { fontSize: 8, fontWeight: "700", marginLeft: 2, color: "#888" },

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

  // Lembar Pemeriksaan Gigi
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

  // Dokter Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 15,
  },
  dropdownText: { flex: 1, fontSize: 14 },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginTop: -10,
    marginBottom: 15,
    padding: 10,
  },
  dropdownItem: { paddingVertical: 10 },
  dropdownItemText: { fontSize: 14 },

  // Tags
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 30 },
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
  tagChipText: { fontSize: 12, color: "#888" },
  tagChipTextActive: { color: "#34B3B9", fontWeight: "600" },

  // Save Button
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
