import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  scrollY: SharedValue<number>;
}

const PARALLAX_DISTANCE = 40;

export default function AppHeader({ scrollY }: Props) {
  const insets = useSafeAreaInsets();

  const containerStyle = useAnimatedStyle(() => {
    const paddingTop = interpolate(
      scrollY.value,
      [0, PARALLAX_DISTANCE],
      [insets.top + 16, insets.top + 8],
      "clamp",
    );
    const paddingBottom = interpolate(
      scrollY.value,
      [0, PARALLAX_DISTANCE],
      [16, 10],
      "clamp",
    );
    return { paddingTop, paddingBottom };
  });

  const logoStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, PARALLAX_DISTANCE],
      [45, 26],
      "clamp",
    );
    return { width: size, height: size };
  });

  const textStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, PARALLAX_DISTANCE],
      [18, 14],
      "clamp",
    );
    return { fontSize, fontWeight: "bold", color: "#fff" };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.left}>
        <Animated.Image
          source={require("../../assets/images/logo3.png")}
          style={logoStyle}
          resizeMode="contain"
        />
        <Animated.Text style={textStyle}>TentangDental</Animated.Text>
      </View>

      {/* ✅ Tombol notifikasi navigate ke halaman Notifikasi */}
      <TouchableOpacity
        style={styles.notifBtn}
        onPress={() => router.push("/(admin)/Notifikasi")}
        activeOpacity={0.75}
      >
        <Ionicons name="notifications" size={22} color="#fff" />
        <View style={styles.badge}>
          <Animated.Text style={styles.badgeText}>2</Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#66c4cb",
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});