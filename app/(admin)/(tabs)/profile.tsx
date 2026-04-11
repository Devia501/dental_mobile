import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Tambahkan ini untuk foto
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Alert,
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
import {
  changeEmail,
  changePassword,
  logout,
  updateProfileImage,
} from "../../../services/authService";

const { width } = Dimensions.get("window");

export default function Profile() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [modalType, setModalType] = useState<"email" | "password" | null>(null);

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

  useEffect(() => {
    const fetchUser = async () => {
      const userString = await SecureStore.getItemAsync("user");
      if (userString) setUserData(JSON.parse(userString));
    };
    fetchUser();
  }, []);

  // --- FUNGSI UPLOAD FOTO ---
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Izin Ditolak",
        "Aplikasi butuh akses galeri untuk mengubah foto.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      const selectedImage = result.assets[0].uri;

      try {
        const res = await updateProfileImage(selectedImage);

        if (res.success) {
          // Ambil URL dari server, jika server kirim default/null, pakai foto lokal tadi
          const serverUrl =
            res.data?.profile_image_url || res.data?.profile_image;
          const photoUrl =
            serverUrl && !serverUrl.includes(".svg")
              ? serverUrl
              : selectedImage;

          const updatedUser = { ...userData, avatar: photoUrl };
          setUserData(updatedUser as any);

          // SIMPAN KE STORAGE: Ini kunci agar tidak hilang saat buka tutup aplikasi
          await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));

          Alert.alert("Sukses", "Foto profil berhasil diperbarui!");
        }
      } catch (error) {
        console.log("Upload error:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.log("error logout:", error);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailData.current || !emailData.new) {
      Alert.alert("Peringatan", "Isi password saat ini dan email baru.");
      return;
    }
    try {
      // Menggunakan changeEmail sesuai permintaanmu
      const res = await changeEmail(emailData.current, emailData.new);
      if (res.success) {
        const updatedUser = { ...userData, email: emailData.new };
        setUserData(updatedUser as any);
        await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
        Alert.alert("Sukses", "Email berhasil diubah melalui changeEmail");
        setModalType(null);
      } else {
        Alert.alert("Gagal", res.message || "Gagal update email");
      }
    } catch (error) {
      Alert.alert("Error", "Koneksi gagal");
    }
  };

  const handleUpdatePassword = async () => {
    try {
      const res = await changePassword(
        passwordData.current,
        passwordData.new,
        passwordData.confirm,
      );
      if (res.success) {
        Alert.alert("Sukses", "Password berhasil diubah");
        setModalType(null);
      } else {
        Alert.alert("Gagal", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Koneksi gagal");
    }
  };

  const renderModalContent = () => {
    if (modalType === "email") {
      return (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Email</Text>
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Verify password"
            onChangeText={(txt) => setEmailData({ ...emailData, current: txt })}
          />
          <Text style={styles.inputLabel}>New Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new email"
            onChangeText={(txt) => setEmailData({ ...emailData, new: txt })}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpdateEmail}
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
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            onChangeText={(txt) =>
              setPasswordData({ ...passwordData, current: txt })
            }
          />
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            onChangeText={(txt) =>
              setPasswordData({ ...passwordData, new: txt })
            }
          />
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            onChangeText={(txt) =>
              setPasswordData({ ...passwordData, confirm: txt })
            }
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpdatePassword}
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

      <AppHeader scrollY={scrollY} />
      <View style={styles.topSection} />

      <View style={styles.avatarContainer} pointerEvents="box-none">
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {userData?.avatar ? (
              <Image
                // Tambahkan ?timestamp agar URL selalu dianggap baru oleh React Native
                source={{ uri: `${userData.avatar}?t=${new Date().getTime()}` }}
                style={{ width: 110, height: 110, borderRadius: 60 }}
              />
            ) : (
              <Ionicons name="person" size={60} color="#ffffff" />
            )}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handlePickImage}>
            <Image
              source={require("../../../assets/icons/Pencil.png")}
              style={styles.pencilIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient colors={["#E2F0F1", "#E2F0F1"]} style={styles.card}>
        <View style={{ paddingTop: 60 }}>
          <Text style={styles.nama}>{userData?.name || "Admin"}</Text>
          <Text style={styles.email}>
            {userData?.email || "email@dentalclinic.id"}
          </Text>

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
    overflow: "hidden",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
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
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
