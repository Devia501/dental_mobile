import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router"; // Tambah useFocusEffect untuk auto-refresh
import { useCallback, useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
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
import { getDashboard } from "../../../services/berandaService";
import { getRontgenList } from "../../../services/rontgenService";

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 1;
const { width } = Dimensions.get("window");
const BAR_HEIGHT = 120;

const SEMUA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAY_INDEX: Record<number, string> = {
  1: "Sen",
  2: "Sel",
  3: "Rab",
  4: "Kam",
  5: "Jum",
  6: "Sab",
  0: "Min",
};

const PERIODE_OPTIONS = [
  { label: "Bulan Ini", value: "this_month" },
  { label: "Bulan Lalu", value: "last_month" },
  { label: "3 Bulan Terakhir", value: "3_months" },
  { label: "Tahun Ini", value: "this_year" },
];

// Helper tetap gua jaga sesuai kodingan lo
const getPeriodeRange = (periodeLabel: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (periodeLabel) {
    case "Bulan Ini":
      return {
        start: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        end: `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`,
      };
    case "Bulan Lalu": {
      const lastMonth = month === 0 ? 12 : month;
      const lastYear = month === 0 ? year - 1 : year;
      return {
        start: `${lastYear}-${String(lastMonth).padStart(2, "0")}-01`,
        end: `${lastYear}-${String(lastMonth).padStart(2, "0")}-${new Date(lastYear, lastMonth, 0).getDate()}`,
      };
    }
    case "3 Bulan Terakhir": {
      const threeMonthsAgo = new Date(year, month - 2, 1);
      return {
        start: `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`,
        end: `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`,
      };
    }
    case "Tahun Ini":
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      };
    default:
      return {
        start: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        end: `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`,
      };
  }
};

const formatTanggal = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Laporan() {
  const scrollY = useSharedValue(0);
  const unreadCount = useUnreadNotif();

  const [totalPemeriksaan, setTotalPemeriksaan] = useState(0);
  const [totalXRay, setTotalXRay] = useState(0);
  const [aktivitasHarian, setAktivitasHarian] = useState<any[]>(
    SEMUA_HARI.map((h) => ({ hari: h, nilai: 0, active: false, persen: 8 })),
  );
  const [pasienTerakhir, setPasienTerakhir] = useState<any[]>([]);
  const [periode, setPeriode] = useState({ start: "", end: "" });
  const [selectedPeriode, setSelectedPeriode] = useState("Bulan Ini");
  const [showPeriodeModal, setShowPeriodeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Perbaikan: Gunakan useFocusEffect agar data selalu fresh saat tab dibuka
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedPeriode]),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const range = getPeriodeRange(selectedPeriode);
      setPeriode({ start: range.start, end: range.end });

      // Sesuai ERD: Mengambil data rontgen dan dashboard
      const [dashboard, rontgens] = await Promise.all([
        getDashboard(),
        getRontgenList("selesai"),
      ]);

      if (dashboard.success) {
        // Ambil data total rontgen dari tabel rontgen via dashboard
        setTotalXRay(dashboard.data.totals?.total_rontgens || 0);
      }

      if (rontgens.success && rontgens.data?.rontgens) {
        const allRontgens = rontgens.data.rontgens;

        // Filter by periode sesuai logika lo
        const filtered = allRontgens.filter((r: any) => {
          const tgl = r.created_at?.split(" ")[0];
          return tgl >= range.start && tgl <= range.end;
        });

        setTotalPemeriksaan(filtered.length);

        // Hitung aktivitas harian secara dinamis dari data API
        const hariMap: Record<string, number> = {};
        filtered.forEach((r: any) => {
          const tgl = new Date(r.created_at);
          const hariKey = DAY_INDEX[tgl.getDay()];
          hariMap[hariKey] = (hariMap[hariKey] || 0) + 1;
        });

        const maxNilai = Math.max(...Object.values(hariMap), 1);
        const aktivitas = SEMUA_HARI.map((h) => ({
          hari: h,
          nilai: hariMap[h] || 0,
          active: (hariMap[h] || 0) > 0,
          persen: hariMap[h]
            ? Math.max(Math.round((hariMap[h] / maxNilai) * 100), 15)
            : 8,
        }));
        setAktivitasHarian(aktivitas);

        // Map data ke pasienTerakhir tanpa menghilangkan field yang lo butuhin untuk detail
        const list = filtered.slice(0, 10).map((r: any) => {
          const images = r.examination_images || [];
          const xrayCount = images.filter(
            (i: any) =>
              i.image_type === "xray" || i.image_type === "rontgen_xray",
          ).length;
          const profilCount = images.filter(
            (i: any) => i.image_type === "profil_gigi",
          ).length;
          const intraoralCount = images.filter(
            (i: any) => i.image_type === "intraoral",
          ).length;

          // Nomor pasien: ambil dari patient_number jika ada, fallback ke patient.id
          const patientId = r.patient?.id;
          const pasienNo =
            r.patient?.patient_number ??
            (patientId ? "PT-" + String(patientId).padStart(6, "0") : "-");

          return {
            id: r.id,
            nama: r.patient?.name || "-",
            tanggal: formatTanggal(r.created_at?.split(" ")[0]),
            xray: xrayCount,
            warna: "#E2F0F1",
            iconColor: "#2E9DA4",
            rontgenId: r.id,
            no: pasienNo,
            jam: r.created_at?.split(" ")[1]?.slice(0, 5) || "-",
            umur: r.patient?.age ? `${r.patient.age} th` : "-",
            dokter: r.doctor?.name || "-",
            notes: r.detail || "",
            fotoRontgen: String(xrayCount),
            fotoProfil: String(profilCount),
            fotoIntraoral: String(intraoralCount),
          };
        });
        setPasienTerakhir(list);
      }
    } catch (error) {
      console.log("Error fetch laporan:", error);
    } finally {
      setLoading(false);
    }
  };

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
      <Modal
        visible={showPeriodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodeModal(false)}
        >
          <View style={styles.periodeModalCard}>
            <Text style={styles.periodeModalTitle}>Pilih Periode</Text>
            {PERIODE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.periodeOption,
                  selectedPeriode === opt.label && styles.periodeOptionActive,
                ]}
                onPress={() => {
                  setSelectedPeriode(opt.label);
                  setShowPeriodeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.periodeOptionText,
                    selectedPeriode === opt.label &&
                      styles.periodeOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {selectedPeriode === opt.label && (
                  <Ionicons name="checkmark" size={16} color="#34B3B9" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
        <Text style={styles.pageTitle}>Laporan Pasien</Text>

        <TouchableOpacity
          style={styles.periodeCard}
          onPress={() => setShowPeriodeModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.periodeLeft}>
            <Ionicons name="calendar-outline" size={20} color="#34B3B9" />
            <View>
              <Text style={styles.periodeLabel}>PERIODE LAPORAN</Text>
              <Text style={styles.periodeValue}>
                {periode.start && periode.end
                  ? `${formatTanggal(periode.start)} - ${formatTanggal(periode.end)}`
                  : selectedPeriode}
              </Text>
            </View>
          </View>
          <View style={styles.periodeFilterBtn}>
            <Ionicons name="options-outline" size={18} color="#34B3B9" />
            <Text style={styles.periodeFilterText}>Filter</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.statsCardTeal]}>
            <Ionicons name="bar-chart" size={20} color="#80bec1" />
            <Text style={styles.statsLabelWhite}>Total Pemeriksaan</Text>
            <Text style={styles.statsNumberWhite}>{totalPemeriksaan}</Text>
            <View style={styles.statsBadge}>
              <Text style={styles.statsBadgeText}>{selectedPeriode}</Text>
            </View>
          </View>

          <View style={[styles.statsCard, styles.statsCardWhite]}>
            <Ionicons name="camera-outline" size={20} color="#34B3B9" />
            <Text style={styles.statsLabelTeal}>Total Foto X-Ray</Text>
            <Text style={styles.statsNumberTeal}>{totalXRay}</Text>
            <Text style={styles.statsActive}>TOTAL TERSIMPAN</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aktivitas Harian</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartWrapper}>
            {aktivitasHarian.map((item: any, index: number) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((item.persen / 100) * BAR_HEIGHT, 6),
                        backgroundColor: item.active ? "#34B3B9" : "#D8EEEF",
                        opacity: item.active ? 1 : 0.6,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    item.active && { color: "#34B3B9", fontWeight: "800" },
                  ]}
                >
                  {item.hari}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.daftarHeader}>
          <Text style={styles.sectionTitle}>Daftar Pasien Terakhir</Text>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Memuat data...</Text>
        ) : pasienTerakhir.length === 0 ? (
          <Text style={styles.emptyText}>
            Tidak ada data pada periode {selectedPeriode.toLowerCase()}
          </Text>
        ) : (
          <View style={styles.listWrapper}>
            {pasienTerakhir.map((pasien) => (
              <TouchableOpacity
                key={pasien.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/ExamDetails",
                    params: { ...pasien }, // Tetap kirim semua params sesuai keinginan lo
                  })
                }
              >
                <View
                  style={[styles.avatar, { backgroundColor: pasien.warna }]}
                >
                  <Ionicons name="person" size={24} color={pasien.iconColor} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.nama}>{pasien.nama}</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.tanggal}>{pasien.tanggal}</Text>
                    {(pasien.xray > 0 ||
                      pasien.fotoProfil > 0 ||
                      pasien.fotoIntraoral > 0) && (
                      <>
                        {pasien.xray > 0 && (
                          <>
                            <Text style={styles.dot}> • </Text>
                            <Text style={styles.xray}>{pasien.xray} X-Ray</Text>
                          </>
                        )}
                        {pasien.fotoProfil > 0 && (
                          <>
                            <Text style={styles.dot}> • </Text>
                            <Text style={styles.xray}>
                              {pasien.fotoProfil} Profil
                            </Text>
                          </>
                        )}
                        {pasien.fotoIntraoral > 0 && (
                          <>
                            <Text style={styles.dot}> • </Text>
                            <Text style={styles.xray}>
                              {pasien.fotoIntraoral} Intraoral
                            </Text>
                          </>
                        )}
                      </>
                    )}
                    {pasien.xray === 0 &&
                      pasien.fotoProfil === 0 &&
                      pasien.fotoIntraoral === 0 && (
                        <>
                          <Text style={styles.dot}> • </Text>
                          <Text style={{ fontSize: 12, color: "#aaa" }}>
                            Belum ada foto
                          </Text>
                        </>
                      )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

// Styles tetap sama (tidak ada perubahan di bagian ini agar visual tidak rusak)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2F0F1" },
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
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 20,
    fontSize: 14,
    marginHorizontal: 16,
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
  },
  periodeLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  periodeLabel: {
    fontSize: 10,
    color: "#aaa",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  periodeValue: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  periodeFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E2F0F1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  periodeFilterText: { fontSize: 12, color: "#34B3B9", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  periodeModalCard: {
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  periodeModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
  },
  periodeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#f9f9f9",
  },
  periodeOptionActive: {
    backgroundColor: "#E2F0F1",
    borderWidth: 1,
    borderColor: "#34B3B9",
  },
  periodeOptionText: { fontSize: 14, color: "#555" },
  periodeOptionTextActive: { color: "#34B3B9", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statsCard: { flex: 1, borderRadius: 22, padding: 14, gap: 6, elevation: 2 },
  statsCardTeal: { backgroundColor: "#35a5ad" },
  statsCardWhite: { backgroundColor: "#fff" },
  statsLabelWhite: { fontSize: 12, color: "#bccbcc" },
  statsLabelTeal: { fontSize: 12, color: "#888" },
  statsNumberWhite: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  statsNumberTeal: { fontSize: 32, fontWeight: "bold", color: "#1a1a1a" },
  statsBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statsBadgeText: { fontSize: 11, color: "#c3dbdc" },
  statsActive: { fontSize: 11, color: "#34B3B9", fontWeight: "700" },
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
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  chartWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: BAR_HEIGHT + 24,
  },
  barWrapper: { alignItems: "center", gap: 6, flex: 1 },
  barContainer: { height: BAR_HEIGHT, justifyContent: "flex-end" },
  bar: { width: 26, borderRadius: 10 },
  barLabel: { fontSize: 11, color: "#aaa", fontWeight: "600" },
  daftarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  listWrapper: { paddingHorizontal: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1, gap: 4 },
  nama: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  infoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  tanggal: { fontSize: 12, color: "#888" },
  dot: { fontSize: 12, color: "#888" },
  xray: { fontSize: 12, color: "#2E9DA4", fontWeight: "600" },
});
