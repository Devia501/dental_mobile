import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pendingPhotos } from "../../services/galleryState";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (permissionResponse?.granted) {
      loadPhotos();
    }
  }, [permissionResponse]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const fetched = await MediaLibrary.getAssetsAsync({
        first: 40,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      setPhotos(fetched.assets);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memuat galeri.");
    } finally {
      setLoading(false);
    }
  };

  if (!permissionResponse) {
    return <View style={styles.container} />;
  }

  if (!permissionResponse.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="images-outline" size={64} color="#34B3B9" />
        <Text style={styles.permissionText}>Izin galeri diperlukan</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Izinkan Galeri</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#888" }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleSelect = (uri: string) => {
    setSelected((prev) =>
      prev.includes(uri) ? prev.filter((u) => u !== uri) : [...prev, uri],
    );
  };

  const handleConfirm = () => {
    pendingPhotos.uris = selected;
    pendingPhotos.ready = true;
    router.back();
  };

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selected.includes(item.uri);
    return (
      <TouchableOpacity
        style={styles.imageCard}
        activeOpacity={0.8}
        onPress={() => toggleSelect(item.uri)}
      >
        <Image source={{ uri: item.uri }} style={styles.imageActual} />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Ionicons name="checkmark-circle" size={28} color="#34B3B9" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.titleSmall}>View Your</Text>
        <Text style={styles.titleBig}>Recents</Text>

        {/* Tombol Konfirmasi */}
        {selected.length > 0 && (
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>
              Pilih {selected.length} Foto
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search here..."
            placeholderTextColor="#888"
            style={styles.searchInput}
          />
          <Ionicons name="search-outline" size={18} color="#000" />
        </View>

        <Text style={styles.sectionLabel}>Image</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#34B3B9"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={photos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2F0F1",
  },
  permissionText: { fontSize: 16, color: "#555", marginVertical: 16 },
  permissionBtn: {
    backgroundColor: "#34B3B9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  permissionBtnText: { color: "#fff", fontWeight: "bold" },
  header: { paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: 20 },
  titleSmall: { fontSize: 18, fontWeight: "700", color: "#000" },
  titleBig: {
    fontSize: 32,
    fontWeight: "800",
    color: "#34B3B9",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAEAEA",
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 45,
    marginBottom: 30,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#000" },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 15,
  },
  row: { justifyContent: "space-between", marginBottom: 16 },
  imageCard: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.1,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
  },
  imageActual: { width: "100%", height: "100%" },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(52,179,185,0.25)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 8,
  },
  confirmBtn: {
    backgroundColor: "#34B3B9",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
