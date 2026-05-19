import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "../../services/api";

type Notif = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

const getAksen = (type: string) => {
  switch (type) {
    case "xray_uploaded":
      return "#34B3B9";
    case "patient_status_updated":
      return "#7B8DE8";
    default:
      return "#34B3B9";
  }
};

const formatWaktu = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.floor(diffHours / 24)} hari lalu`;
};

export default function Notifikasi() {
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchNotifs();
    }, []),
  );

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/admin/notifications", "GET", null, true);
      if (res.success) setNotifs(res.data || []);
    } catch (e) {
      console.log("Error fetch notifs:", e);
    } finally {
      setLoading(false);
    }
  };

  const tandaiSatu = async (id: number) => {
    try {
      await apiRequest(`/admin/notifications/${id}/read`, "PUT", null, true);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (e) {}
  };

  const tandaiSemua = async () => {
    try {
      await apiRequest("/admin/notifications/read-all", "PUT", null, true);
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const baru = notifs.filter((n) => !n.is_read);
  const sebelumnya = notifs.filter((n) => n.is_read);
  const belumDibacaCount = baru.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#34B3B9"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
        >
          {baru.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>BARU</Text>
                <TouchableOpacity onPress={tandaiSemua}>
                  <Text style={styles.tandaiBtn}>Tandai semua dibaca</Text>
                </TouchableOpacity>
              </View>
              {baru.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={styles.card}
                  onPress={() => tandaiSatu(notif.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.strip,
                      { backgroundColor: getAksen(notif.type) },
                    ]}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardJudul}>{notif.title}</Text>
                    <Text style={styles.cardPesan}>{notif.message}</Text>
                    <Text style={styles.cardWaktu}>
                      {formatWaktu(notif.created_at)}
                    </Text>
                  </View>
                  <View style={styles.dot} />
                </TouchableOpacity>
              ))}
            </View>
          )}

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
                  <View
                    style={[styles.strip, { backgroundColor: "transparent" }]}
                  />
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardJudul, { color: "#555" }]}>
                      {notif.title}
                    </Text>
                    <Text style={styles.cardPesan}>{notif.message}</Text>
                    <Text style={styles.cardWaktu}>
                      {formatWaktu(notif.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {notifs.length === 0 && (
            <Text style={{ textAlign: "center", color: "#aaa", marginTop: 40 }}>
              Tidak ada notifikasi
            </Text>
          )}
        </ScrollView>
      )}
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
