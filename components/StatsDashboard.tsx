import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";  
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryPie} from "victory-native";
import { Run } from "../types";
import { aggregateDistance, aggregateRunTypes } from "../services/statsService";

interface StatsDashboardItems {
    runs: Run[];
}

export default function StatsDashboard({ runs }: StatsDashboardItems) {
    const windowWidth = Dimensions.get("window").width;
    const [distanceTimePeriod, setDistanceTimePeriod] = useState<"weekly" | "monthly">("weekly");
    const [runTypeTimePeriod, setRunTypeTimePeriod] = useState<"weekly" | "monthly">("weekly");
    const distance = useMemo(() => aggregateDistance(runs, distanceTimePeriod), [runs, distanceTimePeriod]);
    const { runType, totalRuns } = useMemo(() => aggregateRunTypes(runs, runTypeTimePeriod), [runs, runTypeTimePeriod]);
        
    return (
        <View style={styles.container}>

            <View style={styles.chartCard}>
                <View style={styles.header}>
                    <Text style={styles.chartTitle}>Distance Over Time (km)</Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity onPress={() => setDistanceTimePeriod("weekly")} style={[styles.toggleBtn, distanceTimePeriod === "weekly" && styles.toggleActive]}>
                            <Text style={distanceTimePeriod === "weekly" ? styles.toggleActiveText : styles.toggleText}>Weekly 🔽</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDistanceTimePeriod("monthly")} style={[styles.toggleBtn, distanceTimePeriod === "monthly" && styles.toggleActive]}>
                            <Text style={distanceTimePeriod === "monthly" ? styles.toggleActiveText : styles.toggleText}>Monthly 🔽</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {distance.length > 0 ? (
                    <VictoryChart
                        theme={VictoryTheme.material}
                        domainPadding={{ x: 20 }}
                        width={windowWidth - 64}
                        height={300}
                    >
                        <VictoryAxis />
                        <VictoryAxis dependentAxis />
                        <VictoryBar
                            data={distance}
                            x="label"
                            y="distance"
                            style={{ data: { fill: "#6C2BFF" } }}
                            cornerRadius={{ top: 4 }}
                        />
                    </VictoryChart>
                ) : (
                    <Text style={styles.emptyText}> Start logging to see your data!</Text>
                )}
        </View>

        <View style={styles.chartCard}>
            <View style={styles.header}>
                <Text style={styles.chartTitle}>Run Type Distribution</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity onPress={() => setRunTypeTimePeriod("weekly")} style={[styles.toggleBtn, runTypeTimePeriod === "weekly" && styles.toggleActive]}>
                        <Text style={runTypeTimePeriod === "weekly" ? styles.toggleActiveText : styles.toggleText}>Weekly 🔽</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRunTypeTimePeriod("monthly")} style={[styles.toggleBtn, runTypeTimePeriod === "monthly" && styles.toggleActive]}>
                        <Text style={runTypeTimePeriod === "monthly" ? styles.toggleActiveText : styles.toggleText}>Monthly 🔽</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {runType.length > 0 ? (
                <VictoryPie
                    data={runType}
                    x="type"
                    y="count"
                    colorScale={["#34C759", "#FF6B35", "#FF3B30", "#0A84FF"]}
                    width={320}
                    height={320}
                    innerRadius={50}
            />
            ) : (
                <Text style={styles.emptyText}> Start logging to see your data! </Text>
            )}
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    chartCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: "center"
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: "bold",
        alignSelf: "flex-start",
        marginBottom: -10,
    },
    emptyText: {
        marginTop: 40,
        color: "#888",
        fontStyle: "italic"
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#F0F0F0",
        borderRadius: 8,
        padding: 2,
    },
    toggleBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    toggleActive: {
        backgroundColor: "#6C2BFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleText: {
        fontSize: 12,
        color: "#666",
    },
    toggleActiveText: {
        fontSize: 12,
        color: "#000",
        fontWeight: "bold",
    }
});
