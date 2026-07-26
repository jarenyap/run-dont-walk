import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface WarScoreboardCardProps {
  clan1Name: string;
  clan2Name: string;
  clan1Distance: number;
  clan2Distance: number;
  isClan1: boolean;
}

export default function WarScoreboardCard({
  clan1Name,
  clan2Name,
  clan1Distance,
  clan2Distance,
  isClan1,
}: WarScoreboardCardProps) {
  const total = clan1Distance + clan2Distance || 1; 
  const clan1Percent = (clan1Distance / total) * 100;
  const clan2Percent = (clan2Distance / total) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.identityRow}>
        <View style={styles.clanBlock}>
          <Text style={[styles.clanName, isClan1 ? { color: "#FF6B35" } : { color: "#0A84FF" }]}>
            {clan1Name}
          </Text>
          <Text style={isClan1 ? styles.distance : styles.opponentDistance}>
            {clan1Distance.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.clanBlock}>
          <Text style={[styles.clanName, isClan1 ? { color: "#0A84FF" } : { color: "#FF6B35" }]}>
            {clan2Name}
          </Text>
          <Text style={isClan1 ? styles.opponentDistance : styles.distance}>
            {clan2Distance.toFixed(1)} km
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${clan1Percent}%`,
              backgroundColor: isClan1 ? "#FF6B35" : "#0A84FF",
            },
          ]}
        />
        <View
          style={[
            styles.progressFill,
            {
              width: `${clan2Percent}%`,
              backgroundColor: isClan1 ? "#0A84FF" : "#FF6B35",
            },
          ]}
        />
        <View style={styles.halfwayMarker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF5F0",       
    borderRadius: 12,                    
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFD4C0",            
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clanBlock: { alignItems: "center", flex: 1 },
  clanName: { color: "#1A1A1A", fontSize: 15, fontWeight: "700" },
  distance: {
    color: "#FF6B35",                   
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  opponentName: { color: "#0A84FF", fontSize: 15, fontWeight: "700" },
  opponentDistance: {
    color: "#0A84FF",                    
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  vsBadge: {
    backgroundColor: "#E0E0DC",      
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vsText: { color: "#1A1A1A", fontSize: 13, fontWeight: "700" },
  progressBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#E0E0DC",
    position: "relative",
  },
  progressFill: { height: "100%" },
  halfwayMarker: {
    position: "absolute",
    left: "50%",
    width: 2,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
    transform: [{ translateX: -1 }],
  },
});
