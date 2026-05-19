import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import AppHeader from "../../../components/shared/AppHeader";
import { useUnreadNotif } from "../../../hooks/useUnreadNotif";
import { getRontgenList } from "../../../services/rontgenService";

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 2;

const getFotoIcon = (key: string) => {
  try {
    switch (key) {
      case "rontgen_xray":
        return require("../../../assets/icons/icon_foto_rontgen.png");
      case "profil_gigi":
        return require("../../../assets/icons/icon_foto_profil.png");
      case "intraoral":
        return require("../../../assets/icons/icon_foto_intraoral.png");
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// PERBAIKAN: normalisasi semua alias ke key canonical
// "xray" dari backend lama → "rontgen_xray" agar label dan warna konsisten
const normalizeKey = (key: string): string => {
  if (key === "xray") return "rontgen_xray";
  return key;
};

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

// Key yang valid untuk ditampilkan sebagai tag
const VALID_FOTO_KEYS = new Set(Object.keys(fotoLabel));

const timeFilters = ["All Time", "Today", "This Week"];

export default function Rontgen() {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<"rontgen" | "history">("rontgen");
  const [activeTime, setActiveTime] = useState("All Time");
  const [search, setSearch] = useState("");
  const scrollY = useSharedValue(0);
  const unreadCount = useUnreadNotif();

  const [pasienRontgen, setPasienRontgen] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.tab === "history") setActiveTab("history");
  }, [params.tab]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resAntrian, resHistory] = await Promise.all([
        // PERBAIKAN: status harus konsisten dengan yang dikirim createRontgen
        getRontgenList("perlu_upload_foto"),
        getRontgenList("selesai"),
      ]);

      // ── Tab "Perlu Upload Foto" ────────────────────────────────────────────
      if (resAntrian.success && resAntrian.data?.rontgens) {
        const list = resAntrian.data.rontgens.map((r: any) => {
          // Fallback chain fotoKeys:
          // 1. target_foto dari DB  → paling akurat, butuh backend simpan field ini
          // 2. examination_images   → foto yang sudah pernah diupload sebelumnya
          // 3. ["rontgen_xray"]     → default terakhir
          //
          // Jika selalu jatuh ke (3), berarti backend belum simpan target_foto.
          // Fix: pastikan kolom target_foto ada di $fillable model Rontgen Laravel.
          let fotoKeys: string[] = [];

          if (r.target_foto) {
            fotoKeys = r.target_foto
              .split(",")
              .map((k: string) => normalizeKey(k.trim()))
              .filter((k: string) => VALID_FOTO_KEYS.has(k));
          }

          if (fotoKeys.length === 0 && r.examination_images?.length > 0) {
            const fromImages = [
              ...new Set(
                r.examination_images
                  .map((img: any) => normalizeKey(img.image_type || ""))
                  .filter((k: string) => VALID_FOTO_KEYS.has(k)),
              ),
            ] as string[];
            fotoKeys = fromImages;
          }

          if (fotoKeys.length === 0) {
            // Ini artinya target_foto belum tersimpan di backend.
            // Tampilkan semua opsi agar user bisa pilih sendiri di upload screen.
            console.warn(
              `[Rontgen] target_foto null untuk rontgenId=${r.id}. Cek $fillable di model Rontgen.`,
            );
            fotoKeys = ["rontgen_xray"];
          }

          return {
            id: r.id,
            nama: r.patient?.name || "-",
            no: String(r.id).padStart(3, "0"),
            jam: r.created_at ? r.created_at.split(" ")[1]?.slice(0, 5) : "-",
            umur: r.patient?.age ? `${r.patient.age} th` : "-",
            fotoKeys,
            patientId: r.patient?.id,
            doctorId: r.doctor?.id,
          };
        });
        setPasienRontgen(list);
      } else {
        setPasienRontgen([]);
      }

      // ── Tab "History" ─────────────────────────────────────────────────────
      if (resHistory.success && resHistory.data?.rontgens) {
        const allRontgens = resHistory.data.rontgens;

        const grouped: Record<string, any[]> = {};
        allRontgens.forEach((r: any) => {
          const tanggal = r.created_at?.split(" ")[0] || "Unknown";
          if (!grouped[tanggal]) grouped[tanggal] = [];

          const images = r.examination_images || [];

          // PERBAIKAN: normalisasi semua key dari images, lalu filter hanya yang valid
          // agar tidak muncul bubble kosong (undefined label)
          const fotoKeySet = new Set<string>();
          images
            .map((img: any) => normalizeKey(img.image_type || ""))
            .filter((k: string) => VALID_FOTO_KEYS.has(k))
            .forEach((k: string) => fotoKeySet.add(k));

          const firstImage = images.find((img: any) => img.image_url);

          grouped[tanggal].push({
            id: r.id,
            rontgenId: r.id,
            nama: r.patient?.name || "-",
            jam: r.created_at?.split(" ")[1]?.slice(0, 5) || "-",
            judul: r.doctor?.name ? `${r.doctor.name}` : "Pemeriksaan Rontgen",
            deskripsi: r.detail || "Tidak ada catatan",
            foto: firstImage?.image_url || null,
            // PERBAIKAN: Array dari Set sudah bersih, tidak ada key asing
            fotoKeys: Array.from(fotoKeySet),
            no: String(r.id).padStart(3, "0"),
            umur: r.patient?.age ? `${r.patient.age} th` : "-",
            dokter: r.doctor?.name || "-",
            notes: r.detail || "",
            fotoRontgen: String(
              images.filter(
                (i: any) =>
                  i.image_type === "xray" || i.image_type === "rontgen_xray",
              ).length,
            ),
            fotoProfil: String(
              images.filter((i: any) => i.image_type === "profil_gigi").length,
            ),
            fotoIntraoral: String(
              images.filter((i: any) => i.image_type === "intraoral").length,
            ),
          });
        });

        const sortedGroups = Object.keys(grouped)
          .sort((a, b) => (a > b ? -1 : 1))
          .map((tgl) => ({ tanggal: tgl, items: grouped[tgl] }));

        setHistoryData(sortedGroups);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.log("Error fetch rontgen:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToUpload = (pasien: any) => {
    router.push({
      pathname: "/(admin)/Uploadfotopasien ",
      params: {
        rontgenId: String(pasien.id),
        nama: pasien.nama,
        no: pasien.no,
        jam: pasien.jam,
        umur: pasien.umur,
        fotoKeys: pasien.fotoKeys.join(","),
        doctorId: String(pasien.doctorId || ""),
        patientId: String(pasien.patientId || ""),
      },
    });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, PARALLAX_DISTANCE],
          [0, -PARALLAX_DISTANCE],
          "clamp",
        ),
      },
    ],
  }));

  const goToExamDetails = (item: any) => {
    router.push({
      pathname: "/(admin)/ExamDetails",
      params: { ...item },
    });
  };

  const getFilteredHistory = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return historyData
      .map((group) => {
        if (activeTime === "Today" && group.tanggal !== todayStr) return null;
        if (activeTime === "This Week") {
          const itemDate = new Date(group.tanggal);
          const diff =
            (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (diff > 7) return null;
        }

        const filteredItems = group.items.filter(
          (item: any) =>
            search === "" ||
            item.nama.toLowerCase().includes(search.toLowerCase()),
        );

        if (filteredItems.length === 0) return null;
        return { ...group, items: filteredItems };
      })
      .filter(Boolean);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerWrapper, headerStyle]}>
        <AppHeader scrollY={scrollY} unreadCount={unreadCount} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT,
          paddingBottom: 100,
        }}
      >
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "rontgen" && styles.tabActive]}
            onPress={() => setActiveTab("rontgen")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "rontgen" && styles.tabTextActive,
              ]}
            >
              Perlu Upload Foto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.tabActive]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.tabTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab: Perlu Upload Foto ──────────────────────────────────────── */}
        {activeTab === "rontgen" && (
          <View>
            <Text style={styles.pageTitle}>Upload Rontgen</Text>
            <View style={styles.tips}>
              <Image
                source={require("../../../assets/images/Light.png")}
                style={styles.tipsIcon}
              />
              <Text style={styles.tipsText}>
                Pasien berikut telah direkomendasikan dokter untuk dilakukan
                foto rontgen.
              </Text>
            </View>

            {loading ? (
              <Text style={styles.emptyText}>Memuat data...</Text>
            ) : pasienRontgen.length === 0 ? (
              <Text style={styles.emptyText}>
                Tidak ada antrean foto hari ini
              </Text>
            ) : (
              <View style={styles.listWrapper}>
                {pasienRontgen.map((pasien) => (
                  <TouchableOpacity
                    key={pasien.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => goToUpload(pasien)}
                  >
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={24} color="#2E9DA4" />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.nama}>{pasien.nama}</Text>
                      <Text style={styles.sub}>
                        No. {pasien.no} · {pasien.jam} · {pasien.umur}
                      </Text>
                      <View style={styles.tagRow}>
                        {pasien.fotoKeys.map((key: string) => {
                          const color = fotoTagColor[key] || {
                            bg: "#E2F0F1",
                            text: "#34B3B9",
                          };
                          const label = fotoLabel[key];
                          // PERBAIKAN: skip render jika label tidak ditemukan
                          if (!label) return null;
                          return (
                            <View
                              key={key}
                              style={[
                                styles.fotoTag,
                                { backgroundColor: color.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.fotoTagText,
                                  { color: color.text },
                                ]}
                              >
                                {label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.rontgenIcon}>
                      <Image
                        source={require("../../../assets/icons/camera.png")}
                        style={styles.cameraIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Tab: History ───────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <View>
            <Text style={styles.pageTitle}>Examination History</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={16} color="#aaa" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari nama pasien..."
                  placeholderTextColor="#aaa"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeFilterWrapper}
            >
              {timeFilters.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.timeBtn,
                    activeTime === f && styles.timeBtnActive,
                  ]}
                  onPress={() => setActiveTime(f)}
                >
                  <Text
                    style={[
                      styles.timeBtnText,
                      activeTime === f && styles.timeBtnTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <Text style={styles.emptyText}>Memuat history...</Text>
            ) : historyData.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada riwayat pemeriksaan
              </Text>
            ) : (
              getFilteredHistory().map((group: any, gIndex: number) => (
                <View key={gIndex}>
                  <Text style={styles.groupDate}>{group.tanggal}</Text>
                  {group.items.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.historyCard}
                      onPress={() => goToExamDetails(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fotoWrapper}>
                        {item.foto ? (
                          <Image
                            source={{ uri: item.foto }}
                            style={styles.foto}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.fotoPlaceholder}>
                            <Ionicons
                              name="camera-outline"
                              size={26}
                              color="#aaa"
                            />
                            <Text
                              style={{
                                fontSize: 9,
                                color: "#aaa",
                                marginTop: 4,
                                textAlign: "center",
                              }}
                            >
                              Tanpa{"\n"}foto
                            </Text>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.info,
                          { justifyContent: "space-between" },
                        ]}
                      >
                        <View style={styles.namaRow}>
                          <Text style={styles.nama}>{item.nama}</Text>
                          <Text style={styles.jam}>{item.jam}</Text>
                        </View>
                        <Text style={styles.judul}>{item.judul}</Text>
                        <Text style={styles.deskripsi} numberOfLines={2}>
                          {item.deskripsi}
                        </Text>
                        <View style={styles.tagRow}>
                          {/* PERBAIKAN: hanya render jika fotoKeys ada isinya dan label valid */}
                          {item.fotoKeys.length > 0
                            ? item.fotoKeys.map((key: string) => {
                                const label = fotoLabel[key];
                                const color = fotoTagColor[key];
                                if (!label || !color) return null;
                                return (
                                  <View
                                    key={key}
                                    style={[
                                      styles.fotoTag,
                                      { backgroundColor: color.bg },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.fotoTagText,
                                        { color: color.text },
                                      ]}
                                    >
                                      {label}
                                    </Text>
                                  </View>
                                );
                              })
                            : // Tidak render tag apapun jika fotoKeys kosong
                              null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2F0F1" },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabWrapper: {
    flexDirection: "row",
    marginHorizontal: 25,
    marginTop: 30,
    backgroundColor: "#e2f0f1",
    borderRadius: 30,
    padding: 4,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  tabActive: { backgroundColor: "#6ABBBF" },
  tabText: { fontSize: 13, color: "#636262", fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  pageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tips: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2F0F1",
    marginHorizontal: 45,
    borderRadius: 18,
    padding: 8,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  tipsIcon: { width: 25, height: 25 },
  tipsText: { flex: 1, fontSize: 12, color: "#2E9DA4", lineHeight: 18 },
  listWrapper: { paddingHorizontal: 16 },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1, gap: 4 },
  nama: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  sub: { fontSize: 12, color: "#888" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  fotoTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  fotoTagText: { fontSize: 10, fontWeight: "600" },
  rontgenIcon: { backgroundColor: "#34B3B9", padding: 4, borderRadius: 12 },
  cameraIcon: { width: 25, height: 25 },
  searchRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#333" },
  timeFilterWrapper: { paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  timeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  timeBtnActive: { backgroundColor: "#2E9DA4", borderColor: "#2E9DA4" },
  timeBtnText: { fontSize: 13, color: "#666" },
  timeBtnTextActive: { color: "#fff", fontWeight: "600" },
  groupDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    elevation: 2,
  },
  fotoWrapper: { width: 80, height: 100, borderRadius: 10, overflow: "hidden" },
  foto: { width: "100%", height: "100%" },
  fotoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  namaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jam: { fontSize: 11, color: "#888" },
  judul: { fontSize: 12, color: "#2E9DA4", fontWeight: "600" },
  deskripsi: { fontSize: 11, color: "#666", lineHeight: 16 },
});
