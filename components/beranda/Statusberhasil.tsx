import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Image, Modal, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface Props {
  visible: boolean;
  title?: string; // default: "Status Berhasil Diperbarui!"
  subtitle?: string; // default: "Perubahan telah tersimpan ke sistem"
  onDone: () => void;
}

export default function StatusBerhasil({
  visible,
  title = "Status Berhasil Diperbarui!",
  subtitle = "Perubahan telah tersimpan ke sistem",
  onDone,
}: Props) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(24);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 11, stiffness: 110 });
      opacity.value = withTiming(1, { duration: 300 });
      textOpacity.value = withDelay(350, withTiming(1, { duration: 300 }));
      textY.value = withDelay(350, withSpring(0, { damping: 14 }));
      const timer = setTimeout(() => {
        onDone();
      }, 2200);
      return () => clearTimeout(timer);
    } else {
      scale.value = 0.5;
      opacity.value = 0;
      textOpacity.value = 0;
      textY.value = 24;
    }
  }, [visible]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="#6ABBBF" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.circleTopLeft} />
        <View style={styles.plusTopRight}>
          <Ionicons name="add" size={40} color="rgba(255,255,255,0.3)" />
        </View>
        <View style={styles.plusBottomLeft}>
          <Ionicons name="add" size={40} color="rgba(255,255,255,0.3)" />
        </View>
        <View style={styles.circleBottomRight} />

        {/* Icon */}
        <Animated.View style={[styles.iconWrapper, iconStyle]}>
          {/* Rename: icon_status_berhasil.png */}
          <Image
            source={require("../../assets/icons/icon_status_berhasil.png")}
            style={styles.checkIcon}
            resizeMode="contain"
          />
          <View style={styles.plusSmall}>
            <Ionicons name="add" size={20} color="rgba(255,255,255,0.5)" />
          </View>
        </Animated.View>

        {/* Teks — pakai prop title & subtitle */}
        <Animated.View style={[styles.textWrapper, textStyle]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6ABBBF",
    justifyContent: "center",
    alignItems: "center",
  },
  circleTopLeft: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  plusTopRight: { position: "absolute", top: 90, right: 30 },
  plusBottomLeft: { position: "absolute", bottom: 130, left: 30 },
  circleBottomRight: {
    position: "absolute",
    bottom: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  iconWrapper: { marginBottom: 36 },
  checkIcon: { width: 140, height: 140 },
  plusSmall: { position: "absolute", bottom: 0, right: -10 },
  textWrapper: { alignItems: "center", paddingHorizontal: 40 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
});
