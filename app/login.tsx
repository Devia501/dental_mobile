import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { login } from "../services/authService";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email dan password wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.success && data.data?.token) {
        router.replace("/(admin)/(tabs)/beranda");
      } else {
        alert(data.message || "Email atau password salah!");
      }
    } catch (error) {
      alert("Gagal konek ke server!");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/foto-login.png")}
        style={styles.fotoBg}
        resizeMode="cover"
      />

      <LinearGradient colors={["#E2F0F1", "#6ABBBF"]} style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to enjoy the dental experience
          </Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#8a8686"
              style={styles.inputIcon}
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="email@gmail.com"
              placeholderTextColor="#8a8686"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#8a8686"
              style={styles.inputIcon}
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor="#8a8686"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#8a8686"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxActive]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgetText}>Forget Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : "Log In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E2F0F1",
  },
  fotoBg: {
    width: width,
    height: height * 0.38,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: "#656363",
    textAlign: "center",
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    color: "#303030",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.0)",
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#fff",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#8a8686",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#8a8686",
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#464646",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#2E9DA4",
    borderColor: "#6ABBBF",
  },
  rememberText: {
    fontSize: 12,
    color: "#222121",
  },
  forgetText: {
    fontSize: 12,
    color: "#6ABBBF",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#E2F0F1",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 38,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 12,
    color: "#363434",
  },
  signupLink: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "400",
  },
});
