import { StyleSheet, Text, View } from "react-native";

interface Props {
  hadir?: number;
  rontgen?: number;
  selesai?: number;
  diRuangan?: number;
}

export default function StatsGrid({
  hadir = 0,
  rontgen = 0,
  selesai = 0,
  diRuangan = 0,
}: Props) {
  const stats = [
    { angka: String(hadir), label: "Hadir", warna: "#4747F7" },
    { angka: String(rontgen), label: "Rontgen", warna: "#E12C2C" },
    { angka: String(selesai), label: "Selesai", warna: "#379354" },
    { angka: String(diRuangan), label: "Di ruangan", warna: "#34B3B9" },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={[styles.angka, { color: item.warna }]}>
            {item.angka}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 25,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    width: "47%",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 2,
    shadowRadius: 5,
  },
  angka: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
    left: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
    left: 8,
  },
});
