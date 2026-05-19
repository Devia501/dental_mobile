import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  createDentalExamination,
  getDentalExaminations,
  updateDentalExamination,
} from "../../services/dentalExaminationService";

const { width: W } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────

interface KunjunganData {
  examId?: number | null;
  visit_number: number;
  tanggal: string;
  subyektif: string;
  obyektif: string;
  assesment: string;
  planning: string;
  treatment: string;
  fotoBefore?: string;
  fotoAfter?: string;
  status: "selesai" | "draft";
}

interface SOAPInputProps {
  icon: any;
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  editable?: boolean;
}

// ─── SOAPInput ───────────────────────────────────────────────────────────────

const SOAPInput = ({
  icon,
  label,
  placeholder,
  value,
  onChange,
  editable = true,
}: SOAPInputProps) => (
  <View style={styles.inputGroup}>
    <View style={styles.labelIconRow}>
      <Image source={icon} style={styles.inputIcon} />
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <TextInput
      style={[styles.textInput, !editable && styles.textInputReadonly]}
      placeholder={placeholder}
      placeholderTextColor="#bbb"
      multiline
      value={value}
      onChangeText={onChange}
      editable={editable}
    />
  </View>
);

// ─── SOAP fields config ──────────────────────────────────────────────────────

const SOAP_FIELDS = [
  {
    icon: require("../../assets/icons/Chat.png"),
    label: "S - Subyektif",
    field: "subyektif" as const,
    placeholder: "Isi S - Subyektif...",
  },
  {
    icon: require("../../assets/icons/Search.png"),
    label: "O - Obyektif",
    field: "obyektif" as const,
    placeholder: "Isi O - Obyektif...",
  },
  {
    icon: require("../../assets/icons/Tooth.png"),
    label: "A - Assesment",
    field: "assesment" as const,
    placeholder: "Isi A - Assessment...",
  },
  {
    icon: require("../../assets/icons/Settings.png"),
    label: "P - Planning",
    field: "planning" as const,
    placeholder: "Isi P - Planning...",
  },
  {
    icon: require("../../assets/icons/Treatment.png"),
    label: "Tx - Treatment",
    field: "treatment" as const,
    placeholder: "Isi Tx - Treatment...",
  },
];

type FormItem = {
  tanggal: string;
  subyektif: string;
  obyektif: string;
  assesment: string;
  planning: string;
  treatment: string;
  fotoBefore: string;
  fotoAfter: string;
};

const emptyForm = (): FormItem => ({
  tanggal: new Date().toISOString().split("T")[0],
  subyektif: "",
  obyektif: "",
  assesment: "",
  planning: "",
  treatment: "",
  fotoBefore: "",
  fotoAfter: "",
});

// ─── Main ────────────────────────────────────────────────────────────────────

export default function LembarPemeriksaanGigi() {
  const insets = useSafeAreaInsets();
  const rawParams = useLocalSearchParams<{
    rontgenId: string;
    nama?: string;
    no?: string;
  }>();

  const rontgenId = Array.isArray(rawParams.rontgenId)
    ? rawParams.rontgenId[0]
    : rawParams.rontgenId;
  const parsedRontgenId = Number(rontgenId) || 0;
  const pasienNama = (rawParams.nama as string) || "Pasien";
  const pasienNo = (rawParams.no as string) || "-";

  // ── Global state ──
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Mode: "form" = belum ada data  |  "list" = sudah ada data ──
  const [mode, setMode] = useState<"form" | "list">("form");
  const [kunjunganList, setKunjunganList] = useState<KunjunganData[]>([]);

  // ── State MODE FORM ──
  const [formList, setFormList] = useState<FormItem[]>([emptyForm()]);
  const [kameraFormVisible, setKameraFormVisible] = useState(false);
  const [formKunjIdx, setFormKunjIdx] = useState(0);
  const [formPhotoType, setFormPhotoType] = useState<
    "fotoBefore" | "fotoAfter" | null
  >(null);

  // ── State MODE LIST — modal detail/edit ──
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [selectedKunjungan, setSelectedKunjungan] =
    useState<KunjunganData | null>(null);
  const [editData, setEditData] = useState<KunjunganData | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [kameraEditVisible, setKameraEditVisible] = useState(false);
  const [editPhotoType, setEditPhotoType] = useState<
    "fotoBefore" | "fotoAfter" | null
  >(null);

  // ── State MODE LIST — modal tambah baru ──
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newKunjungan, setNewKunjungan] = useState<FormItem>(emptyForm());
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [kameraAddVisible, setKameraAddVisible] = useState(false);
  const [addPhotoType, setAddPhotoType] = useState<
    "fotoBefore" | "fotoAfter" | null
  >(null);

  // ── Date picker ──
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTarget, setDateTarget] = useState<
    { source: "form"; idx: number } | { source: "edit" } | { source: "add" }
  >({ source: "form", idx: 0 });

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!parsedRontgenId) {
      setLoadingData(false);
      return;
    }
    fetchExaminations();
  }, [parsedRontgenId]);

  const fetchExaminations = async () => {
    try {
      setLoadingData(true);
      const res = await getDentalExaminations(parsedRontgenId);
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setKunjunganList(
          res.data.map((item: any) => ({
            examId: item.id,
            visit_number: item.visit_number,
            tanggal: item.visit_date || "",
            subyektif: item.subjective || "",
            obyektif: item.objective || "",
            assesment: item.assessment || "",
            planning: item.planning || "",
            treatment: item.treatment || "",
            // foto_before_url & foto_after_url sudah dikirim backend via relasi dental_examination_id
            fotoBefore: item.foto_before_url || "",
            fotoAfter: item.foto_after_url || "",
            status: "selesai",
          })),
        );
        setMode("list");
      } else {
        setMode("form");
      }
    } catch (e) {
      console.error(e);
      setMode("form");
    } finally {
      setLoadingData(false);
    }
  };

  // ─── Helpers form ────────────────────────────────────────────────────────────

  const updateFormItem = (idx: number, field: keyof FormItem, value: string) =>
    setFormList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );

  // ─── Simpan semua — MODE FORM ────────────────────────────────────────────────

  const handleSaveForm = async () => {
    if (!parsedRontgenId)
      return Alert.alert("Error", "Rontgen ID tidak valid.");
    setIsSaving(true);
    try {
      for (let i = 0; i < formList.length; i++) {
        const k = formList[i];
        await createDentalExamination({
          rontgen_id: parsedRontgenId,
          visit_number: i + 1,
          visit_date: k.tanggal || null,
          subjective: k.subyektif || null,
          objective: k.obyektif || null,
          assessment: k.assesment || null,
          planning: k.planning || null,
          treatment: k.treatment || null,
          foto_before: k.fotoBefore || null,
          foto_after: k.fotoAfter || null,
        });
      }
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Modal detail/edit — MODE LIST ───────────────────────────────────────────

  const bukaDetail = (k: KunjunganData) => {
    setSelectedKunjungan(k);
    setModalMode("view");
    setModalVisible(true);
  };

  const simpanEdit = async () => {
    if (!editData?.examId) return;
    setIsSavingModal(true);
    try {
      const res = await updateDentalExamination(editData.examId, {
        visit_date: editData.tanggal,
        subjective: editData.subyektif,
        objective: editData.obyektif,
        assessment: editData.assesment,
        planning: editData.planning,
        treatment: editData.treatment,
        // Kirim foto hanya jika URI lokal (foto baru dipilih user)
        // Jika masih http:// (foto lama), service sudah skip otomatis
        foto_before: editData.fotoBefore || null,
        foto_after: editData.fotoAfter || null,
      });
      if (res?.success) {
        // Update state lokal dengan data terbaru dari response (termasuk URL foto baru)
        const updatedData: KunjunganData = {
          ...editData,
          fotoBefore: res.data?.foto_before_url || editData.fotoBefore,
          fotoAfter: res.data?.foto_after_url || editData.fotoAfter,
        };
        setKunjunganList((prev) =>
          prev.map((k) => (k.examId === editData.examId ? updatedData : k)),
        );
        setSelectedKunjungan(updatedData);
        setModalMode("view");
        setEditData(null);
      } else Alert.alert("Gagal", res?.message || "Gagal menyimpan perubahan.");
    } catch {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSavingModal(false);
    }
  };

  // ─── Tambah kunjungan baru — MODE LIST ───────────────────────────────────────

  const simpanKunjunganBaru = async () => {
    if (!parsedRontgenId)
      return Alert.alert("Error", "Rontgen ID tidak valid.");
    setIsSavingAdd(true);
    try {
      const res = await createDentalExamination({
        rontgen_id: parsedRontgenId,
        visit_number: kunjunganList.length + 1,
        visit_date: newKunjungan.tanggal || null,
        subjective: newKunjungan.subyektif || null,
        objective: newKunjungan.obyektif || null,
        assessment: newKunjungan.assesment || null,
        planning: newKunjungan.planning || null,
        treatment: newKunjungan.treatment || null,
        foto_before: newKunjungan.fotoBefore || null,
        foto_after: newKunjungan.fotoAfter || null,
      });
      if (res?.success) {
        await fetchExaminations(); // reload untuk dapat foto_before_url & foto_after_url terbaru
        setAddModalVisible(false);
        setNewKunjungan(emptyForm());
      } else Alert.alert("Gagal", res?.message || "Gagal menyimpan kunjungan.");
    } catch {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSavingAdd(false);
    }
  };

  // ─── Date picker ─────────────────────────────────────────────────────────────

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;
    const formatted = selectedDate.toISOString().split("T")[0];
    if (dateTarget.source === "form")
      updateFormItem(dateTarget.idx, "tanggal", formatted);
    else if (dateTarget.source === "edit" && editData)
      setEditData({ ...editData, tanggal: formatted });
    else if (dateTarget.source === "add")
      setNewKunjungan((prev) => ({ ...prev, tanggal: formatted }));
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loadingData)
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator color="#34B3B9" size="large" />
        <Text style={{ color: "#888", marginTop: 12 }}>Memuat data...</Text>
      </View>
    );

  // ════════════════════════════════════════════════════════════════════════════
  //  MODE FORM — belum ada data
  // ════════════════════════════════════════════════════════════════════════════

  if (mode === "form")
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Kamera */}
        <Modal
          visible={kameraFormVisible}
          animationType="slide"
          statusBarTranslucent
        >
          <KameraScreen
            onCapture={(uri) => {
              if (formPhotoType)
                updateFormItem(formKunjIdx, formPhotoType, uri);
              setKameraFormVisible(false);
            }}
            onClose={() => setKameraFormVisible(false)}
            sectionColor="#34B3B9"
          />
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-circle" size={40} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lembar Pemeriksaan Gigi</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tips */}
          <View style={styles.tipsBox}>
            <Image
              source={require("../../assets/icons/Pushpin.png")}
              style={styles.pinIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipsTitle}>Isi sesuai kunjungan.</Text>
              <Text style={styles.tipsSub}>
                Format SOAP : Subyektif · Obyektif · Assessment · Planning ·
                Treatment
              </Text>
            </View>
          </View>

          {/* Form tiap kunjungan */}
          {formList.map((k, idx) => {
            const displayId = idx + 1;
            return (
              <View key={idx} style={styles.kunjunganWrapper}>
                <View style={styles.kunjunganLabelBox}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>{displayId}</Text>
                  </View>
                  <Text style={styles.kunjunganLabelText}>
                    Kunjungan #{displayId}
                  </Text>
                </View>

                {/* Tanggal */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelIconRow}>
                    <Image
                      source={require("../../assets/icons/Calendar.png")}
                      style={styles.inputIcon}
                    />
                    <Text style={styles.inputLabel}>Tanggal</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.datePickerPlaceholder}
                    onPress={() => {
                      setDateTarget({ source: "form", idx });
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateText}>
                      {k.tanggal || "Select date"}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#34B3B9"
                    />
                  </TouchableOpacity>
                </View>

                {/* SOAP */}
                {SOAP_FIELDS.map(({ icon, label, field, placeholder }) => (
                  <SOAPInput
                    key={field}
                    icon={icon}
                    label={label}
                    placeholder={placeholder}
                    value={k[field] ?? ""}
                    onChange={(val) =>
                      updateFormItem(idx, field as keyof FormItem, val)
                    }
                  />
                ))}

                {/* Foto */}
                <View style={styles.dokumentasiSection}>
                  <View style={styles.labelIconRow}>
                    <Ionicons name="camera-outline" size={20} color="#1a1a1a" />
                    <Text style={styles.inputLabel}>Dokumentasi Foto</Text>
                  </View>
                  {(k.fotoBefore || k.fotoAfter) && (
                    <View style={styles.photoFrameRow}>
                      {k.fotoBefore ? (
                        <View style={styles.photoFrame}>
                          <Text style={styles.frameLabel}>Foto Before</Text>
                          <View style={styles.imageBox}>
                            <Image
                              source={{ uri: k.fotoBefore }}
                              style={styles.imageFill}
                            />
                          </View>
                        </View>
                      ) : null}
                      {k.fotoAfter ? (
                        <View style={styles.photoFrame}>
                          <Text style={styles.frameLabel}>Foto After</Text>
                          <View style={styles.imageBox}>
                            <Image
                              source={{ uri: k.fotoAfter }}
                              style={styles.imageFill}
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )}
                  <View style={styles.uploadBtnRow}>
                    <TouchableOpacity
                      style={styles.btnUploadAction}
                      onPress={() => {
                        setFormKunjIdx(idx);
                        setFormPhotoType("fotoBefore");
                        setKameraFormVisible(true);
                      }}
                    >
                      <Text style={styles.btnUploadText}>
                        {k.fotoBefore
                          ? "Ganti Foto Before"
                          : "Upload Foto Before"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnUploadAction}
                      onPress={() => {
                        setFormKunjIdx(idx);
                        setFormPhotoType("fotoAfter");
                        setKameraFormVisible(true);
                      }}
                    >
                      <Text style={styles.btnUploadText}>
                        {k.fotoAfter ? "Ganti Foto After" : "Upload Foto After"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => setFormList((prev) => [...prev, emptyForm()])}
          >
            <Ionicons name="add-circle" size={28} color="#fff" />
            <Text style={styles.btnAddText}>Tambah Kunjungan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSave, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveForm}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save" size={22} color="#fff" />
                <Text style={styles.btnSaveText}>
                  Simpan Lembar Pemeriksaan Gigi
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        <StatusBerhasil
          visible={showSuccess}
          title="Berhasil Disimpan"
          subtitle="Data pemeriksaan gigi telah berhasil dicatat."
          onDone={() => {
            setShowSuccess(false);
            router.back();
          }}
        />
      </View>
    );

  // ════════════════════════════════════════════════════════════════════════════
  //  MODE LIST — sudah ada data
  // ════════════════════════════════════════════════════════════════════════════

  const selesaiCount = kunjunganList.filter(
    (k) => k.status === "selesai",
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Kamera edit */}
      <Modal
        visible={kameraEditVisible}
        animationType="slide"
        statusBarTranslucent
      >
        <KameraScreen
          onCapture={(uri) => {
            if (editData && editPhotoType)
              setEditData({ ...editData, [editPhotoType]: uri });
            setKameraEditVisible(false);
          }}
          onClose={() => setKameraEditVisible(false)}
          sectionColor="#34B3B9"
        />
      </Modal>

      {/* Kamera tambah */}
      <Modal
        visible={kameraAddVisible}
        animationType="slide"
        statusBarTranslucent
      >
        <KameraScreen
          onCapture={(uri) => {
            if (addPhotoType)
              setNewKunjungan((prev) => ({ ...prev, [addPhotoType!]: uri }));
            setKameraAddVisible(false);
          }}
          onClose={() => setKameraAddVisible(false)}
          sectionColor="#34B3B9"
        />
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-circle" size={40} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>Lembar Pemeriksaan Gigi</Text>
          <Text style={styles.headerSub}>
            {pasienNama} - No.{pasienNo}
          </Text>
        </View>
        <View style={styles.badgeSelesai}>
          <Text style={styles.badgeText}>
            {selesaiCount}/{kunjunganList.length} selesai
          </Text>
        </View>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listScrollContent}
      >
        {kunjunganList.map((k, index) => (
          <TouchableOpacity
            key={k.examId ?? index}
            style={styles.kunjunganCard}
            onPress={() => bukaDetail(k)}
            activeOpacity={0.85}
          >
            <View style={styles.kunjunganLeft}>
              <View style={styles.cardNumberCircle}>
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.cardNumberText}>{k.visit_number}</Text>
              </View>
              <View>
                <Text style={styles.kunjunganTitle}>
                  Kunjungan #{k.visit_number}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <Ionicons name="calendar-outline" size={12} color="#888" />
                  <Text style={styles.kunjunganTanggal}>
                    {k.tanggal || "-"}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Selesai</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.btnAdd}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.btnAddText}>Tambah Kunjungan Baru</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom bar — di mode list setiap aksi sudah auto-save lewat modal,
          tombol ini hanya untuk kembali ke halaman sebelumnya */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.btnSave} onPress={() => router.back()}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.btnSaveText}>Selesai</Text>
        </TouchableOpacity>
      </View>

      {/* ══ MODAL DETAIL / EDIT ═════════════════════════════════════════════════ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setModalVisible(false);
          setModalMode("view");
          setEditData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() =>
                  modalMode === "edit"
                    ? (setModalMode("view"), setEditData(null))
                    : setModalVisible(false)
                }
              >
                <Ionicons
                  name={modalMode === "edit" ? "arrow-back" : "close"}
                  size={26}
                  color="#000"
                />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.modalTitle}>
                  Kunjungan #{selectedKunjungan?.visit_number}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="calendar-outline" size={11} color="#888" />
                  <Text style={styles.modalSubtitle}>
                    {(modalMode === "edit"
                      ? editData?.tanggal
                      : selectedKunjungan?.tanggal) || "-"}
                  </Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Selesai</Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              {modalMode === "view" ? (
                // ── VIEW MODE ──
                <>
                  {/* Foto Before & After */}
                  {(selectedKunjungan?.fotoBefore ||
                    selectedKunjungan?.fotoAfter) && (
                    <View style={styles.photoFrameRow}>
                      {selectedKunjungan.fotoBefore ? (
                        <View style={styles.photoFrame}>
                          <Text style={styles.frameLabel}>Foto Before</Text>
                          <View style={styles.imageBox}>
                            <Image
                              source={{ uri: selectedKunjungan.fotoBefore }}
                              style={styles.imageFill}
                            />
                          </View>
                        </View>
                      ) : null}
                      {selectedKunjungan.fotoAfter ? (
                        <View style={styles.photoFrame}>
                          <Text style={styles.frameLabel}>Foto After</Text>
                          <View style={styles.imageBox}>
                            <Image
                              source={{ uri: selectedKunjungan.fotoAfter }}
                              style={styles.imageFill}
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {SOAP_FIELDS.map(({ icon, label, field }) => (
                    <SOAPInput
                      key={field}
                      icon={icon}
                      label={label}
                      placeholder="-"
                      value={(selectedKunjungan as any)?.[field] ?? "-"}
                      onChange={() => {}}
                      editable={false}
                    />
                  ))}

                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.btnEdit}
                      onPress={() => {
                        setEditData({ ...selectedKunjungan! });
                        setModalMode("edit");
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#34B3B9"
                      />
                      <Text style={styles.btnEditText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // ── EDIT MODE ──
                <>
                  {/* Tanggal */}
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => {
                      setDateTarget({ source: "edit" });
                      setShowDatePicker(true);
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#34B3B9"
                    />
                    <Text style={styles.datePickerText}>
                      {editData?.tanggal || "Pilih tanggal"}
                    </Text>
                  </TouchableOpacity>

                  {/* SOAP */}
                  {SOAP_FIELDS.map(({ icon, label, field, placeholder }) => (
                    <SOAPInput
                      key={field}
                      icon={icon}
                      label={label}
                      placeholder={placeholder}
                      value={(editData as any)?.[field] ?? ""}
                      onChange={(val) =>
                        setEditData((prev) =>
                          prev ? { ...prev, [field]: val } : prev,
                        )
                      }
                    />
                  ))}

                  {/* Foto */}
                  <View style={styles.dokumentasiSection}>
                    <View style={styles.labelIconRow}>
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color="#1a1a1a"
                      />
                      <Text style={styles.inputLabel}>Dokumentasi Foto</Text>
                    </View>
                    {(editData?.fotoBefore || editData?.fotoAfter) && (
                      <View style={styles.photoFrameRow}>
                        {editData.fotoBefore ? (
                          <View style={styles.photoFrame}>
                            <Text style={styles.frameLabel}>Foto Before</Text>
                            <View style={styles.imageBox}>
                              <Image
                                source={{ uri: editData.fotoBefore }}
                                style={styles.imageFill}
                              />
                            </View>
                          </View>
                        ) : null}
                        {editData.fotoAfter ? (
                          <View style={styles.photoFrame}>
                            <Text style={styles.frameLabel}>Foto After</Text>
                            <View style={styles.imageBox}>
                              <Image
                                source={{ uri: editData.fotoAfter }}
                                style={styles.imageFill}
                              />
                            </View>
                          </View>
                        ) : null}
                      </View>
                    )}
                    <View style={styles.uploadBtnRow}>
                      <TouchableOpacity
                        style={styles.btnUploadAction}
                        onPress={() => {
                          setEditPhotoType("fotoBefore");
                          setKameraEditVisible(true);
                        }}
                      >
                        <Text style={styles.btnUploadText}>
                          {editData?.fotoBefore
                            ? "Ganti Foto Before"
                            : "Upload Foto Before"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnUploadAction}
                        onPress={() => {
                          setEditPhotoType("fotoAfter");
                          setKameraEditVisible(true);
                        }}
                      >
                        <Text style={styles.btnUploadText}>
                          {editData?.fotoAfter
                            ? "Ganti Foto After"
                            : "Upload Foto After"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.btnSimpanModal,
                        isSavingModal && { opacity: 0.7 },
                      ]}
                      onPress={simpanEdit}
                      disabled={isSavingModal}
                    >
                      {isSavingModal ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons
                            name="save-outline"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.btnSimpanModalText}>Simpan</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL TAMBAH KUNJUNGAN BARU ════════════════════════════════════════ */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setAddModalVisible(false);
          setNewKunjungan(emptyForm());
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setAddModalVisible(false);
                  setNewKunjungan(emptyForm());
                }}
              >
                <Ionicons name="close" size={26} color="#000" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.modalTitle}>Tambah Kunjungan Baru</Text>
                <Text style={styles.modalSubtitle}>
                  Kunjungan #{kunjunganList.length + 1}
                </Text>
              </View>
              <View style={{ width: 26 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              {/* Tanggal */}
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => {
                  setDateTarget({ source: "add" });
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={18} color="#34B3B9" />
                <Text style={styles.datePickerText}>
                  {newKunjungan.tanggal || "Pilih tanggal"}
                </Text>
              </TouchableOpacity>

              {/* SOAP */}
              {SOAP_FIELDS.map(({ icon, label, field, placeholder }) => (
                <SOAPInput
                  key={field}
                  icon={icon}
                  label={label}
                  placeholder={placeholder}
                  value={newKunjungan[field] ?? ""}
                  onChange={(val) =>
                    setNewKunjungan((prev) => ({ ...prev, [field]: val }))
                  }
                />
              ))}

              {/* Foto */}
              <View style={styles.dokumentasiSection}>
                <View style={styles.labelIconRow}>
                  <Ionicons name="camera-outline" size={20} color="#1a1a1a" />
                  <Text style={styles.inputLabel}>Dokumentasi Foto</Text>
                </View>
                {(newKunjungan.fotoBefore || newKunjungan.fotoAfter) && (
                  <View style={styles.photoFrameRow}>
                    {newKunjungan.fotoBefore ? (
                      <View style={styles.photoFrame}>
                        <Text style={styles.frameLabel}>Foto Before</Text>
                        <View style={styles.imageBox}>
                          <Image
                            source={{ uri: newKunjungan.fotoBefore }}
                            style={styles.imageFill}
                          />
                        </View>
                      </View>
                    ) : null}
                    {newKunjungan.fotoAfter ? (
                      <View style={styles.photoFrame}>
                        <Text style={styles.frameLabel}>Foto After</Text>
                        <View style={styles.imageBox}>
                          <Image
                            source={{ uri: newKunjungan.fotoAfter }}
                            style={styles.imageFill}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                )}
                <View style={styles.uploadBtnRow}>
                  <TouchableOpacity
                    style={styles.btnUploadAction}
                    onPress={() => {
                      setAddPhotoType("fotoBefore");
                      setKameraAddVisible(true);
                    }}
                  >
                    <Text style={styles.btnUploadText}>
                      {newKunjungan.fotoBefore
                        ? "Ganti Foto Before"
                        : "Upload Foto Before"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnUploadAction}
                    onPress={() => {
                      setAddPhotoType("fotoAfter");
                      setKameraAddVisible(true);
                    }}
                  >
                    <Text style={styles.btnUploadText}>
                      {newKunjungan.fotoAfter
                        ? "Ganti Foto After"
                        : "Upload Foto After"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.btnSimpanModal,
                    isSavingAdd && { opacity: 0.7 },
                  ]}
                  onPress={simpanKunjunganBaru}
                  disabled={isSavingAdd}
                >
                  {isSavingAdd ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.btnSimpanModalText}>
                        Simpan Kunjungan
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StatusBerhasil
        visible={showSuccess}
        title="Berhasil Disimpan"
        subtitle="Data pemeriksaan gigi telah berhasil dicatat."
        onDone={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2F0F1" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  headerSub: { fontSize: 11, color: "#888", marginTop: 1 },
  badgeSelesai: {
    backgroundColor: "#34B3B9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  listScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },

  tipsBox: {
    flexDirection: "row",
    backgroundColor: "#E9E3C1",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7B7652",
    alignItems: "center",
    gap: 10,
    marginBottom: 25,
  },
  pinIcon: { width: 24, height: 24 },
  tipsTitle: { fontSize: 11, fontWeight: "800" },
  tipsSub: { fontSize: 8, fontWeight: "500" },

  kunjunganWrapper: { marginBottom: 30 },
  kunjunganLabelBox: {
    backgroundColor: "#34B3B9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "center",
    paddingHorizontal: 30,
    gap: 10,
    marginBottom: 20,
  },
  numberCircle: {
    backgroundColor: "#fff",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: { color: "#34B3B9", fontSize: 12, fontWeight: "800" },
  kunjunganLabelText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  kunjunganCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  kunjunganLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#34B3B9",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
  },
  cardNumberText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  kunjunganTitle: { fontSize: 14, fontWeight: "800", color: "#1a1a1a" },
  kunjunganTanggal: { fontSize: 11, color: "#888" },
  statusBadge: {
    backgroundColor: "#E6F7F0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, color: "#2ecc71", fontWeight: "700" },

  inputGroup: { marginBottom: 15 },
  labelIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  inputIcon: { width: 20, height: 20 },
  inputLabel: { fontSize: 15, fontWeight: "800" },
  datePickerPlaceholder: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  dateText: { color: "#333", fontSize: 13 },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 13,
    color: "#1a1a1a",
  },
  textInputReadonly: { backgroundColor: "#F5F5F5", color: "#555" },

  dokumentasiSection: { marginTop: 10 },
  photoFrameRow: { flexDirection: "row", gap: 12, marginBottom: 15 },
  photoFrame: { flex: 1, alignItems: "center" },
  frameLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#34B3B9",
    marginBottom: 6,
  },
  imageBox: {
    width: "100%",
    height: 120,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageFill: { width: "100%", height: "100%" },
  uploadBtnRow: { flexDirection: "row", gap: 10 },
  btnUploadAction: {
    flex: 1,
    backgroundColor: "#34B3B9",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  btnUploadText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  btnAdd: {
    backgroundColor: "#728182",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    marginBottom: 15,
    elevation: 3,
  },
  btnAddText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnSave: {
    backgroundColor: "#34B3B9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    elevation: 3,
  },
  btnSaveText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#E2F0F1",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#D0E5E6",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#E2F0F1",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#D0E5E6",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  modalSubtitle: { fontSize: 11, color: "#888" },
  modalScroll: { paddingHorizontal: 16, paddingTop: 14 },
  datePickerBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  datePickerText: { flex: 1, fontSize: 13, color: "#333" },

  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  btnEdit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#34B3B9",
    borderRadius: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  btnEditText: { color: "#34B3B9", fontWeight: "700", fontSize: 14 },
  btnDelete: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
  },
  btnSimpanModal: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#34B3B9",
    borderRadius: 20,
    paddingVertical: 12,
  },
  btnSimpanModalText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
