import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Notif = {
  id: number;
  judul: string;
  pesan: string;
  waktu: string;
  dibaca: boolean;
  aksen: string; // warna strip kiri
};

const initialBaru: Notif[] = [
  {
    id: 1,
    judul: "Segera Upload Rontgen",
    pesan:
      "Budi Santoso (No. 001) keluar ruangan. Dokter merekomendasikan foto rontgen segera.",
    waktu: "3 menit lalu",
    dibaca: false,
    aksen: "#FF5C5C",
  },
  {
    id: 2,
    judul: "Pasien Masuk Ruangan",
    pesan:
      "Ahmad Fauzi (No. 003) telah dipanggil masuk ke ruang periksa dokter.",
    waktu: "16 menit lalu",
    dibaca: false,
    aksen: "#7B8DE8",
  },
];

const initialSebelumnya: Notif[] = [
  {
    id: 3,
    judul: "Foto Rontgen Tersimpan",
    pesan:
      "Foto rontgen Siti Rahayu (No. 002) berhasil diunggah dan tersimpan di server.",
    waktu: "34 menit lalu",
    dibaca: true,
    aksen: "#34B3B9",
  },
  {
    id: 4,
    judul: "Catatan Klinis Kosong",
    pesan:
      "Foto rontgen Riko Pratama (No. 005) sudah diupload, namun keterangan pemeriksaan belum diisi.",
    waktu: "52 menit lalu",
    dibaca: true,
    aksen: "#E8A030",
  },
  {
    id: 5,
    judul: "Laporan Harian Siap",
    pesan:
      "Laporan hari ini tersedia. 6 pasien hadir, 3 foto rontgen berhasil diupload.",
    waktu: "3 jam lalu",
    dibaca: true,
    aksen: "#34B3B9",
  },
  {
    id: 6,
    judul: "Segera Upload Rontgen",
    pesan:
      "Dewi Lestari (No. 009) keluar ruangan. Dokter merekomendasikan foto rontgen segera.",
    waktu: "3 menit lalu",
    dibaca: true,
    aksen: "#FF5C5C",
  },
];

export default function Notifikasi() {
  const insets = useSafeAreaInsets();
  const [baru, setBaru] = useState<Notif[]>(initialBaru);
  const [sebelumnya, setSebelumnya] = useState<Notif[]>(initialSebelumnya);

  const tandaiSemuaDibaca = () => {
    setBaru((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  const tandaiSatu = (id: number) => {
    setBaru((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)),
    );
  };

  const belumDibacaCount = baru.filter((n) => !n.dibaca).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          {belumDibacaCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{belumDibacaCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* ━━━━━ BARU ━━━━━ */}
        {baru.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>BARU</Text>
              <TouchableOpacity onPress={tandaiSemuaDibaca}>
                <Text style={styles.tandaiBtn}>Tandai dibaca</Text>
              </TouchableOpacity>
            </View>

            {baru.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={styles.card}
                onPress={() => tandaiSatu(notif.id)}
                activeOpacity={0.75}
              >
                {/* Strip aksen kiri */}
                <View
                  style={[styles.strip, { backgroundColor: notif.aksen }]}
                />

                <View style={styles.cardContent}>
                  <Text style={styles.cardJudul}>{notif.judul}</Text>
                  <Text style={styles.cardPesan}>{notif.pesan}</Text>
                  <Text style={styles.cardWaktu}>{notif.waktu}</Text>
                </View>

                {/* Dot belum dibaca */}
                {!notif.dibaca && <View style={styles.dot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ━━━━━ SEBELUMNYA ━━━━━ */}
        {sebelumnya.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>
              SEBELUMNYA
            </Text>

            {sebelumnya.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={styles.card}
                activeOpacity={0.75}
              >
                {/* Tidak ada strip untuk yang sudah dibaca */}
                <View
                  style={[styles.strip, { backgroundColor: "transparent" }]}
                />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardJudul, { color: "#555" }]}>
                    {notif.judul}
                  </Text>
                  <Text style={styles.cardPesan}>{notif.pesan}</Text>
                  <Text style={styles.cardWaktu}>{notif.waktu}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2F0F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  titleRow: { flexDirection: "row", gap: 8, right: 70, alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  countBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 1,
  },
  tandaiBtn: { fontSize: 13, color: "#34B3B9", fontWeight: "600" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  strip: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 4 },
  cardJudul: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  cardPesan: { fontSize: 12, color: "#666", lineHeight: 18 },
  cardWaktu: { fontSize: 11, color: "#aaa", marginTop: 2 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34B3B9",
    alignSelf: "flex-start",
    margin: 14,
    marginLeft: 0,
  },
});
