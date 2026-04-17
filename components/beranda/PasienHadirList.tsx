import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import StatusBerhasil from "./Statusberhasil";
import UbahStatusPasien from "./Ubahstatuspasien";

const getStatusIcon = (status: string) => {
  try {
    switch (status) {
      case "Dalam Ruangan":
        return require("../../assets/icons/icon_status_ruangan.png");
      case "Perlu Rontgen":
        return require("../../assets/icons/icon_status_rontgen.png");
      case "Selesai":
        return require("../../assets/icons/icon_status_selesai.png");
      case "Menunggu":
        return require("../../assets/icons/icon_status_menunggu.png");
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// Map status dari API ke label UI
const mapStatus = (apiStatus: string) => {
  switch (apiStatus) {
    case "menunggu":
      return { label: "Menunggu", warna: "#7a6200b2", bg: "#ffd70031" };
    case "di_dalam_ruangan":
      return { label: "Dalam Ruangan", warna: "#1010a6a2", bg: "#5a88e44e" };
    case "perlu_upload_foto":
      return { label: "Perlu Rontgen", warna: "#851414b2", bg: "#e12c2c31" };
    case "selesai":
      return { label: "Selesai", warna: "#134a4d9b", bg: "#C0EAE3" };
    default:
      return { label: "Menunggu", warna: "#7a6200b2", bg: "#ffd70031" };
  }
};

const statusMap: Record<string, { label: string; warna: string; bg: string }> =
  {
    menunggu: { label: "Menunggu", warna: "#7a6200b2", bg: "#ffd70031" },
    ruangan: { label: "Dalam Ruangan", warna: "#1010a6a2", bg: "#5a88e44e" },
    rontgen: { label: "Perlu Rontgen", warna: "#851414b2", bg: "#e12c2c31" },
    selesai: { label: "Selesai", warna: "#134a4d9b", bg: "#C0EAE3" },
  };

type PasienItem = {
  id: number;
  nama: string;
  no: string;
  jam: string;
  umur: string;
  status: string;
  statusWarna: string;
  statusBg: string;
  rontgenId?: number;
};

interface Props {
  pasienList?: PasienItem[];
}

export default function PasienHadirList({ pasienList = [] }: Props) {
  const [data, setData] = useState<PasienItem[]>(pasienList);
  const [selectedPasien, setSelectedPasien] = useState<PasienItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSubtitle, setSuccessSubtitle] = useState(
    "Perubahan telah tersimpan ke sistem",
  );
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  // Update data saat props berubah
  useState(() => {
    setData(pasienList);
  });

  const handlePress = (pasien: PasienItem) => {
    setSelectedPasien(pasien);
    setModalVisible(true);
  };

  const handleSave = (
    pasienId: number,
    statusKey: string,
    fotoKeys?: string[],
  ) => {
    const mapped = statusMap[statusKey];
    const pasien = data.find((p) => p.id === pasienId);

    setData((prev) =>
      prev.map((p) =>
        p.id === pasienId
          ? {
              ...p,
              status: mapped.label,
              statusWarna: mapped.warna,
              statusBg: mapped.bg,
            }
          : p,
      ),
    );

    if (statusKey === "rontgen" && pasien) {
      setSuccessSubtitle("Redirect to upload foto...");
      setPendingNav(
        () => () =>
          router.push({
            pathname: "/(admin)/Uploadfotopasien ",
            params: {
              nama: pasien.nama,
              no: pasien.no,
              jam: pasien.jam,
              umur: pasien.umur,
              fotoKeys: (fotoKeys || []).join(","),
            },
          }),
      );
    } else {
      setSuccessSubtitle("Perubahan telah tersimpan ke sistem");
      setPendingNav(() => () => router.push("/(admin)/(tabs)/pasien"));
    }

    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    if (pendingNav) {
      pendingNav();
      setPendingNav(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pasien Hadir Hari Ini</Text>
        <TouchableOpacity onPress={() => router.push("/(admin)/(tabs)/pasien")}>
          <Text style={styles.semua}>Semua</Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#aaa", marginTop: 20 }}>
          Tidak ada pasien hadir hari ini
        </Text>
      ) : (
        data.map((pasien) => (
          <TouchableOpacity
            key={pasien.id}
            style={styles.card}
            onPress={() => handlePress(pasien)}
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
              <View
                style={[styles.badge, { backgroundColor: pasien.statusBg }]}
              >
                {getStatusIcon(pasien.status) && (
                  <Image
                    source={getStatusIcon(pasien.status)}
                    style={styles.badgeIcon}
                    resizeMode="contain"
                  />
                )}
                <Text style={[styles.badgeText, { color: pasien.statusWarna }]}>
                  {pasien.status}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        ))
      )}

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
  container: { marginTop: 24, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a1a" },
  semua: { fontSize: 13, color: "#34B3B9", fontWeight: "500" },
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
    gap: 5,
  },
  badgeIcon: { width: 13, height: 13 },
  badgeText: { fontSize: 11, fontWeight: "600" },
});
