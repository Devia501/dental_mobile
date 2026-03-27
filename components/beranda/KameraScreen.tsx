import { Ionicons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

// 1. Ukuran Bingkai Corners Putih
const FRAME_W = W * 0.82;
const FRAME_H = FRAME_W * 1.35;

// 2. Ukuran Lubang Masking (Putih Pekat & Berjarak)
const MASK_W = FRAME_W + 30;
const MASK_H = FRAME_H + 30;

const TOP_GAP = (H - MASK_H) / 2;
const LEFT_GAP = (W - MASK_W) / 2;

interface Props {
  onCapture: (uri: string) => void;
  onClose: () => void;
  sectionColor?: string;
}

export default function KameraScreen({
  onCapture,
  onClose,
  sectionColor = "#76C0C4",
}: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#34B3B9" />
        <Text style={styles.permissionText}>Izin kamera diperlukan</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
    if (photo?.uri) onCapture(photo.uri);
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* Masking Putih Pekat */}
      <View style={styles.maskOverlay} pointerEvents="none">
        <View
          style={[
            styles.maskPart,
            { top: 0, left: 0, right: 0, height: TOP_GAP },
          ]}
        />
        <View
          style={[
            styles.maskPart,
            { bottom: 0, left: 0, right: 0, height: TOP_GAP },
          ]}
        />
        <View
          style={[
            styles.maskPart,
            { top: TOP_GAP, bottom: TOP_GAP, left: 0, width: LEFT_GAP },
          ]}
        />
        <View
          style={[
            styles.maskPart,
            { top: TOP_GAP, bottom: TOP_GAP, right: 0, width: LEFT_GAP },
          ]}
        />
      </View>

      {/* Bingkai Corners */}
      <View style={styles.frameWrapper} pointerEvents="none">
        <View style={[styles.frame, { width: FRAME_W, height: FRAME_H }]}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Top Bar (Sama seperti sebelumnya) */}
      <View style={[styles.topContainer, { top: insets.top + 20 }]}>
        <View style={styles.topBarWrapper}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
          >
            <Ionicons
              name="flash"
              size={20}
              color={flash === "on" ? "#FFD60A" : "#888"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn}>
            <Ionicons name="grid" size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn}>
            <Ionicons name="document-text" size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <Text style={styles.topBtnText}>
              {facing === "back" ? "M" : "F"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Bottom Bar Diubah agar lebih kotak (Rounded Rectangle) */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom + 24 }]}>
        <View
          style={[styles.bottomBarWrapper, { backgroundColor: sectionColor }]}
        >
          <TouchableOpacity style={styles.bottomRectBtn} onPress={onClose}>
            <Text style={styles.bottomBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomIconBtn}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Shutter tetap bulat agar ikonik */}
          <TouchableOpacity style={styles.shutterOuter} onPress={handleCapture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomIconBtn}
            onPress={handleGallery}
          >
            <Ionicons name="image" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomRectBtn} onPress={onClose}>
            <Text style={styles.bottomBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2F0F1",
  },
  permissionText: { fontSize: 16, color: "#555" },
  permissionBtn: {
    backgroundColor: "#34B3B9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  permissionBtnText: { color: "#fff", fontWeight: "bold" },

  maskOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  maskPart: { position: "absolute", backgroundColor: "#FFFFFF" },

  frameWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  frame: { position: "relative" },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#fff",
    zIndex: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },

  // Top Bar Styles
  topContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  topBarWrapper: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: 18,
    padding: 6,
    width: "88%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#b1b1b196",
    justifyContent: "center",
    alignItems: "center",
  },
  topBtnText: { color: "#1a1a1a", fontWeight: "bold", fontSize: 15 },

  // ✅ Perbaikan Bottom Bar agar Senada dengan Atas
  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  bottomBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    padding: 8,
    borderRadius: 36, // Senada dengan topBarWrapper
  },
  bottomRectBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20, // Kotak tumpul (rounded rectangle)
    minWidth: 60,
    alignItems: "center",
  },
  bottomIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },

  shutterOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: "85%",
    height: "85%",
    borderRadius: 28,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
});
