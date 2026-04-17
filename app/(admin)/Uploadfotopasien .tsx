import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import { galleryState } from "../../services/galleryState";
import {
  getDokterList,
  getTagList,
  uploadFotoRontgen,
} from "../../services/rontgenService";

const { width: W } = Dimensions.get("window");

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

  const pasienNama = (params.nama as string) || "Siti Rahayu";
  const pasienNo = (params.no as string) || "002";
  const pasienJam = (params.jam as string) || "08:45";
  const pasienUmur = (params.umur as string) || "25 th";
  const fotoKeysRaw =
    (params.fotoKeys as string) || "rontgen_xray,profil_gigi,intraoral";
  const fotoKeys = fotoKeysRaw.split(",").filter(Boolean);
  const rontgenId = Number(params.rontgenId) || 0;
  const doctorIdParam = Number(params.doctorId) || 0;

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

  // State
  const [dokterList, setDokterList] = useState<any[]>([]);
  const [tagList, setTagList] = useState<any[]>([]);
  const [selectedDokter, setSelectedDokter] = useState("");
  const [selectedDokterObj, setSelectedDokterObj] = useState<any>(null);
  const [showDokterDropdown, setShowDokterDropdown] = useState(false);
  const [notes, setNotes] = useState("");
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [kameraVisible, setKameraVisible] = useState(false);
  const [aktivSection, setAktivSection] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<
    Record<string, string[]>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeSections = fotoSections.filter((s) => fotoKeys.includes(s.key));

  useEffect(() => {
    fetchDokterDanTag();
  }, []);

  const fetchDokterDanTag = async () => {
    try {
      const [dokterRes, tagRes] = await Promise.all([
        getDokterList(),
        getTagList(),
      ]);
      if (dokterRes.data) setDokterList(dokterRes.data);
      if (tagRes.success) setTagList(tagRes.data || []);
    } catch (error) {
      console.log("Error fetch dokter/tag:", error);
    }
  };

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

  const aktivColor =
    fotoSections.find((s) => s.key === aktivSection)?.color || "#34B3B9";

  const handleSave = async () => {
    const totalFoto = Object.values(capturedPhotos).flat().length;
    if (totalFoto === 0) {
      alert("Minimal upload 1 foto!");
      return;
    }

    if (!rontgenId) {
      alert("ID Rontgen tidak ditemukan!");
      return;
    }

    setLoading(true);
    try {
      const dokId = selectedDokterObj?.id || doctorIdParam;
      const res = await uploadFotoRontgen(
        rontgenId,
        capturedPhotos,
        dokId,
        notes,
        selectedTags,
      );

      if (res.success) {
        setShowSuccess(true);
      } else {
        alert(res.message || "Gagal upload foto");
      }
    } catch (error) {
      console.log("Error upload:", error);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animasi Upload Berhasil */}
      <StatusBerhasil
        visible={showSuccess}
        title="Upload Foto Berhasil!"
        subtitle="Data pemeriksaan telah tersimpan"
        onDone={handleSuccessDone}
      />

      {/* Modal Kamera */}
      <Modal visible={kameraVisible} animationType="slide" statusBarTranslucent>
        <KameraScreen
          onCapture={handleCapture}
          onClose={() => setKameraVisible(false)}
          sectionColor={aktivColor}
        />
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Foto Pasien</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
      >
        {/* Card Pasien */}
        <View style={styles.pasienCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#2E9DA4" />
          </View>
          <View style={styles.pasienInfo}>
            <Text style={styles.pasienNama}>{pasienNama}</Text>
            <Text style={styles.pasienSub}>
              No. {pasienNo} · {pasienJam} · {pasienUmur}
            </Text>
            <View style={styles.fotoTagRow}>
              {fotoKeys.map((key) => {
                const icon = getFotoTagIcon(key);
                const color = fotoTagColor[key] || {
                  bg: "#E2F0F1",
                  text: "#34B3B9",
                };
                return (
                  <View
                    key={key}
                    style={[styles.fotoTag, { backgroundColor: color.bg }]}
                  >
                    {icon && (
                      <Image
                        source={icon}
                        style={[styles.fotoTagIcon, { tintColor: color.text }]}
                        contentFit="contain"
                      />
                    )}
                    <Text style={[styles.fotoTagText, { color: color.text }]}>
                      {fotoLabel[key] || key}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Foto Sections */}
        {activeSections.map((section) => {
          const photos = capturedPhotos[section.key] || [];
          const hasPhotos = photos.length > 0;
          return (
            <View key={section.key} style={styles.section}>
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
                  <Text style={styles.countText}>{photos.length} foto</Text>
                </View>
              </View>

              {!hasPhotos ? (
                <View
                  style={[
                    styles.uploadBox,
                    { borderColor: section.borderColor },
                  ]}
                >
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
                    Tap Camera atau Gallery untuk upload foto{" "}
                    {section.label.toLowerCase()}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.gridContainer,
                    { borderColor: section.borderColor },
                  ]}
                >
                  <View style={styles.photoGrid}>
                    {photos.map((uri, index) => (
                      <View key={index} style={styles.photoWrapper}>
                        <Image
                          source={{ uri }}
                          style={styles.imageItem}
                          contentFit="cover"
                        />
                        <TouchableOpacity
                          style={styles.deleteBadge}
                          onPress={() => hapusFoto(section.key, index)}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Tombol tambah foto */}
                    <TouchableOpacity
                      style={[styles.addButton, { borderColor: section.color }]}
                      onPress={() => bukaKamera(section.key)}
                    >
                      <Ionicons name="add" size={28} color={section.color} />
                      <Text style={[styles.addText, { color: section.color }]}>
                        ADD
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.hintText, { color: section.color }]}>
                    Tap + untuk tambah foto
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Dropdown Dokter */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>DOKTER PEMERIKSA</Text>
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
              {dokterList.length === 0 ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>Memuat...</Text>
                </View>
              ) : (
                dokterList.map((d: any) => (
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
                ))
              )}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>CLINICAL NOTES</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Masukkan catatan klinis..."
            placeholderTextColor="#aaa"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Add Fields */}
        <View style={styles.addFieldRow}>
          <View style={styles.addFieldGroup}>
            <Text style={styles.addFieldLabel}>Add Field</Text>
            <TextInput
              style={styles.addFieldInput}
              value={field1}
              onChangeText={setField1}
            />
          </View>
          <View style={styles.addFieldGroup}>
            <Text style={styles.addFieldLabel}>Add Field</Text>
            <TextInput
              style={styles.addFieldInput}
              value={field2}
              onChangeText={setField2}
            />
          </View>
        </View>
        <View style={[styles.addFieldGroup, { marginBottom: 16 }]}>
          <Text style={styles.addFieldLabel}>Add Field</Text>
          <TextInput
            style={styles.addFieldInputFull}
            value={field3}
            onChangeText={setField3}
            multiline
          />
        </View>

        {/* Tags dari API */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>TAGS</Text>
          <View style={styles.tagRow}>
            {tagList.map((tag: any) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      isSelected && styles.tagChipTextActive,
                    ]}
                  >
                    #{tag.tag_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <View style={[styles.saveWrapper, { paddingTop: 32 }]}>
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#fff" />
            )}
            <Text style={styles.saveBtnText}>
              {loading ? "Menyimpan..." : "Save Data"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 40,
    fontSize: 14,
    marginHorizontal: 16,
  },
  container: { flex: 1, backgroundColor: "#E2F0F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" },
  pasienCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 14,
    marginBottom: 30,
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
  pasienInfo: { flex: 1, gap: 4 },
  pasienNama: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  pasienSub: { fontSize: 12, color: "#888" },
  fotoTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 },
  fotoTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  fotoTagIcon: { width: 11, height: 11 },
  fotoTagText: { fontSize: 10, fontWeight: "600" },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 14,
  },
  uploadBtnRow: { flexDirection: "row", gap: 24 },
  uploadBtn: { alignItems: "center", gap: 8 },
  uploadIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBtnLabel: { fontSize: 13, color: "#555", fontWeight: "500" },
  uploadHint: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 17,
  },
  gridContainer: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoWrapper: { width: (W - 80) / 3, aspectRatio: 1, position: "relative" },
  imageItem: { width: "100%", height: "100%", borderRadius: 16 },
  deleteBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF4D4D",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 10,
  },
  addButton: {
    width: (W - 80) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addText: { fontSize: 10, fontWeight: "800" },
  hintText: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e8e5e5",
  },
  dropdownText: { flex: 1, fontSize: 14, color: "#1a1a1a" },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e8e5e5",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dropdownItemText: { fontSize: 14, color: "#1a1a1a" },
  notesInput: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    fontSize: 14,
    color: "#1a1a1a",
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#fff",
  },
  addFieldRow: { flexDirection: "row", gap: 10, marginBottom: 30 },
  addFieldGroup: { flex: 1, gap: 6 },
  addFieldLabel: { fontSize: 13, fontWeight: "600", color: "#555" },
  addFieldInput: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e8e5e5",
  },
  addFieldInputFull: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 60,
    fontSize: 13,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e8e5e5",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e5e5",
  },
  tagChipActive: {
    backgroundColor: "#E2F0F1",
    borderColor: "#34B3B9",
  },
  tagChipText: { fontSize: 12, color: "#888" },
  tagChipTextActive: { fontSize: 12, color: "#34B3B9", fontWeight: "600" },
  saveWrapper: { paddingHorizontal: 24, backgroundColor: "#E2F0F1" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34B3B9",
    borderRadius: 30,
    paddingVertical: 14,
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
});
