import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import StatusBerhasil from "../../components/beranda/Statusberhasil";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");

const fotoSectionsConfig = [
  {
    key: "rontgen",
    label: "Rontgen (X-Ray)",
    badgeColor: "#34B3B9",
    placeholderBg: "#D0E8E8",
  },
  {
    key: "profil",
    label: "PROFIL GIGI",
    badgeColor: "#7B8DE8",
    placeholderBg: "#EDEEFF",
  },
  {
    key: "intraoral",
    label: "FOTO INTRAORAL",
    badgeColor: "#B57BDD",
    placeholderBg: "#F3E8FF",
  },
];

const ALL_TAGS = [
  "#Caries",
  "#RoutineExam",
  "#FollowUpReq",
  "#RootCanal",
  "#WisdomTooth",
];

export default function ExamDetails() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // ━━━━━ Mode edit ━━━━━
  const [isEditing, setIsEditing] = useState(false);

  // ━━━━━ Data ━━━━━
  const [nama, setNama] = useState((params.nama as string) || "Ahmad Fauzi");
  const [umur, setUmur] = useState("28 Years Old · Male");
  const [dokter, setDokter] = useState((params.dokter as string) || "Dr. Budi");
  const [examDate, setExamDate] = useState("24 Oct 2025");
  const [examTime, setExamTime] = useState("14:30 PM");
  const [notes, setNotes] = useState(
    (params.notes as string) ||
      "Patient presented with localized pain in the lower right quadrant. X-ray indicates vertical bone loss around tooth #31 and #32. Possible distal caries detected on #46.\n\nRecommended follow-up: Deep cleaning (scaling and root planing) and possible composite filling for #46. Patient advised to monitor sensitivity levels over the next 48 hours.",
  );
  const [field1, setField1] = useState((params.field1 as string) || "");
  const [field2, setField2] = useState((params.field2 as string) || "");
  const [field3, setField3] = useState((params.field3 as string) || "");

  // ━━━━━ Tags ━━━━━
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "#Caries",
    "#RoutineExam",
    "#FollowUpReq",
  ]);
  const toggleTag = (tag: string) => {
    if (!isEditing) return;
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // ━━━━━ Foto ━━━━━
  const initFotos = (count: number) =>
    Array.from({ length: Math.max(count, 0) }, () => "placeholder");

  const [fotos, setFotos] = useState<Record<string, string[]>>({
    rontgen: initFotos(Number(params.fotoRontgen) || 2),
    profil: initFotos(Number(params.fotoProfil) || 1),
    intraoral: initFotos(Number(params.fotoIntraoral) || 3),
  });

  const gantiFoto = async (sectionKey: string, index: number) => {
    if (!isEditing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setFotos((prev) => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map((uri, i) =>
          i === index ? result.assets[0].uri : uri,
        ),
      }));
    }
  };

  const hapusFoto = (sectionKey: string, index: number) => {
    setFotos((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  // ━━━━━ Error & Save ━━━━━
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveChanges = () => {
    if (!nama.trim() || !dokter.trim() || !notes.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setIsEditing(false);
    // ✅ Tampilkan animasi sukses
    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    // ✅ Navigate ke rontgen history
    router.replace({
      pathname: "/(admin)/(tabs)/rontgen",
      params: { tab: "history" },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ✅ Animasi Edit Record Berhasil */}
      <StatusBerhasil
        visible={showSuccess}
        title="Edit Record Berhasil!"
        subtitle="Perubahan telah tersimpan ke sistem"
        onDone={handleSuccessDone}
      />
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
        contentContainerStyle={{ paddingBottom: isEditing ? 20 : 40 }}
      >
        {/* ━━━━━━━━━━━ FOTO SECTIONS ━━━━━━━━━━━ */}
        {fotoSectionsConfig.map((section) => {
          const photos = fotos[section.key] || [];
          if (photos.length === 0 && !isEditing) return null;
          return (
            <View key={section.key} style={styles.fotoSection}>
              <View style={styles.fotoSectionHeader}>
                <Text style={styles.fotoSectionLabel}>{section.label}</Text>
                <View
                  style={[
                    styles.fotoBadge,
                    { backgroundColor: section.badgeColor },
                  ]}
                >
                  <Text style={styles.fotoBadgeText}>{photos.length} foto</Text>
                </View>
              </View>

              <View style={styles.fotoGrid}>
                {photos.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.fotoItem,
                      photos.length === 1 && styles.fotoItemFull,
                      { backgroundColor: section.placeholderBg },
                    ]}
                    onPress={() => isEditing && gantiFoto(section.key, index)}
                    activeOpacity={isEditing ? 0.7 : 1}
                  >
                    {uri === "placeholder" ? (
                      <View style={styles.fotoPlaceholder}>
                        <Ionicons name="image-outline" size={28} color="#aaa" />
                      </View>
                    ) : (
                      <Image
                        source={{ uri }}
                        style={styles.fotoImg}
                        resizeMode="cover"
                      />
                    )}

                    {/* Mode view — fullscreen icon */}
                    {!isEditing && (
                      <View style={styles.fullscreenIcon}>
                        <Ionicons
                          name="expand-outline"
                          size={14}
                          color="#fff"
                        />
                      </View>
                    )}

                    {/* Mode edit — hapus + ganti */}
                    {isEditing && (
                      <>
                        <TouchableOpacity
                          style={styles.deleteBadge}
                          onPress={() => hapusFoto(section.key, index)}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                        <View
                          style={[
                            styles.gantiBadge,
                            { backgroundColor: section.badgeColor + "cc" },
                          ]}
                        >
                          <Ionicons
                            name="camera-outline"
                            size={10}
                            color="#fff"
                          />
                          <Text style={styles.gantiText}>
                            Ganti Foto Rontgen
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* ━━━━━━━━━━━ PATIENT PROFILE ━━━━━━━━━━━ */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>PATIENT PROFILE</Text>

          <View style={styles.patientCard}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person-outline" size={28} color="#2E9DA4" />
            </View>
            <View style={styles.patientInfo}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={nama}
                  onChangeText={setNama}
                />
              ) : (
                <Text style={styles.patientName}>{nama}</Text>
              )}
              {isEditing ? (
                <TextInput
                  style={[styles.editInput, { fontSize: 12, color: "#888" }]}
                  value={umur}
                  onChangeText={setUmur}
                />
              ) : (
                <Text style={styles.patientSub}>{umur}</Text>
              )}
            </View>
            {isEditing && (
              <Ionicons name="pencil-outline" size={18} color="#aaa" />
            )}
          </View>
        </View>

        {/* Exam Date + Performed By */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconRow}>
              <Ionicons name="calendar-outline" size={14} color="#34B3B9" />
              <Text style={styles.infoLabel}>EXAM DATE</Text>
            </View>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.editInput}
                  value={examDate}
                  onChangeText={setExamDate}
                />
                <TextInput
                  style={[styles.editInput, { fontSize: 12 }]}
                  value={examTime}
                  onChangeText={setExamTime}
                />
              </>
            ) : (
              <>
                <Text style={styles.infoValue}>{examDate}</Text>
                <Text style={styles.infoSub}>{examTime}</Text>
              </>
            )}
            {isEditing && (
              <View style={styles.infoEditIcon}>
                <Ionicons name="pencil-outline" size={16} color="#aaa" />
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconRow}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#34B3B9"
              />
              <Text style={styles.infoLabel}>PERFORMED BY</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={dokter}
                onChangeText={setDokter}
              />
            ) : (
              <Text style={styles.infoValue}>{dokter}</Text>
            )}
            <Text style={styles.infoSub}>Specialist</Text>
            {isEditing && (
              <View style={styles.infoEditIcon}>
                <Ionicons name="pencil-outline" size={16} color="#aaa" />
              </View>
            )}
          </View>
        </View>

        {/* ━━━━━━━━━━━ CLINICAL NOTES ━━━━━━━━━━━ */}
        <View style={styles.sectionWrapper}>
          <View style={styles.clinicalHeader}>
            <Text style={styles.sectionTitle}>CLINICAL NOTES</Text>
            {isEditing ? (
              <Text style={styles.editNotesLabel}>Edit Notes</Text>
            ) : (
              <Ionicons name="menu-outline" size={20} color="#888" />
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.notesEditInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}
        </View>

        {/* ━━━━━━━━━━━ ADD FIELDS ━━━━━━━━━━━ */}
        <View style={styles.sectionWrapper}>
          <View style={styles.addFieldRow}>
            <View style={styles.addFieldGroup}>
              <Text style={styles.addFieldLabel}>Add Field</Text>
              <View style={styles.addFieldBox}>
                {isEditing ? (
                  <TextInput
                    style={styles.addFieldInput}
                    value={field1}
                    onChangeText={setField1}
                  />
                ) : (
                  <Text style={styles.addFieldValue}>{field1}</Text>
                )}
                {isEditing && (
                  <Ionicons name="pencil-outline" size={14} color="#aaa" />
                )}
              </View>
            </View>
            <View style={styles.addFieldGroup}>
              <Text style={styles.addFieldLabel}>Add Field</Text>
              <View style={styles.addFieldBox}>
                {isEditing ? (
                  <TextInput
                    style={styles.addFieldInput}
                    value={field2}
                    onChangeText={setField2}
                  />
                ) : (
                  <Text style={styles.addFieldValue}>{field2}</Text>
                )}
                {isEditing && (
                  <Ionicons name="pencil-outline" size={14} color="#aaa" />
                )}
              </View>
            </View>
          </View>

          <Text style={styles.addFieldLabel}>Add Field</Text>
          <View style={[styles.addFieldBox, { minHeight: 60 }]}>
            {isEditing ? (
              <TextInput
                style={[styles.addFieldInput, { flex: 1 }]}
                value={field3}
                onChangeText={setField3}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.addFieldValue}>{field3}</Text>
            )}
            {isEditing && (
              <Ionicons name="pencil-outline" size={14} color="#aaa" />
            )}
          </View>
        </View>

        {/* ━━━━━━━━━━━ TAGS ━━━━━━━━━━━ */}
        <View style={styles.tagSection}>
          <Text style={styles.sectionTitle}>TAGS</Text>
          <View style={styles.tagRow}>
            {(isEditing ? ALL_TAGS : selectedTags).map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={isEditing ? 0.7 : 1}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      active && styles.tagChipTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                  {isEditing && active && (
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color="#34B3B9"
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ━━━━━━━━━━━ ERROR ━━━━━━━━━━━ */}
        {showError && (
          <View style={styles.errorBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#e05c5c"
            />
            <Text style={styles.errorText}>
              Pastikan semua terisi dengan benar!
            </Text>
          </View>
        )}

        {/* ━━━━━━━━━━━ BUTTONS (view mode) ━━━━━━━━━━━ */}
        {!isEditing && (
          <View style={styles.btnWrapper}>
            <TouchableOpacity style={styles.printBtn}>
              <Ionicons name="print-outline" size={18} color="#fff" />
              <Text style={styles.printBtnText}>Print Full Report (PDF)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editRecordBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil-outline" size={16} color="#A66C64" />
              <Text style={styles.editRecordBtnText}>Edit Record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ━━━━━━━━━━━ SAVE CHANGES (edit mode) ━━━━━━━━━━━ */}
      {isEditing && (
        <View
          style={[styles.saveWrapper, { paddingBottom: insets.bottom + 12 }]}
        >
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveChanges}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const FOTO_W = (W - 52) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2F0F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#E2F0F1",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" },

  // Foto
  fotoSection: { backgroundColor: "#fff", marginBottom: 12, padding: 16 },
  fotoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fotoSectionLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  fotoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  fotoBadgeText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  fotoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fotoItem: {
    width: FOTO_W,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  fotoItemFull: { width: W - 32, height: 180 },
  fotoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fotoImg: { width: "100%", height: "100%", borderRadius: 12 },
  fullscreenIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    padding: 4,
  },
  deleteBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF4D4D",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },
  gantiBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    gap: 3,
  },
  gantiText: { fontSize: 10, color: "#fff", fontWeight: "600" },

  // Section
  sectionWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Patient
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  patientInfo: { flex: 1, gap: 2 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  patientSub: { fontSize: 12, color: "#888" },
  editInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#34B3B9",
    paddingVertical: 2,
    marginBottom: 4,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    position: "relative",
  },
  infoIconRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoLabel: {
    fontSize: 10,
    color: "#34B3B9",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  infoSub: { fontSize: 12, color: "#888" },
  infoEditIcon: { position: "absolute", top: 12, right: 12 },

  // Notes
  clinicalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  editNotesLabel: { fontSize: 12, color: "#34B3B9", fontWeight: "600" },
  notesCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  notesText: { fontSize: 13, color: "#444", lineHeight: 20 },
  notesEditInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    fontSize: 13,
    color: "#1a1a1a",
    minHeight: 150,
    borderWidth: 1.5,
    borderColor: "#34B3B9",
  },

  // Add fields
  addFieldRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  addFieldGroup: { flex: 1, gap: 6 },
  addFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  addFieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#e8e5e5",
    padding: 10,
    gap: 6,
  },
  addFieldInput: { flex: 1, fontSize: 13, color: "#1a1a1a" },
  addFieldValue: { fontSize: 13, color: "#1a1a1a" },

  // Tags
  tagSection: { paddingHorizontal: 16, marginBottom: 16 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e5e5",
  },
  tagChipActive: { borderColor: "#34B3B9", backgroundColor: "#E2F0F1" },
  tagChipText: { fontSize: 12, color: "#888" },
  tagChipTextActive: { color: "#34B3B9", fontWeight: "600" },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e05c5c33",
  },
  errorText: { fontSize: 13, color: "#e05c5c", fontWeight: "500" },

  // View mode buttons
  btnWrapper: { paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34B3B9",
    borderRadius: 12,
    paddingVertical: 14,
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

  // Edit mode save
  saveWrapper: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: "#E2F0F1",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34B3B9",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
});