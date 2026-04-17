import { LinearGradient } from "expo-linear-gradient";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

interface Props {
  namaAdmin?: string;
  totalRontgen?: number;
}

export default function CardSelamatDatang({
  namaAdmin = "Admin Klinik",
  totalRontgen = 0,
}: Props) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["#4AC6CC", "#95e7ec"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.1, y: 0 }}
        style={styles.gradient}
      >
        <ImageBackground
          source={require("../../assets/images/Ellipse7.png")}
          style={styles.icon2}
        />
        <Text style={styles.label}>SELAMAT DATANG</Text>
        <Text style={styles.nama}>{namaAdmin}</Text>
        <Text style={styles.tanggal}>{today}</Text>

        <View style={styles.rontgenRow}>
          <Image
            source={require("../../assets/images/Tooth.png")}
            style={styles.icon}
          />
          <Text style={styles.rontgenText}>Total rontgen bulan ini</Text>
          <Text style={styles.rontgenAngka}>{totalRontgen}</Text>
        </View>
        <ImageBackground
          source={require("../../assets/images/Ellipse8.png")}
          style={styles.icon1}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 40,
    overflow: "hidden",
    height: 190,
  },

  gradient: {
    padding: 20,
  },

  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 6,
  },

  nama: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },

  tanggal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 18,
  },

  rontgenRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },

  icon: {
    width: 16,
    height: 16,
  },
  icon1: {
    width: 60,
    height: 55,
    left: 220,
    top: 6,
  },
  icon2: {
    width: 85,
    height: 65,
    left: 230,
    bottom: 25,
    marginBottom: -60,
  },

  rontgenText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
  },

  rontgenAngka: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
