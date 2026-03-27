import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getToken } from "../services/authService";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function cekToken() {
      const token = await getToken();
      setHasToken(!!token);
      setLoading(false);
    }
    cekToken();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2E9DA4" />
      </View>
    );
  }

  // Kalau sudah login → langsung ke beranda
  // Kalau belum → ke onboarding
  return (
    <Redirect href={hasToken ? "/(admin)/(tabs)/beranda" : "/onboarding"} />
  );
}
