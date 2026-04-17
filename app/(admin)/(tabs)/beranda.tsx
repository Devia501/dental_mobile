import { useEffect, useState } from "react";
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

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 1;

export default function Beranda() {
  const scrollY = useSharedValue(0);

  const [namaAdmin, setNamaAdmin] = useState("Admin Klinik");
  const [totalRontgen, setTotalRontgen] = useState(0);
  const [stats, setStats] = useState({
    hadir: 0,
    rontgen: 0,
    selesai: 0,
    diRuangan: 0,
  });
  const [pasienList, setPasienList] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Nama admin dari SecureStore
      const user = await getUser();
      if (user?.name) setNamaAdmin(user.name);

      // Dashboard stats
      const dashboard = await getDashboard();
      if (dashboard.success) {
        const daily = dashboard.data.daily_statistics;
        const totals = dashboard.data.totals;

        setTotalRontgen(totals.total_rontgens || 0);
        setStats({
          hadir: daily.validated || 0,
          rontgen: totals.total_rontgens || 0,
          selesai: daily.completed || 0,
          diRuangan: daily.pending || 0,
        });
      }

      // Pasien hadir hari ini
      const reservasi = await getPasienHariIni();
      if (reservasi.success && reservasi.data?.reservations) {
        const list = reservasi.data.reservations.map((r: any) => ({
          id: r.id,
          nama: r.patient?.name || "-",
          no: String(r.id).padStart(3, "0"),
          jam: r.appointment_time || "-",
          umur: r.age ? `${r.age} th` : "-",
          status: "Menunggu",
          statusWarna: "#7a6200b2",
          statusBg: "#ffd70031",
        }));
        setPasienList(list);
      }
    } catch (error) {
      console.log("Error fetch beranda:", error);
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

        <PasienHadirList pasienList={pasienList} />

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
