import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const TAB_COUNT = 6;
const TAB_W = SCREEN_W / TAB_COUNT;

const CIRCLE_D = 46;
const CIRCLE_R = CIRCLE_D / 2;
const CIRCLE_RISE = 8;

const WAVE_HW = 34;
const WAVE_DEPTH = 48;
const CURVE_EXT = 12;

const TOP_SPACE = CIRCLE_RISE + CIRCLE_R;
const BAR_Y = -1;
const BAR_H = 50;
const SVG_H = BAR_Y + BAR_H;

const SPRING = { damping: 20, stiffness: 200, mass: 0.6 };

const TEAL = "#6CC4CB";
const PAGE_BG = "#E2F0F1";

const TABS = [
  {
    key: "beranda",
    icon: require("../../assets/icons/home.png"),
    iconActive: require("../../assets/icons/home.png"),
  },
  {
    key: "pasien",
    icon: require("../../assets/icons/pasien.png"),
    iconActive: require("../../assets/icons/pasien.png"),
  },
  {
    key: "rontgen",
    icon: require("../../assets/icons/rontgen.png"),
    iconActive: require("../../assets/icons/rontgen.png"),
  },
  {
    key: "laporan",
    icon: require("../../assets/icons/laporan.png"),
    iconActive: require("../../assets/icons/laporan.png"),
  },
  {
    key: "artikel",
    icon: require("../../assets/icons/laporan.png"),
    iconActive: require("../../assets/icons/laporan.png"),
  },
  {
    key: "profile",
    icon: require("../../assets/icons/profile.png"),
    iconActive: require("../../assets/icons/profile.png"),
  },
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Path bar teal kotak penuh
function buildBar(): string {
  "worklet";
  return [
    `M 0 ${BAR_Y}`,
    `L ${SCREEN_W} ${BAR_Y}`,
    `L ${SCREEN_W} ${BAR_Y + BAR_H}`,
    `L 0 ${BAR_Y + BAR_H}`,
    `Z`,
  ].join(" ");
}

// Path wave (lubang) — arah berlawanan agar evenodd rule memotong bar
function buildWave(cx: number): string {
  "worklet";
  const hw = WAVE_HW;
  const ext = CURVE_EXT;
  const top = BAR_Y;
  const bot = top + WAVE_DEPTH;
  const w = SCREEN_W;
  const oL = cx - hw - ext;
  const iL = cx - hw;
  const iR = cx + hw;
  const oR = cx + hw + ext;
  return [
    `M 0 0`,
    `L 0 ${top}`,
    `L ${oL} ${top}`,
    `Q ${iL} ${top}, ${iL} ${top + 14}`,
    `Q ${iL} ${bot - 12}, ${cx} ${bot}`,
    `Q ${iR} ${bot - 12}, ${iR} ${top + 14}`,
    `Q ${iR} ${top}, ${oR} ${top}`,
    `L ${w} ${top}`,
    `L ${w} 0`,
    `Z`,
  ].join(" ");
}

interface Props {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();

  // ✅ FIX 1: Clamp index agar tidak crash kalau ada halaman non-tab (upload-foto dll)
  const safeIndex = Math.min(Math.max(state.index, 0), TABS.length - 1);
  const progress = useSharedValue(safeIndex);

  useEffect(() => {
    // ✅ FIX 2: Hanya animasi kalau index valid
    if (state.index < TABS.length) {
      progress.value = withSpring(state.index, SPRING);
    }
  }, [state.index]);

  const barWithHoleProps = useAnimatedProps(() => {
    const cx = progress.value * TAB_W + TAB_W / 2;
    // Gabungkan path bar kotak + path wave — evenodd akan buat wave jadi lubang
    return { d: buildBar() + " " + buildWave(cx) };
  });

  const waveProps = useAnimatedProps(() => {
    const cx = progress.value * TAB_W + TAB_W / 2;
    return { d: buildWave(cx) };
  });

  const circlePos = useAnimatedStyle(() => {
    const cx = progress.value * TAB_W + TAB_W / 2;
    return {
      left: cx - CIRCLE_R,
      top: BAR_Y - CIRCLE_R - CIRCLE_RISE + CIRCLE_R,
    };
  });

  const circleScale = useAnimatedStyle(() => {
    const frac = Math.abs(progress.value - Math.round(progress.value));
    const s = interpolate(frac, [0, 0.5], [1, 0.88], "clamp");
    return { transform: [{ scale: s }] };
  });

  const bottomSafePad = Math.max(insets.bottom, 16);

  // ✅ FIX 3: Gunakan safeIndex bukan state.index langsung
  const activeTab = TABS[safeIndex];

  return (
    <View style={styles.outerWrapper}>
      <View
        style={[
          styles.bottomSolid,
          { height: bottomSafePad, backgroundColor: TEAL },
        ]}
      />

      <View style={[styles.svgArea, { marginBottom: bottomSafePad }]}>
        <Svg width={SCREEN_W} height={SVG_H}>
          <AnimatedPath animatedProps={barWithHoleProps} fill={TEAL} fillRule="evenodd" />
        </Svg>

        {/* ✅ Guard: hanya render kalau activeTab ada */}
        {activeTab && (
          <Animated.View style={[styles.circleOuter, circlePos]}>
            <Animated.View style={[styles.circleInner, circleScale]}>
              <Image source={activeTab.iconActive} style={styles.iconActive} />
            </Animated.View>
          </Animated.View>
        )}

        <View style={styles.tabRow}>
          {state.routes.map((route: any, idx: number) => {
            // ✅ Skip route yang bukan tab (upload-foto dll)
            if (!TABS[idx]) return null;
            return (
              <TabIcon
                key={route.key}
                tab={TABS[idx]}
                index={idx}
                progress={progress}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (state.index !== idx && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabIcon({
  tab,
  index,
  progress,
  onPress,
}: {
  tab: (typeof TABS)[number];
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const anim = useAnimatedStyle(() => {
    const dist = Math.abs(progress.value - index);
    return {
      opacity: interpolate(dist, [0, 0.45], [0, 1], "clamp"),
      transform: [
        { translateY: interpolate(dist, [0, 0.45], [6, 0], "clamp") },
      ],
    };
  });

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Animated.View style={anim}>
        <Image source={tab.icon} style={styles.iconInactive} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },
  svgArea: { width: SCREEN_W, height: SVG_H },
  bottomSolid: { position: "absolute", bottom: 0, left: 0, right: 0 },
  tabRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    height: BAR_H,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  circleOuter: {
    position: "absolute",
    width: CIRCLE_D,
    height: CIRCLE_D,
    zIndex: 20,
  },
  circleInner: {
    width: CIRCLE_D,
    height: CIRCLE_D,
    borderRadius: CIRCLE_R,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#faf6f6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: { elevation: 8 },
    }),
  },
  iconInactive: { width: 26, height: 26, tintColor: "#fff" },
  iconActive: { width: 28, height: 28, tintColor: "#000000" },
});