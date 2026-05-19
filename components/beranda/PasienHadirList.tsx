import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  createRontgen,
  getRontgenByPatient,
  updateTargetFotoRontgen,
} from "../../services/pasienService";
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

const modalKeyToApiStatus: Record<string, string> = {
  menunggu: "menunggu",
  ruangan: "di_dalam_ruangan",
  rontgen: "perlu_upload_foto",
  selesai: "selesai",
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
  patientId?: number;
  doctorId?: number;
};

interface Props {
  pasienList?: PasienItem[];
  onRefresh?: () => void;
}

export default function PasienHadirList({ pasienList = [], onRefresh }: Props) {
  const [data, setData] = useState<PasienItem[]>(pasienList);
  const [selectedPasien, setSelectedPasien] = useState<PasienItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSubtitle, setSuccessSubtitle] = useState(
    "Perubahan telah tersimpan ke sistem",
  );

  useEffect(() => {
    setData(pasienList);
  }, [pasienList]);

  const handlePress = (pasien: PasienItem) => {
    setSelectedPasien(pasien);
    setModalVisible(true);
  };

  const handleSave = async (
    pasienId: number,
    statusKey: string,
    fotoKeys?: string[],
    tanpaFoto?: boolean,
  ): Promise<{ rontgenId: number; doctorId?: number } | null> => {
    // ← tambah return type
    const apiStatus = modalKeyToApiStatus[statusKey];
    const mapped = apiStatusToUI[apiStatus];
    const pasien = data.find((p) => p.id === pasienId);

    try {
      let rontgenId = pasien?.rontgenId;

      if (!rontgenId && pasien?.patientId) {
        const rontgenRes = await getRontgenByPatient(pasien.patientId);
        if (rontgenRes.success && rontgenRes.data?.rontgens?.length > 0) {
          rontgenId = rontgenRes.data.rontgens[0].id;
        }
      }

      if (!rontgenId) {
        const res = await createRontgen(
          pasien?.patientId || pasienId,
          pasien?.doctorId || 1,
          apiStatus,
          statusKey === "rontgen" ? fotoKeys : undefined,
        );
        if (res.success) {
          rontgenId = res.data?.rontgen?.id ?? res.data?.id;
        }
      } else {
        await updateTargetFotoRontgen(
          rontgenId,
          apiStatus,
          statusKey === "rontgen" ? fotoKeys : undefined,
        );
      }

      // Update badge
      setData((prev) =>
        prev.map((p) =>
          p.id === pasienId
            ? {
                ...p,
                status: mapped.label,
                statusWarna: mapped.warna,
                statusBg: mapped.bg,
                rontgenId,
              }
            : p,
        ),
      );

      // Return rontgenId agar UbahStatusPasien bisa navigasi
      if ((statusKey === "rontgen" || statusKey === "selesai") && rontgenId) {
        return { rontgenId, doctorId: pasien?.doctorId };
      }

      // Untuk menunggu/ruangan — tampilkan sukses biasa
      setSuccessSubtitle("Perubahan telah tersimpan ke sistem");
      setShowSuccess(true);
      return null;
    } catch (error) {
      console.log("Error save status:", error);
      return null;
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    if (onRefresh) onRefresh();
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
