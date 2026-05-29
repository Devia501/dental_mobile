import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
import StatusBerhasil from "../../../components/beranda/Statusberhasil";
import UbahStatusPasien from "../../../components/beranda/Ubahstatuspasien";
import AppHeader from "../../../components/shared/AppHeader";
import { useUnreadNotif } from "../../../hooks/useUnreadNotif";
import {
  createRontgen,
  getPasienHadir,
  getRontgenByPatient,
  updateStatusRontgen,
} from "../../../services/pasienService";

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 1;
const PASIEN_LIMIT = 5;

const statusIcon: Record<string, any> = {
  "Dalam Ruangan": require("../../../assets/icons/icon_status_ruangan.png"),
  "Perlu Rontgen": require("../../../assets/icons/icon_status_rontgen.png"),
  Selesai: require("../../../assets/icons/icon_status_selesai.png"),
  Menunggu: require("../../../assets/icons/icon_status_menunggu.png"),
};

const fotoIcon: Record<string, any> = {
  rontgen_xray: require("../../../assets/icons/icon_foto_rontgen.png"),
  profil_gigi: require("../../../assets/icons/icon_foto_profil.png"),
  intraoral: require("../../../assets/icons/icon_foto_intraoral.png"),
};

const fotoLabel: Record<string, string> = {
  rontgen_xray: "Rontgen (X-Ray)",
  profil_gigi: "Profil Gigi",
  intraoral: "Foto Intraoral",
};

const filters = ["Semua", "Menunggu", "Di Ruangan", "Upload foto", "Selesai"];

type Pasien = {
  id: number;
  reservasiId: number;
  nama: string;
  no: string;
  jam: string;
  umur: string;
  status: string;
  statusWarna: string;
  statusBg: string;
  fotoKeys?: string[];
  rontgenId?: number;
  doctorId?: number;
  patientId?: number;
};

// Map status API ke label UI
const apiStatusToUI: Record<
  string,
  { label: string; warna: string; bg: string }
> = {
  menunggu: { label: "Menunggu", warna: "#7a6200b2", bg: "#ffd70031" },
  di_dalam_ruangan: {
    label: "Dalam Ruangan",
    warna: "#1010a6a2",
    bg: "#5a88e44e",
  },
  perlu_upload_foto: {
    label: "Perlu Rontgen",
    warna: "#851414b2",
    bg: "#e12c2c31",
  },
  selesai: { label: "Selesai", warna: "#134a4d9b", bg: "#C0EAE3" },
};

// Map key dari modal ke status API
const modalKeyToApiStatus: Record<string, string> = {
  menunggu: "menunggu",
  ruangan: "di_dalam_ruangan",
  rontgen: "perlu_upload_foto",
  selesai: "selesai",
};

const filterMap: Record<string, string[]> = {
  Semua: ["Dalam Ruangan", "Perlu Rontgen", "Selesai", "Menunggu"],
  Menunggu: ["Menunggu"],
  "Di Ruangan": ["Dalam Ruangan"],
  "Upload foto": ["Perlu Rontgen"],
  Selesai: ["Selesai"],
};

export default function Pasien() {
  const [data, setData] = useState<Pasien[]>([]);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [successSubtitle, setSuccessSubtitle] = useState(
    "Perubahan telah tersimpan ke sistem",
  );
  const scrollY = useSharedValue(0);
  const unreadCount = useUnreadNotif();

  useFocusEffect(
    useCallback(() => {
      fetchPasien();
    }, []),
  );

  const fetchPasien = async () => {
    try {
      const res = await getPasienHadir();
      if (res.success && res.data?.reservations) {
        const list: Pasien[] = await Promise.all(
          res.data.reservations.map(async (r: any) => {
            // Cek apakah pasien sudah punya rontgen
            let rontgenId: number | undefined;
            let statusLabel = "Menunggu";
            let statusWarna = "#7a6200b2";
            let statusBg = "#ffd70031";

            const rontgenRes = await getRontgenByPatient(r.patient?.id);
            if (rontgenRes.success && rontgenRes.data?.rontgens?.length > 0) {
              const latestRontgen = rontgenRes.data.rontgens[0];
              rontgenId = latestRontgen.id;
              const mapped = apiStatusToUI[latestRontgen.status];
              if (mapped) {
                statusLabel = mapped.label;
                statusWarna = mapped.warna;
                statusBg = mapped.bg;
              }
            }

            return {
              id: r.patient?.id,
              reservasiId: r.id,
              nama: r.patient?.name || "-",
              no: String(r.id).padStart(3, "0"),
              jam: r.appointment_time || "-",
              umur: r.age ? `${r.age} th` : "-",
              status: statusLabel,
              statusWarna,
              statusBg,
              rontgenId,
              doctorId: r.doctor?.id,
              patientId: r.patient?.id,
            };
          }),
        );
        setData(list);
      }
    } catch (error) {
      console.log("Error fetch pasien:", error);
    }
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

  const filtered = data
    .filter((p) => filterMap[activeFilter].includes(p.status))
    .filter(
      (p) =>
        search === "" || p.nama.toLowerCase().includes(search.toLowerCase()),
    );

  const displayedPasien = showAll ? filtered : filtered.slice(0, PASIEN_LIMIT);
  const hasMore = filtered.length > PASIEN_LIMIT;

  const handleSave = async (
    pasienId: number,
    statusKey: string,
    fotoKeys?: string[],
    _tanpaFoto?: boolean,
  ): Promise<{ rontgenId: number; doctorId?: number } | null> => {
    const apiStatus = modalKeyToApiStatus[statusKey];
    const mapped = apiStatusToUI[apiStatus];
    const pasien = data.find((p) => p.id === pasienId);

    try {
      let rontgenId = pasien?.rontgenId;

      if (!rontgenId) {
        // Belum punya rontgen → buat baru
        const res = await createRontgen(
          pasien?.patientId || pasienId,
          pasien?.doctorId || 1,
          apiStatus,
        );
        if (res.success) {
          rontgenId = res.data?.id;
        }
      } else {
        // Sudah ada rontgen → update status
        await updateStatusRontgen(rontgenId, apiStatus);
      }

      // Update UI
      setData((prev) =>
        prev.map((p) =>
          p.id === pasienId
            ? {
                ...p,
                status: mapped.label,
                statusWarna: mapped.warna,
                statusBg: mapped.bg,
                rontgenId,
                fotoKeys,
              }
            : p,
        ),
      );

      setShowSuccess(true);
      setSuccessSubtitle("Perubahan telah tersimpan ke sistem");

      // Return rontgenId & doctorId → UbahStatusPasien yang handle navigasi
      if (rontgenId) {
        return { rontgenId, doctorId: pasien?.doctorId };
      }
      return null;
    } catch (error) {
      console.log("Error save status:", error);
      return null;
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
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
        <Text style={styles.pageTitle}>Daftar Pasien Hadir</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterWrapper}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                activeFilter === f && styles.filterBtnActive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={16} color="#aaa" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama pasien..."
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setShowAll(false);
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {(() => {
          const emptyByFilter: Record<
            string,
            { icon: string; title: string; subtitle: string }
          > = {
            Semua: {
              icon: "people-outline",
              title: "Tidak ada pasien hadir",
              subtitle: "Belum ada pasien yang terdaftar hari ini",
            },
            Menunggu: {
              icon: "time-outline",
              title: "Tidak ada pasien menunggu",
              subtitle: "Semua pasien sudah ditangani",
            },
            "Di Ruangan": {
              icon: "medkit-outline",
              title: "Tidak ada pasien di ruangan",
              subtitle: "Belum ada pasien yang sedang diperiksa",
            },
            "Upload foto": {
              icon: "camera-outline",
              title: "Tidak ada pasien perlu upload foto",
              subtitle: "Belum ada rekomendasi foto dari dokter",
            },
            Selesai: {
              icon: "checkmark-circle-outline",
              title: "Belum ada pasien selesai",
              subtitle: "Pasien yang selesai akan muncul di sini",
            },
          };

          const emptyInfo =
            emptyByFilter[activeFilter] ?? emptyByFilter["Semua"];

          if (data.length === 0 || filtered.length === 0) {
            const isSearchEmpty =
              data.length > 0 && filtered.length === 0 && search !== "";
            return (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={
                    isSearchEmpty ? "search-outline" : (emptyInfo.icon as any)
                  }
                  size={52}
                  color="#ccc"
                />
                <Text style={styles.emptyTitle}>
                  {isSearchEmpty ? "Pasien tidak ditemukan" : emptyInfo.title}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isSearchEmpty
                    ? "Coba cari dengan nama yang berbeda"
                    : emptyInfo.subtitle}
                </Text>
              </View>
            );
          }

          return (
            <View style={styles.listWrapper}>
              {displayedPasien.map((pasien) => {
                const hasRontgen =
                  pasien.status === "Perlu Rontgen" &&
                  pasien.fotoKeys &&
                  pasien.fotoKeys.length > 0;
                return (
                  <TouchableOpacity
                    key={pasien.id}
                    style={styles.card}
                    onPress={() => {
                      setSelectedPasien(pasien);
                      setModalVisible(true);
                    }}
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

                      <View style={styles.badgeRow}>
                        {hasRontgen ? (
                          pasien.fotoKeys!.map((key) => (
                            <View key={key} style={styles.fotoTag}>
                              {fotoIcon[key] && (
                                <Image
                                  source={fotoIcon[key]}
                                  style={styles.fotoTagIcon}
                                  resizeMode="contain"
                                />
                              )}
                              <Text style={styles.fotoTagText}>
                                {fotoLabel[key]}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: pasien.statusBg },
                            ]}
                          >
                            {statusIcon[pasien.status] && (
                              <Image
                                source={statusIcon[pasien.status]}
                                style={styles.badgeIcon}
                                resizeMode="contain"
                              />
                            )}
                            <Text
                              style={[
                                styles.statusText,
                                { color: pasien.statusWarna },
                              ]}
                            >
                              {pasien.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {hasRontgen ? (
                      <View style={styles.rontgenIcon}>
                        <Image
                          source={require("../../../assets/icons/camera.png")}
                          style={styles.cameraIcon}
                        />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    )}
                  </TouchableOpacity>
                );
              })}

              {hasMore && !showAll && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setShowAll(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showMoreText}>
                    Lihat Selengkapnya ({filtered.length - PASIEN_LIMIT}{" "}
                    lainnya)
                  </Text>
                  <Ionicons name="chevron-down" size={15} color="#2E9DA4" />
                </TouchableOpacity>
              )}

              {showAll && filtered.length > PASIEN_LIMIT && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setShowAll(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showMoreText}>
                    Tampilkan lebih sedikit
                  </Text>
                  <Ionicons name="chevron-up" size={15} color="#2E9DA4" />
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
      </Animated.ScrollView>

      <UbahStatusPasien
        visible={modalVisible}
        pasien={selectedPasien}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <StatusBerhasil
        visible={showSuccess}
        subtitle={successSubtitle}
        onDone={handleSuccessDone}
      />
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
  pageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginHorizontal: 32,
    marginTop: 30,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#bbb",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#333" },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0f5f6",
    elevation: 1,
  },
  showMoreText: {
    fontSize: 13,
    color: "#2E9DA4",
    fontWeight: "600",
  },
  filterWrapper: { paddingHorizontal: 16, gap: 6, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#E2F0F1",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  filterBtnActive: { backgroundColor: "#34B3B9", borderColor: "#34B3B9" },
  filterText: { fontSize: 13, color: "#535151" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
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
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  badgeIcon: { width: 13, height: 13 },
  statusText: { fontSize: 11, fontWeight: "600" },
  fotoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2F0F1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  fotoTagIcon: { width: 11, height: 11 },
  fotoTagText: { fontSize: 10, color: "#2E9DA4", fontWeight: "600" },
  rontgenIcon: { backgroundColor: "#34B3B9", padding: 4, borderRadius: 12 },
  cameraIcon: { width: 25, height: 25 },
});
