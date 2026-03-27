import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import CardSelamatDatang from "../../../components/beranda/CardSelamatDatang";
import PasienHadirList from "../../../components/beranda/PasienHadirList";
import StatsGrid from "../../../components/beranda/StatsGrid";
import AppHeader from "../../../components/shared/AppHeader";

const HEADER_HEIGHT = 100;
const PARALLAX_DISTANCE = 1;

export default function Beranda() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, PARALLAX_DISTANCE],
      [0, -PARALLAX_DISTANCE],
      "clamp",
    );
    return { transform: [{ translateY }] };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerWrapper, headerStyle]}>
        <AppHeader scrollY={scrollY} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT,
          paddingBottom: 100,
        }}
      >
        <CardSelamatDatang />
        <StatsGrid />

        <View style={styles.tips}>
          <Image
            source={require("../../../assets/images/Light.png")}
            style={styles.icon}
          />
          <Text style={styles.tipsText}>
            Tap kartu pasien untuk mengubah status atau upload rontgen.
          </Text>
        </View>

        <PasienHadirList />

        <View style={{ height: 32 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E2F0F1",
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tips: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C0EAE3",
    marginHorizontal: "14%",
    marginTop: 25,
    borderRadius: 20,
    padding: 8,
    gap: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: "#2E9DA4",
    lineHeight: 18,
  },
});
