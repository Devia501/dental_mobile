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
import { register } from "../services/authService";

const { width, height } = Dimensions.get("window");

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const handleRegister = async () => {
    if (!agree) {
      alert("Harap setujui Term & Condition!");
      return;
    }
    if (password !== confirmPassword) {
      alert("Password tidak sama!");
      return;
    }
    if (!name || !email || !password) {
      alert("Semua field wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const data = await register(name, email, password, confirmPassword);

      if (data.token) {
        router.replace("/(admin)/(tabs)/beranda");
      } else {
        alert(data.message || "Register gagal!");
      }
    } catch (error) {
      alert("Gagal konek ke server!");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/foto-login1.png")}
        style={styles.fotoBg}
        resizeMode="cover"
      />

      <LinearGradient colors={["#E2F0F1", "#6ABBBF"]} style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>
            Create New Account For Manage Klinik
          </Text>

          {/* Input Name */}
          <Text style={styles.label}>Nama</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#8a8686"
              style={styles.inputIcon}
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Nama lengkap"
              placeholderTextColor="#8a8686"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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

          <Text style={styles.label}>Confirm Password</Text>
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
              placeholder="confirm password"
              placeholderTextColor="#8a8686"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirm ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#8a8686"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgree(!agree)}
          >
            <View style={[styles.checkbox, agree && styles.checkboxActive]}>
              {agree && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.agreeText}>
              I Agree to the{" "}
              <Text style={styles.agreeLink}>Term & Condition</Text> and{" "}
              <Text style={styles.agreeLink}>Privacy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.signinLink}>Sign in</Text>
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
    height: height * 0.32,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -120,
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
  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#464646",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#2E9DA4",
    borderColor: "#6ABBBF",
  },
  agreeText: {
    fontSize: 12,
    color: "#222121",
    flex: 1,
  },
  agreeLink: {
    color: "#2E9DA4",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#E2F0F1",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
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
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signinText: {
    fontSize: 12,
    color: "#363434",
  },
  signinLink: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "400",
  },
});
