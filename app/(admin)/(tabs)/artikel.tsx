import { Ionicons } from "@expo/vector-icons";
import { useSharedValue } from "react-native-reanimated";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../../components/shared/AppHeader";
import { useUnreadNotif } from "../../../hooks/useUnreadNotif";

// ── Tipe data dari External API ────────────────────────────────────────────
interface ArtikelItem {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: {
    likes: number;
    dislikes: number;
  };
}

// ── Komponen Card Artikel ──────────────────────────────────────────────────
function ArtikelCard({ item }: { item: ArtikelItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      {/* Icon + Judul */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="newspaper-outline" size={20} color="#34B3B9" />
        </View>
        <Text style={styles.cardTitle} numberOfLines={expanded ? 0 : 2}>
          {item.title}
        </Text>
      </View>

      {/* Isi Artikel */}
      <Text style={styles.cardBody} numberOfLines={expanded ? 0 : 3}>
        {item.body}
      </Text>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {item.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tagBadge}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.reactionsRow}>
          <Ionicons name="thumbs-up-outline" size={13} color="#34B3B9" />
          <Text style={styles.reactionText}>{item.reactions.likes}</Text>
          <Ionicons
            name="thumbs-down-outline"
            size={13}
            color="#888"
            style={{ marginLeft: 10 }}
          />
          <Text style={styles.reactionText}>{item.reactions.dislikes}</Text>
        </View>
        <Text style={styles.readMore}>
          {expanded ? "Tutup ↑" : "Baca selengkapnya ↓"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen Utama ───────────────────────────────────────────────────────────
export default function ArtikelScreen() {
  const scrollY = useSharedValue(0);
  const unreadCount = useUnreadNotif();

  const [data, setData] = useState<ArtikelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ✅ Fetch dari External API — dummyjson.com (gratis, tanpa API key)
  const fetchArtikel = async () => {
    try {
      const res = await fetch("https://dummyjson.com/posts?limit=15&skip=0");
      const json = await res.json();
      setData(json.posts);
      setError("");
    } catch {
      setError("Gagal memuat artikel. Periksa koneksi internet.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArtikel();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchArtikel();
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader scrollY={scrollY} unreadCount={unreadCount} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#34B3B9" />
          <Text style={styles.loadingText}>Mengambil artikel dari internet...</Text>
        </View>
      </View>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader scrollY={scrollY} unreadCount={unreadCount} />
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchArtikel(); }}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Konten ──
  return (
    <View style={styles.container}>
      <AppHeader scrollY={scrollY} unreadCount={unreadCount} />

      {/* Banner Info External API */}
      <View style={styles.apiBanner}>
        <Ionicons name="globe-outline" size={14} color="#34B3B9" />
        <Text style={styles.apiBannerText}>
          Data diambil dari External API: dummyjson.com
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#34B3B9"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>🦷 Artikel Kesehatan Gigi</Text>
            <Text style={styles.listHeaderSub}>
              {data.length} artikel tersedia • Tarik ke bawah untuk refresh
            </Text>
          </View>
        }
        renderItem={({ item }) => <ArtikelCard item={item} />}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E2F0F1",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#34B3B9",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  apiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#C0EAE3",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  apiBannerText: {
    fontSize: 11,
    color: "#2E9DA4",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listHeader: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  listHeaderSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52,179,185,0.15)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E2F0F1",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a1a1a",
    textTransform: "capitalize",
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tagBadge: {
    backgroundColor: "#E2F0F1",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(52,179,185,0.3)",
  },
  tagText: {
    color: "#34B3B9",
    fontSize: 11,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  reactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reactionText: {
    fontSize: 12,
    color: "#888",
  },
  readMore: {
    fontSize: 12,
    color: "#34B3B9",
    fontWeight: "600",
  },
});
