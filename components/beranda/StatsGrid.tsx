import { StyleSheet, Text, View } from "react-native";

const stats = [
  { angka: "6", label: "Hadir", warna: "#4747F7" },
  { angka: "2", label: "Rontgen", warna: "#E12C2C" },
  { angka: "1", label: "Selesai", warna: "#379354" },
  { angka: "1", label: "Di ruangan", warna: "#34B3B9" },
];

export default function StatsGrid() {
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
