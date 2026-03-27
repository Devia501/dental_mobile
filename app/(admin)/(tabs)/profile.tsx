import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../../components/shared/AppHeader";
import { logout } from "../../../services/authService";

const { width } = Dimensions.get("window");

export default function Profile() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0); // dummy — profile tidak scroll header

  // State untuk mengontrol Modal
  const [modalType, setModalType] = useState<"email" | "password" | null>(null);

  // State untuk Input
  const [emailData, setEmailData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("error logout:", error);
    } finally {
      router.replace("/login");
    }
  };

  const renderModalContent = () => {
    if (modalType === "email") {
      return (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Email</Text>

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value="sitiazizah620@gmail.com"
            editable={false}
          />

          <Text style={styles.inputLabel}>New Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new email"
            onChangeText={(txt) => setEmailData({ ...emailData, new: txt })}
          />

          <Text style={styles.inputLabel}>Confirm Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new email"
            onChangeText={(txt) => setEmailData({ ...emailData, confirm: txt })}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setModalType(null)}
          >
            <Text style={styles.submitBtnText}>Change Email</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (modalType === "password") {
      return (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Password</Text>

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
          />

          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
          />

          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setModalType(null)}
          >
            <Text style={styles.submitBtnText}>Save Password</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalType(null)}
        >
          <View onStartShouldSetResponder={() => true}>
            {renderModalContent()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ✅ AppHeader menggantikan header manual */}
      <AppHeader scrollY={scrollY} />

      <View style={styles.topSection} />

      <View style={styles.avatarContainer} pointerEvents="box-none">
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#ffffff" />
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Image
              source={require("../../../assets/icons/Pencil.png")}
              style={styles.pencilIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient colors={["#E2F0F1", "#E2F0F1"]} style={styles.card}>
        <View style={{ paddingTop: 60 }}>
          <Text style={styles.nama}>Admin Budi</Text>
          <Text style={styles.email}>budi.santoso@dentalclinic.id</Text>

          <Text style={styles.pengaturanLabel}>Pengaturan Akun</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setModalType("password")}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrapper}>
                <Image source={require("../../../assets/icons/Gembok.png")} />
              </View>
              <Text style={styles.menuText}>Change Password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setModalType("email")}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrapper}>
                <Image source={require("../../../assets/icons/Mail.png")} />
              </View>
              <Text style={styles.menuText}>Change Email</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../../assets/icons/Container.png")}
              style={{ width: 20, height: 20 }}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#66c4cb" },
  topSection: { height: 140 },
  avatarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    bottom: 0,
    justifyContent: "flex-end",
  },
  avatarWrapper: { position: "relative", marginBottom: 500 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#d3d1d1",
  },
  editBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ffffff",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pencilIcon: { width: 18, height: 18 },
  card: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
  },
  nama: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 4,
  },
  email: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 28 },
  pengaturanLabel: {
    fontSize: 13,
    color: "#828181",
    fontWeight: "600",
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: "#E2F0F1",
    borderRadius: 14,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#fff",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#34b2b980",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34B3B9",
    marginHorizontal: 48,
    marginTop: 60,
    borderRadius: 30,
    paddingVertical: 8,
    gap: 12,
  },
  logoutText: { fontSize: 14, fontWeight: "bold", color: "#fff", right: 6 },

  // ✅ Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)", // Efek blur/gelap di belakang
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: width * 0.85,
    backgroundColor: "#E2F0F1",
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  inputLabel: {
    alignSelf: "flex-start",
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fff",
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: "#34B3B9",
    width: "100%",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
