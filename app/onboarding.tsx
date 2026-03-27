import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Onboarding() {
  return (
    <LinearGradient colors={["#E2F0F1", "#6ABBBF"]} style={styles.container}>
      <View style={styles.logoRow}>
        <Image
          source={require("../assets/images/logo4.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.logoTextBold}>tentang</Text>
          <Text style={styles.logoTextLight}>dental</Text>
        </View>
      </View>

      <View style={styles.fotoWrapper}>
        <Image
          source={require("../assets/decorations/bintang.png")}
          style={styles.bintang}
          resizeMode="contain"
        />

        <View style={styles.fotoKecilWrapper1}>
          <Image
            source={require("../assets/images/foto-kecil1.png")}
            style={styles.fotoKecil}
            resizeMode="cover"
          />
        </View>

        <View style={styles.fotoBesarWrapper}>
          <Image
            source={require("../assets/images/foto-besar.png")}
            style={styles.fotoBesar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.fotoKecilWrapper}>
          <Image
            source={require("../assets/images/foto-kecil.png")}
            style={styles.fotoKecil}
            resizeMode="cover"
          />
        </View>

        <Image
          source={require("../assets/decorations/lengkung.png")}
          style={styles.lengkung}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textWrapper}>
        <Text style={styles.title}>Perfect Dental Clinic</Text>
        <Text style={styles.subtitle}>
          Praktek Dokter Gigi Spesialis Konvervasi
        </Text>
      </View>

      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={() => router.push("/login")}
      >
        <BlurView intensity={40} tint="light" style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </BlurView>
      </TouchableOpacity>

      <View style={styles.signinRow}>
        <Text style={styles.signinText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={styles.signinLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 110,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoTextBold: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#804036",
  },
  logoTextLight: {
    fontSize: 14,
    color: "#A66C64",
    letterSpacing: 2,
  },
  fotoWrapper: {
    width: width,
    height: 280,
    position: "relative",
    alignItems: "center",
    marginBottom: 32,
  },
  fotoBesarWrapper: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: "hidden",
    position: "absolute",
    top: 20,
    left: width * 0.2,
    borderWidth: 1,
    borderColor: "#fff",
  },
  fotoBesar: {
    width: "100%",
    height: "100%",
  },

  fotoKecilWrapper1: {
    width: 80,
    height: 80,
    borderRadius: 65,
    overflow: "hidden",
    position: "absolute",
    bottom: 200,
    left: width * 0.2,
    borderWidth: 1,
    borderColor: "#fff",
    zIndex: 8,
  },

  fotoKecilWrapper: {
    width: 100,
    height: 100,
    borderRadius: 65,
    overflow: "hidden",
    position: "absolute",
    bottom: 20,
    right: width * 0.12,
    borderWidth: 1,
    borderColor: "#fff",
  },
  fotoKecil: {
    width: "100%",
    height: "100%",
  },
  bintang: {
    width: 40,
    height: 40,
    position: "absolute",
    top: -22,
    left: width * 0.14,
    zIndex: 10,
  },
  lengkung: {
    width: 50,
    height: 50,
    position: "absolute",
    bottom: 10,
    right: width * 0.3,
    zIndex: 10,
  },

  buttonWrapper: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },

  textWrapper: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 18,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#000000c2",
    textAlign: "center",
  },
  button: {
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#6abbbf",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  signinRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  signinText: {
    fontSize: 10,
    color: "#000000",
  },
  signinLink: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "400",
  },
});
