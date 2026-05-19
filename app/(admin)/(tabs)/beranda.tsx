import { apiRequest } from "@/services/api";
import { getRontgenByPatient } from "@/services/pasienService";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import CardSelamatDatang from "../../../components/beranda/CardSelamatDatang";
import PasienHadirList from "../../../components/beranda/PasienHadirList";
import StatsGrid from "../../../components/beranda/StatsGrid";
import AppHeader from "../../../components/shared/AppHeader";
import { getUser } from "../../../services/authService";
import {
  getDashboard,
  getPasienHariIni,
} from "../../../services/berandaService";
// createRontgen & updateStatusRontgen dihandle di PasienHadirList

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 1;

// ── Mapping status API → tampilan UI ────────────────────────────────────────
// PERBAIKAN: tambahkan key "perlu_upload_foto" yang sebelumnya tidak di-map
// sehingga pasien yang perlu rontgen tidak pernah muncul badge yang benar.
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

export default function Beranda() {
  const scrollY = useSharedValue(0);

  const [unreadNotif, setUnreadNotif] = useState(0);
  const [namaAdmin, setNamaAdmin] = useState("Admin Klinik");
  const [totalRontgen, setTotalRontgen] = useState(0);
  const [stats, setStats] = useState({
    hadir: 0,
    rontgen: 0,
    selesai: 0,
    diRuangan: 0,
  });
  const [pasienList, setPasienList] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const notifRes = await apiRequest(
        "/admin/notifications",
        "GET",
        null,
        true,
      );
      if (notifRes.success) setUnreadNotif(notifRes.unread || 0);

      const user = await getUser();
      if (user?.name) setNamaAdmin(user.name);

      const dashboard = await getDashboard();
      if (dashboard.success) {
        const totals = dashboard.data.totals;
        setTotalRontgen(totals.total_rontgens || 0);
      }

      const reservasi = await getPasienHariIni();
      if (reservasi.success && reservasi.data?.reservations) {
        const list = await Promise.all(
          reservasi.data.reservations.map(async (r: any) => {
            // Default: belum ada rontgen → status "menunggu"
            let statusLabel = "Menunggu";
            let statusWarna = "#7a6200b2";
            let statusBg = "#ffd70031";
            let rontgenId: number | undefined;
            // PERBAIKAN: simpan fotoKeys dari rontgen record agar
            // saat navigasi ke UploadFotoPasien sudah tahu jenis foto apa saja
            let savedFotoKeys: string[] = [];

            const rontgenRes = await getRontgenByPatient(r.patient?.id);
            if (rontgenRes.success && rontgenRes.data?.rontgens?.length > 0) {
              const latest = rontgenRes.data.rontgens[0];
              rontgenId = latest.id;

              // Ambil target_foto yang tersimpan di DB saat createRontgen
              if (latest.target_foto) {
                savedFotoKeys = latest.target_foto
                  .split(",")
                  .map((k: string) => k.trim())
                  .filter(Boolean);
              }

              const mapped = apiStatusToUI[latest.status];
              if (mapped) {
                statusLabel = mapped.label;
                statusWarna = mapped.warna;
                statusBg = mapped.bg;
              }
            }

            return {
              id: r.patient?.id || r.id,
              reservasiId: r.id,
              rontgenId,
              nama: r.patient?.name || "-",
              no: String(r.id).padStart(3, "0"),
              jam: r.appointment_time || "-",
              umur: r.age ? `${r.age} th` : "-",
              status: statusLabel,
              statusWarna,
              statusBg,
              patientId: r.patient?.id,
              doctorId: r.doctor?.id,
              // PERBAIKAN: fotoKeys dari DB, bukan hardcode
              fotoKeys: savedFotoKeys,
            };
          }),
        );

        setPasienList(list);

        const selesai = list.filter((p) => p.status === "Selesai").length;
        const diRuangan = list.filter(
          (p) => p.status === "Dalam Ruangan",
        ).length;
        const hadir = list.filter((p) => p.status === "Menunggu").length;

        setStats({
          hadir,
          rontgen: totalRontgen,
          selesai,
          diRuangan,
        });
      }
    } catch (error) {
      console.log("Error fetch beranda:", error);
    }
  }, [totalRontgen]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

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
      <Animated.View style={[styles.headerWrapper, headerStyle]}>
        <AppHeader scrollY={scrollY} unreadCount={unreadNotif} />
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
        <CardSelamatDatang namaAdmin={namaAdmin} totalRontgen={totalRontgen} />
        <StatsGrid
          hadir={stats.hadir}
          rontgen={stats.rontgen}
          selesai={stats.selesai}
          diRuangan={stats.diRuangan}
        />

        <View style={styles.tips}>
          <Image
            source={require("../../../assets/images/Light.png")}
            style={styles.icon}
          />
          <Text style={styles.tipsText}>
            Tap kartu pasien untuk mengubah status atau upload rontgen.
          </Text>
        </View>

        <PasienHadirList pasienList={pasienList} onRefresh={fetchData} />

        <View style={{ height: 32 }} />
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
  tips: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C0EAE3",
    marginHorizontal: "14%",
    marginTop: 25,
    borderRadius: 20,
    padding: 8,
    gap: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: "#2E9DA4",
    lineHeight: 18,
  },
});
