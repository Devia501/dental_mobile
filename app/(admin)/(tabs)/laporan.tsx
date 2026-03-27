import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import AppHeader from "../../../components/shared/AppHeader";

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 1;
const { width } = Dimensions.get("window");

const aktivitasHarian = [
  { hari: "Sen", nilai: 60 },
  { hari: "Sel", nilai: 80 },
  { hari: "Rab", nilai: 100 },
  { hari: "Kam", nilai: 70 },
  { hari: "Jum", nilai: 90 },
  { hari: "Sab", nilai: 50 },
  { hari: "Min", nilai: 40 },
];

const MAX_BAR = 100;
const BAR_HEIGHT = 120;

const pasienTerakhir = [
  {
    id: 1,
    nama: "Budi Santoso",
    tanggal: "24 Okt 2025",
    xray: 3,
    warna: "#E2F0F1",
    iconColor: "#2E9DA4",
    // Data untuk ExamDetails
    no: "001", jam: "08:30", umur: "32 th",
    dokter: "Dr. Budi Setiawan",
    notes: "Pemeriksaan rutin gigi geraham. Disarankan penambalan segera.",
    fotoRontgen: "2", fotoProfil: "1", fotoIntraoral: "0",
  },
  {
    id: 2,
    nama: "Siti Aminah",
    tanggal: "23 Okt 2025",
    xray: 1,
    warna: "#E2F0F1",
    iconColor: "#2E9DA4",
    no: "002", jam: "09:15", umur: "28 th",
    dokter: "Dr. Ani Rahayu",
    notes: "Pemeriksaan orthodontik rutin. Perkembangan baik.",
    fotoRontgen: "1", fotoProfil: "0", fotoIntraoral: "0",
  },
  {
    id: 3,
    nama: "Rahmat Hidayat",
    tanggal: "22 Okt 2025",
    xray: 2,
    warna: "#2E9DA4",
    iconColor: "#fff",
    no: "003", jam: "10:00", umur: "45 th",
    dokter: "Dr. Cahyo Prabowo",
    notes: "Infeksi terdeteksi pada gigi #14. Perlu tindak lanjut segera.",
    fotoRontgen: "2", fotoProfil: "0", fotoIntraoral: "1",
  },
];

export default function Laporan() {
  const scrollY = useSharedValue(0);

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

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Judul */}
        <Text style={styles.pageTitle}>Laporan Pasien</Text>

        {/* Periode Laporan */}
        <View style={styles.periodeCard}>
          <View style={styles.periodeLeft}>
            <Ionicons name="calendar-outline" size={20} color="#34B3B9" />
            <View>
              <Text style={styles.periodeLabel}>PERIODE LAPORAN</Text>
              <Text style={styles.periodeValue}>01 Okt - 31 Okt 2025</Text>
            </View>
          </View>
          <Ionicons name="options-outline" size={20} color="#5d5959" />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {/* Total Pemeriksaan */}
          <View style={[styles.statsCard, styles.statsCardTeal]}>
            <Ionicons name="bar-chart" size={20} color="#80bec1" />
            <Text style={styles.statsLabelWhite}>Total Pemeriksaan</Text>
            <Text style={styles.statsNumberWhite}>148</Text>
            <View style={styles.statsBadge}>
              <Text style={styles.statsBadgeText}>+12% vs bln lalu</Text>
            </View>
          </View>

          {/* Total Foto X-Ray */}
          <View style={[styles.statsCard, styles.statsCardWhite]}>
            <Ionicons name="camera-outline" size={20} color="#34B3B9" />
            <Text style={styles.statsLabelTeal}>Total Foto X-Ray</Text>
            <Text style={styles.statsNumberTeal}>426</Text>
            <Text style={styles.statsActive}>AKTIF TERKIRIM</Text>
          </View>
        </View>

        {/* Aktivitas Harian */}
        <Text style={styles.sectionTitle}>Aktivitas Harian</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartWrapper}>
            {aktivitasHarian.map((item, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.nilai / MAX_BAR) * BAR_HEIGHT,
                        backgroundColor:
                          item.hari === "Rab" || item.hari === "Jum"
                            ? "#34B3B9"
                            : "#C0EAE3",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.hari}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daftar Pasien Terakhir */}
        <View style={styles.daftarHeader}>
          <Text style={styles.sectionTitle}>Daftar Pasien Terakhir</Text>
          <View style={styles.daftarIcons}>
            <TouchableOpacity>
              <Ionicons name="search-outline" size={20} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="filter-outline" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listWrapper}>
          {pasienTerakhir.map((pasien) => (
            <TouchableOpacity
              key={pasien.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/(admin)/ExamDetails",
                  params: {
                    nama:          pasien.nama,
                    no:            pasien.no,
                    jam:           pasien.jam,
                    umur:          pasien.umur,
                    dokter:        pasien.dokter,
                    notes:         pasien.notes,
                    fotoRontgen:   pasien.fotoRontgen,
                    fotoProfil:    pasien.fotoProfil,
                    fotoIntraoral: pasien.fotoIntraoral,
                  },
                })
              }
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: pasien.warna }]}>
                <Ionicons name="person" size={24} color={pasien.iconColor} />
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.nama}>{pasien.nama}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.tanggal}>{pasien.tanggal}</Text>
                  <Text style={styles.dot}> • </Text>
                  <Text style={styles.xray}>{pasien.xray} X-Rays</Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E2F0F1",
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  periodeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  periodeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  periodeLabel: {
    fontSize: 10,
    color: "#aaa",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  periodeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsCardTeal: {
    backgroundColor: "#35a5ad",
  },
  statsCardWhite: {
    backgroundColor: "#fff",
  },
  statsLabelWhite: {
    fontSize: 12,
    color: "#bccbcc",
  },
  statsLabelTeal: {
    fontSize: 12,
    color: "#888",
  },
  statsNumberWhite: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  statsNumberTeal: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  statsBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statsBadgeText: {
    fontSize: 11,
    color: "#c3dbdc",
  },
  statsActive: {
    fontSize: 11,
    color: "#34B3B9",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 26,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc5c5",
  },
  chartWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: BAR_HEIGHT + 24,
  },
  barWrapper: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  barContainer: {
    height: BAR_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: 28,
    borderRadius: 10,
  },
  barLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
  },
  daftarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 4,
    marginBottom: 12,
  },
  daftarIcons: {
    flexDirection: "row",
    gap: 10,
    right: 20,
  },
  listWrapper: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nama: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tanggal: {
    fontSize: 12,
    color: "#888",
  },
  dot: {
    fontSize: 12,
    color: "#888",
  },
  xray: {
    fontSize: 12,
    color: "#2E9DA4",
    fontWeight: "600",
  },
});