import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

// ━━━━━━━━━━━  DATA  ━━━━━━━━━━━

const pasienRontgen = [
  {
    id: 2,
    nama: "Siti Rahayu",
    no: "002",
    jam: "08:45",
    umur: "25 th",
    fotoKeys: ["rontgen_xray", "profil_gigi", "intraoral"],
  },
  {
    id: 5,
    nama: "Dewi Lestari",
    no: "005",
    jam: "10:00",
    umur: "25 th",
    fotoKeys: ["profil_gigi", "intraoral"],
  },
  {
    id: 6,
    nama: "Jasmine",
    no: "002",
    jam: "08:45",
    umur: "25 th",
    fotoKeys: ["rontgen_xray", "intraoral"],
  },
  {
    id: 7,
    nama: "Ahmad Fauzi",
    no: "002",
    jam: "08:45",
    umur: "25 th",
    fotoKeys: ["rontgen_xray"],
  },
];

const historyData = [
  {
    tanggal: "TODAY, OCT 24",
    items: [
      {
        id: 1,
        nama: "Ahmad Fauzi",
        jam: "10:30 AM",
        judul: "Pemeriksaan Gigi Geraham Bawah Kiri",
        deskripsi:
          "Dugaan terdapat lubang pada daerah distal. Disarankan untuk segera penambalan dan...",
        // ✅ fotoKeys untuk tag icons
        fotoKeys: ["rontgen_xray", "profil_gigi"],
        foto: null,
        no: "003",
        umur: "41 th",
        dokter: "Dr. Budi Setiawan",
        notes:
          "Dugaan terdapat lubang pada daerah distal. Disarankan untuk segera penambalan.",
        fotoRontgen: "2",
        fotoProfil: "1",
        fotoIntraoral: "0",
      },
      {
        id: 2,
        nama: "Michael Chen",
        jam: "09:15 AM",
        judul: "Full Panoramic Survey",
        deskripsi:
          "Pemeriksaan rutin. Semua gigi bungsu tumbuh dengan benar. Tidak ada tanda-tanda",
        fotoKeys: ["rontgen_xray", "intraoral"],
        foto: null,
        no: "006",
        umur: "35 th",
        dokter: "Dr. Ani Rahayu",
        notes: "Pemeriksaan rutin. Semua gigi bungsu tumbuh dengan benar.",
        fotoRontgen: "2",
        fotoProfil: "0",
        fotoIntraoral: "2",
      },
    ],
  },
  {
    tanggal: "YESTERDAY, OCT 23",
    items: [
      {
        id: 3,
        nama: "Siti Rahayu",
        jam: "04:45 PM",
        judul: "Orthodontic Progress Scan",
        deskripsi:
          "Penyelarasan berjalan sesuai harapan. Penyesuaian berikutnya dijadwalkan untuk 3...",
        fotoKeys: ["rontgen_xray", "profil_gigi", "intraoral"],
        foto: null,
        no: "002",
        umur: "25 th",
        dokter: "Dr. Cahyo Prabowo",
        notes:
          "Penyelarasan berjalan sesuai harapan. Penyesuaian berikutnya dijadwalkan 3 bulan lagi.",
        fotoRontgen: "1",
        fotoProfil: "2",
        fotoIntraoral: "1",
      },
      {
        id: 4,
        nama: "Dewi Lestari",
        jam: "11:00 AM",
        judul: "Emergency Root Canal Scan",
        deskripsi:
          "Infeksi yang terlihat di ujung gigi #14. Urgensi tinggi untuk prosedur.",
        fotoKeys: ["rontgen_xray", "intraoral"],
        foto: null,
        no: "005",
        umur: "25 th",
        dokter: "Dr. Budi Setiawan",
        notes:
          "Infeksi yang terlihat di ujung gigi #14. Urgensi tinggi untuk prosedur.",
        fotoRontgen: "3",
        fotoProfil: "0",
        fotoIntraoral: "2",
      },
    ],
  },
];

const timeFilters = ["All Time", "Today", "This Week"];

export default function Rontgen() {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<"rontgen" | "history">("rontgen");
  const [activeTime, setActiveTime] = useState("All Time");
  const [search, setSearch] = useState("");
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (params.tab === "history") setActiveTab("history");
  }, [params.tab]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, PARALLAX_DISTANCE],
      [0, -PARALLAX_DISTANCE],
      "clamp",
    );
    return { transform: [{ translateY }] };
  });

  const goToExamDetails = (item: (typeof historyData)[0]["items"][0]) => {
    router.push({
      pathname: "/(admin)/ExamDetails",
      params: {
        nama: item.nama,
        no: item.no,
        jam: item.jam,
        umur: item.umur,
        dokter: item.dokter,
        notes: item.notes,
        fotoRontgen: item.fotoRontgen,
        fotoProfil: item.fotoProfil,
        fotoIntraoral: item.fotoIntraoral,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerWrapper, headerStyle]}>
        <AppHeader scrollY={scrollY} />
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
        {/* Tab Switcher */}
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

        {/* ============ TAB RONTGEN ============ */}
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
                upload foto (Rontgen/ Profil Gigi / Intraoral).
              </Text>
            </View>

            <View style={styles.listWrapper}>
              {pasienRontgen.map((pasien) => (
                <TouchableOpacity
                  key={pasien.id}
                  style={styles.card}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#2E9DA4" />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.nama}>{pasien.nama}</Text>
                    <Text style={styles.sub}>
                      No. {pasien.no} · {pasien.jam} · {pasien.umur}
                    </Text>
                    {/* ✅ Foto tag icons */}
                    <View style={styles.tagRow}>
                      {pasien.fotoKeys.map((key) => {
                        const icon = getFotoIcon(key);
                        const color = fotoTagColor[key] || {
                          bg: "#E2F0F1",
                          text: "#34B3B9",
                        };
                        return (
                          <View
                            key={key}
                            style={[
                              styles.fotoTag,
                              { backgroundColor: color.bg },
                            ]}
                          >
                            {icon && (
                              <Image
                                source={icon}
                                style={[
                                  styles.fotoTagIcon,
                                  { tintColor: color.text },
                                ]}
                                resizeMode="contain"
                              />
                            )}
                            <Text
                              style={[
                                styles.fotoTagText,
                                { color: color.text },
                              ]}
                            >
                              {fotoLabel[key]}
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
          </View>
        )}

        {/* ============ TAB HISTORY ============ */}
        {activeTab === "history" && (
          <View>
            <Text style={styles.pageTitle}>Examination History</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={16} color="#aaa" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search patients..."
                  placeholderTextColor="#aaa"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={20} color="#555" />
              </TouchableOpacity>
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

            {historyData.map((group, gIndex) => (
              <View key={gIndex}>
                <Text style={styles.groupDate}>{group.tanggal}</Text>
                {group.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyCard}
                    onPress={() => goToExamDetails(item)}
                    activeOpacity={0.7}
                  >
                    {/* Foto thumbnail */}
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
                            name="image-outline"
                            size={28}
                            color="#aaa"
                          />
                        </View>
                      )}
                    </View>

                    <View
                      style={[styles.info, { justifyContent: "space-between" }]}
                    >
                      <View style={styles.namaRow}>
                        <Text style={styles.nama}>{item.nama}</Text>
                        <Text style={styles.jam}>{item.jam}</Text>
                      </View>
                      <Text style={styles.judul}>{item.judul}</Text>
                      <Text style={styles.deskripsi} numberOfLines={2}>
                        {item.deskripsi}
                      </Text>

                      {/* ✅ Foto tag icons di history */}
                      <View style={styles.tagRow}>
                        {item.fotoKeys.map((key) => {
                          const icon = getFotoIcon(key);
                          const color = fotoTagColor[key] || {
                            bg: "#E2F0F1",
                            text: "#34B3B9",
                          };
                          return (
                            <View
                              key={key}
                              style={[
                                styles.fotoTag,
                                { backgroundColor: color.bg },
                              ]}
                            >
                              {icon && (
                                <Image
                                  source={icon}
                                  style={[
                                    styles.fotoTagIcon,
                                    { tintColor: color.text },
                                  ]}
                                  resizeMode="contain"
                                />
                              )}
                              <Text
                                style={[
                                  styles.fotoTagText,
                                  { color: color.text },
                                ]}
                              >
                                {fotoLabel[key]}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
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

  // ✅ Foto tags
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  fotoTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  fotoTagIcon: { width: 11, height: 11 },
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
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#333" },
  filterBtn: { backgroundColor: "#fff", padding: 10, borderRadius: 12 },
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
