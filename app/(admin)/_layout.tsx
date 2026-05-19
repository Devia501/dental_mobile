import { Stack } from "expo-router";
import { Platform, StatusBar } from "react-native";

export default function AdminLayout() {
  return (
    <>
      {Platform.OS === "android" && (
        <StatusBar backgroundColor="#6CC4CB" barStyle="light-content" />
      )}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Semua tab dalam satu screen */}
        <Stack.Screen name="(tabs)" />

        {/* Halaman tanpa tab bar */}
        <Stack.Screen name="Uploadfotopasien " />

        {/* Tambahkan halaman baru di sini sesuai nama filenya */}
        <Stack.Screen name="Lembarpemeriksaangigi" />
      </Stack>
    </>
  );
}
