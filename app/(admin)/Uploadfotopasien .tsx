import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { pendingPhotos } from "../../services/galleryState";

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

const dokterList = ["Dr. Budi Setiawan", "Dr. Ani Rahayu", "Dr. Cahyo Prabowo"];
const tagSuggestions = ["#cavity", "#WisdomTooth", "#Cleaning", "#RootCanal"];

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

  const [selectedDokter, setSelectedDokter] = useState("");
  const [showDokterDropdown, setShowDokterDropdown] = useState(false);
  const [notes, setNotes] = useState("");
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");

  const [kameraVisible, setKameraVisible] = useState(false);
  const [aktivSection, setAktivSection] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<
    Record<string, string[]>
  >({});

  // ✅ State animasi sukses
  const [showSuccess, setShowSuccess] = useState(false);

  const activeSections = fotoSections.filter((s) => fotoKeys.includes(s.key));

  useFocusEffect(
    useCallback(() => {
      if (pendingPhotos.ready && aktivSection) {
        const uris = pendingPhotos.uris;
        setCapturedPhotos((prev) => ({
          ...prev,
          [aktivSection]: [...(prev[aktivSection] || []), ...uris].slice(0, 10),
        }));
        pendingPhotos.uris = [];
        pendingPhotos.ready = false;
        setAktivSection(null);
      }
    }, [aktivSection]),
  );

  const bukaKamera = (sectionKey: string) => {
    setAktivSection(sectionKey);
    setKameraVisible(true);
  };

  const bukaGallery = (sectionKey: string) => {
    setAktivSection(sectionKey);
    router.push("/(admin)/GalleryScreen");
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

  const aktivColor =
    fotoSections.find((s) => s.key === aktivSection)?.color || "#34B3B9";

  // ✅ Handle Save — tampilkan animasi lalu navigate ke rontgen history
  const handleSave = () => {
    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    // Navigate ke tab rontgen, tab langsung ke history
    router.replace({
      pathname: "/(admin)/(tabs)/rontgen",
      params: {
        tab: "history",
        // Kirim data pasien ke history
        nama: pasienNama,
        no: pasienNo,
        jam: pasienJam,
        umur: pasienUmur,
        dokter: selectedDokter,
        notes: notes,
        field1,
        field2,
        field3,
        fotoRontgen: String(capturedPhotos["rontgen_xray"]?.length || 0),
        fotoProfil: String(capturedPhotos["profil_gigi"]?.length || 0),
        fotoIntraoral: String(capturedPhotos["intraoral"]?.length || 0),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ✅ Animasi Upload Berhasil */}
      <StatusBerhasil
        visible={showSuccess}
        title="Upload Foto Berhasil!"
        subtitle="Perubahan telah tersimpan ke sistem"
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
                  <Text style={styles.countText}>{photos.length}/10</Text>
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
                      activeOpacity={0.7}
                      onPress={() => bukaKamera(section.key)}
                    >
                      <View
                        style={[
                          styles.uploadIconBox,
                          { backgroundColor: section.iconBg },
                        ]}
                      >
                        <Image
                          source={require("../../assets/icons/icon_camera.png")}
                          style={[
                            styles.uploadIcon,
                            { tintColor: section.color },
                          ]}
                          contentFit="contain"
                        />
                      </View>
                      <Text style={styles.uploadBtnLabel}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      activeOpacity={0.7}
                      onPress={() => bukaGallery(section.key)}
                    >
                      <View
                        style={[
                          styles.uploadIconBox,
                          { backgroundColor: section.iconBg },
                        ]}
                      >
                        <Image
                          source={require("../../assets/icons/icon_gallery.png")}
                          style={[
                            styles.uploadIcon,
                            { tintColor: section.color },
                          ]}
                          contentFit="contain"
                        />
                      </View>
                      <Text style={styles.uploadBtnLabel}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadHint}>
                    Capture or select high resolution X-ray files{"\n"}(JPEG,
                    PNG up to 10MB)
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
                    {photos.map((uri, i) => (
                      <View key={i} style={styles.photoWrapper}>
                        <Image
                          source={{ uri }}
                          style={styles.imageItem}
                          contentFit="cover"
                        />
                        <TouchableOpacity
                          style={styles.deleteBadge}
                          onPress={() => hapusFoto(section.key, i)}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {photos.length < 10 && (
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          { borderColor: section.borderColor },
                        ]}
                        onPress={() => bukaKamera(section.key)}
                      >
                        <Ionicons name="add" size={24} color={section.color} />
                        <Text
                          style={[styles.addText, { color: section.color }]}
                        >
                          Tambah
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.hintText, { color: section.color }]}>
                    {photos.length} foto · tap X untuk hapus
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Select Dokter */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>SELECT DOKTER</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDokterDropdown(!showDokterDropdown)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dropdownText,
                !selectedDokter && { color: "#bbb" },
              ]}
            >
              {selectedDokter || ""}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#888" />
          </TouchableOpacity>
          {showDokterDropdown && (
            <View style={styles.dropdownList}>
              {dokterList.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedDokter(d);
                    setShowDokterDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Examination Notes */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>EXAMINATION NOTES</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Type examination result, diagnosis, or recommendations here..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={5}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
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

        {/* Tag Suggestions */}
        <View style={styles.tagRow}>
          {tagSuggestions.map((tag) => (
            <TouchableOpacity key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <View style={[styles.saveWrapper, { paddingTop: 32 }]}>
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Data</Text>
          </TouchableOpacity>
        </View>
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
  uploadIcon: { width: 32, height: 32 },
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
    color: "#555",
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
  tagChipText: { fontSize: 12, color: "#888" },
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
