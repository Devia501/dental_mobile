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
import { galleryState } from "../../services/galleryState";

const { width } = Dimensions.get("window");
const COLUMN_GAP = 16;
const HORIZONTAL_PADDING = 24;
const COLUMN_WIDTH = (width - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

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
    galleryState.resolve(selected);
    router.back();
  };

  const filteredPhotos = photos; // search bisa dikembangkan nanti

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selected.includes(item.uri);
    return (
      <TouchableOpacity
        style={styles.imageCard}
        activeOpacity={0.85}
        onPress={() => toggleSelect(item.uri)}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.image}
          resizeMode="cover"
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.titleSmall}>View Your</Text>
        <Text style={styles.titleBig}>Recents</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search here..."
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="search-outline" size={18} color="#999" />
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>Image</Text>

        {/* Confirm Button */}
        {selected.length > 0 && (
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>
              Pilih {selected.length} Foto
            </Text>
          </TouchableOpacity>
        )}

        {/* Grid */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#34B3B9"
            style={{ marginTop: 60 }}
          />
        ) : (
          <FlatList
            data={filteredPhotos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /* Permission screen */
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2F0F1",
  },
  permissionText: {
    fontSize: 16,
    color: "#555",
    marginVertical: 16,
  },
  permissionBtn: {
    backgroundColor: "#34B3B9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  /* Header */
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },

  /* Title */
  titleSmall: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  titleBig: {
    fontSize: 30,
    fontWeight: "800",
    color: "#34B3B9",
    marginBottom: 20,
  },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 30,
    paddingHorizontal: 18,
    height: 46,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
  },

  /* Section label */
  sectionLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 14,
  },

  /* Confirm button */
  confirmBtn: {
    backgroundColor: "#34B3B9",
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 16,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  /* Grid */
  row: {
    justifyContent: "space-between",
    marginBottom: COLUMN_GAP,
  },
  imageCard: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.15,
    borderRadius: 18,
    backgroundColor: "#ECECEC",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },

  /* Selected state */
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(52,179,185,0.30)",
  },
  checkCircle: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#34B3B9",
    justifyContent: "center",
    alignItems: "center",
  },
});
