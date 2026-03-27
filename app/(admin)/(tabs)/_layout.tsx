import { Tabs } from "expo-router";
import CustomTabBar from "../../../components/shared/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="beranda" />
      <Tabs.Screen name="pasien" />
      <Tabs.Screen name="rontgen" />
      <Tabs.Screen name="laporan" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
