import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const statusOptions = [
  {
    key: "menunggu",
    label: "Menunggu",
    desc: "Pasien masih menunggu giliran.",
    icon: require("../../assets/icons/icon_opt_menunggu.png"),
    iconBg: "#FFF3E0",
  },
  {
    key: "ruangan",
    label: "Masuk Ruangan",
    desc: "Pasien sedang diperiksa dokter",
    icon: require("../../assets/icons/icon_opt_ruangan.png"),
    iconBg: "#F5E6D3",
  },
  {
    key: "rontgen",
    label: "Upload Foto",
    desc: "Dokter merekomendasikan dokumentasi foto",
    icon: require("../../assets/icons/icon_opt_rontgen.png"),
    iconBg: "#fde8e8",
  },
  {
    key: "selesai",
    label: "Selesai (Tanpa Foto)",
    desc: "Pasien selesai, tidak perlu dokumentasi foto",
    icon: require("../../assets/icons/icon_opt_selesai.png"),
    iconBg: "#E8F8EF",
  },
];

const fotoOptions = [
  {
    key: "rontgen_xray",
    label: "Rontgen",
    desc: "Foto X-Ray gigi",
    icon: require("../../assets/icons/icon_foto_rontgen.png"),
    iconBg: "#E2F0F1",
  },
  {
    key: "profil_gigi",
    label: "Profil Gigi",
    desc: "Foto keseluruhan gigi",
    icon: require("../../assets/icons/icon_foto_profil.png"),
    iconBg: "#FFF3E0",
  },
  {
    key: "intraoral",
    label: "Intraoral",
    desc: "Foto gigi di dalam mulut",
    icon: require("../../assets/icons/icon_foto_intraoral.png"),
    iconBg: "#F5E6D3",
  },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface Pasien {
  id: number;
  reservasiId?: number;
  rontgenId?: number;
  nama: string;
  no: string;
  jam: string;
  umur: string;
  status: string;
  patientId?: number;
  doctorId?: number;
  fotoKeys?: string[];
}

interface Props {
  visible: boolean;
  pasien: Pasien | null;
  onClose: () => void;
  /**
   * onSave dipanggil saat user tekan Simpan.
   *
   * Parent (PasienHadirList) bertanggung jawab:
   * - "menunggu" / "ruangan" → update status saja, return null
   * - "rontgen"  → createRontgen(status: "perlu_upload_foto", targetFoto),
   *                return { rontgenId, doctorId }
   * - "selesai"  → createRontgen(status: "selesai"),
   *                return { rontgenId, doctorId }
   *
   * Setelah resolve, komponen ini yang melakukan router.push ke
   * UploadFotoPasien sehingga parent tidak perlu tahu soal navigasi.
   */
  onSave: (
    pasienId: number,
    statusKey: string,
    fotoKeys?: string[],
    tanpaFoto?: boolean,
  ) => Promise<{ rontgenId: number; doctorId?: number } | null>;
}

// ── Komponen ───────────────────────────────────────────────────────────────────

export default function UbahStatusPasien({
  visible,
  pasien,
  onClose,
  onSave,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFoto, setSelectedFoto] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  if (!pasien) return null;

  const toggleFoto = (key: string) => {
    setSelectedFoto((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Tombol Simpan aktif jika sudah pilih status,
  // dan jika "rontgen" minimal 1 jenis foto harus dipilih.
  const canSave =
    selected !== null && (selected !== "rontgen" || selectedFoto.length > 0);

  const handleSave = async () => {
    if (!canSave || !selected || saving) return;

    const isTanpaFoto = selected === "selesai";
    // Status "rontgen" dan "selesai" keduanya butuh navigate ke UploadFotoPasien
    const needsNavigate = selected === "rontgen" || selected === "selesai";
    const fotoKeys = selected === "rontgen" ? selectedFoto : undefined;

    setSaving(true);
    try {
      // Panggil handler di parent → createRontgen / updateStatus
      const result = await onSave(pasien.id, selected, fotoKeys, isTanpaFoto);

      // Tutup modal lebih dulu
      handleClose();

      // Navigate ke UploadFotoPasien jika status butuh pengisian data pemeriksaan
      if (needsNavigate && result?.rontgenId) {
        router.push({
          pathname: "/(admin)/Uploadfotopasien ",
          params: {
            rontgenId: result.rontgenId,
            doctorId: result.doctorId ?? pasien.doctorId ?? 0,
            nama: pasien.nama,
            no: pasien.no,
            jam: pasien.jam,
            umur: pasien.umur,
            // fotoKeys: kosong ("") saat tanpaFoto → section upload tidak muncul
            fotoKeys: isTanpaFoto ? "" : (fotoKeys ?? []).join(","),
            // Flag mode: "true" = selesai tanpa foto, "false" = upload foto biasa
            tanpaFoto: isTanpaFoto ? "true" : "false",
          },
        });
      }
    } catch (error) {
      console.log("UbahStatusPasien handleSave error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelected(null);
    setSelectedFoto([]);
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.3)" translucent />
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Info Pasien ────────────────────────────────────────────── */}
          <View style={styles.pasienCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#2E9DA4" />
            </View>
            <View style={styles.pasienInfo}>
              <Text style={styles.pasienNama}>{pasien.nama}</Text>
              <Text style={styles.pasienSub}>
                No. {pasien.no} · {pasien.jam} · {pasien.umur}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>Ubah Status Pasien</Text>

          {/* ── Opsi Status ────────────────────────────────────────────── */}
          {statusOptions.map((opt) => {
            const isSelected = selected === opt.key;
            const isRontgen = opt.key === "rontgen" && isSelected;
            const isSelesai = opt.key === "selesai" && isSelected;

            return (
              <View key={opt.key}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    isSelected &&
                      !isRontgen &&
                      !isSelesai &&
                      styles.optionCardSelected,
                    isRontgen && styles.optionCardRontgen,
                    isSelesai && styles.optionCardSelesai,
                  ]}
                  onPress={() => setSelected(opt.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.optionIcon, { backgroundColor: opt.iconBg }]}
                  >
                    <Image
                      source={opt.icon}
                      style={styles.optionImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isRontgen && styles.optionLabelRontgen,
                        isSelesai && styles.optionLabelSelesai,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDesc,
                        isRontgen && styles.optionDescRontgen,
                        isSelesai && styles.optionDescSelesai,
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      isSelected &&
                        !isRontgen &&
                        !isSelesai &&
                        styles.radioSelected,
                      isRontgen && styles.radioRontgen,
                      isSelesai && styles.radioSelesai,
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioDot,
                          isRontgen && styles.radioDotRontgen,
                          isSelesai && styles.radioDotSelesai,
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Sub-panel pilih jenis foto — hanya jika "Upload Foto" */}
                {isRontgen && (
                  <View style={styles.fotoSection}>
                    <Text style={styles.fotoTitle}>
                      Pilih Jenis Foto (bisa lebih dari 1)
                    </Text>
                    {fotoOptions.map((foto) => {
                      const isChecked = selectedFoto.includes(foto.key);
                      return (
                        <TouchableOpacity
                          key={foto.key}
                          style={styles.fotoCard}
                          onPress={() => toggleFoto(foto.key)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.fotoIcon,
                              { backgroundColor: foto.iconBg },
                            ]}
                          >
                            <Image
                              source={foto.icon}
                              style={styles.fotoImg}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.fotoText}>
                            <Text style={styles.fotoLabel}>{foto.label}</Text>
                            <Text style={styles.fotoDesc}>{foto.desc}</Text>
                          </View>
                          <View
                            style={[
                              styles.checkbox,
                              isChecked && styles.checkboxChecked,
                            ]}
                          >
                            {isChecked && (
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color="#fff"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Info banner — hanya jika "Selesai (Tanpa Foto)" dipilih */}
                {isSelesai && (
                  <View style={styles.selesaiInfoBox}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#1b8a5a"
                    />
                    <Text style={styles.selesaiInfoText}>
                      Kamu tetap akan diarahkan ke form pemeriksaan untuk
                      mengisi data fisik, keluhan, dan extra oral sebelum
                      mencetak Medical Note.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* ── Tombol Aksi ────────────────────────────────────────────── */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnBatal}
              onPress={handleClose}
              disabled={saving}
            >
              <Text style={styles.btnBatalText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btnSimpan,
                (!canSave || saving) && styles.btnSimpanDisabled,
              ]}
              onPress={handleSave}
              disabled={!canSave || saving}
            >
              <Text style={styles.btnSimpanText}>
                {saving ? "Menyimpan..." : "Simpan Status"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 16,
  },

  // Pasien Card
  pasienCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2F0F1",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  pasienInfo: { flex: 1 },
  pasienNama: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  pasienSub: { fontSize: 12, color: "#555" },

  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 14,
  },

  // Option Card
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  optionCardSelected: { borderColor: "#34B3B9", backgroundColor: "#F0FAFA" },
  optionCardRontgen: { borderColor: "#e05c5c", backgroundColor: "#fde8e8" },
  optionCardSelesai: { borderColor: "#1b8a5a", backgroundColor: "#edfaf3" },

  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionImg: { width: 22, height: 22 },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  optionLabelRontgen: { color: "#e05c5c" },
  optionLabelSelesai: { color: "#1b8a5a" },
  optionDesc: { fontSize: 12, color: "#888" },
  optionDescRontgen: { color: "#e05c5c" },
  optionDescSelesai: { color: "#1b8a5a" },

  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: { borderColor: "#34B3B9" },
  radioRontgen: { borderColor: "#e05c5c" },
  radioSelesai: { borderColor: "#1b8a5a" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34B3B9",
  },
  radioDotRontgen: { backgroundColor: "#e05c5c" },
  radioDotSelesai: { backgroundColor: "#1b8a5a" },

  // Sub-panel jenis foto
  fotoSection: {
    backgroundColor: "#E8F5F5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    marginTop: -4,
    gap: 8,
  },
  fotoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E9DA4",
    marginBottom: 6,
  },
  fotoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  fotoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fotoImg: { width: 20, height: 20 },
  fotoText: { flex: 1 },
  fotoLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  fotoDesc: { fontSize: 11, color: "#888" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#34B3B9", borderColor: "#34B3B9" },

  // Info banner selesai tanpa foto
  selesaiInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#edfaf3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    marginTop: -4,
    gap: 8,
    borderWidth: 1,
    borderColor: "#a8e6c9",
  },
  selesaiInfoText: { flex: 1, fontSize: 12, color: "#1b8a5a", lineHeight: 18 },

  // Tombol bawah
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 8 },
  btnBatal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  btnBatalText: { fontSize: 14, fontWeight: "600", color: "#555" },
  btnSimpan: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#34B3B9",
    alignItems: "center",
  },
  btnSimpanDisabled: { backgroundColor: "#A8DADC" },
  btnSimpanText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
});
