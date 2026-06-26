import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";  
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryPie} from "victory-native";
import { Run } from "../types";

interface StatsDashboardItems {
    runs: Run[];
}

export default function StatsDashboard({ runs }: StatsDashboardItems) {
    const windowWidth = Dimensions.get("window").width;
    const monthlyDistance = useMemo(() => {
        const monthlyData: { [key: string]: number } = {};
        runs.forEach(run => {
            if (!run.createdAt) return;
            const date = run.createdAt.toDate();
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months[date.getMonth()] + " " + date.getFullYear();
            monthlyData[month] = (monthlyData[month] || 0) + run.distance;
            })
            return Object.keys(monthlyData).map(month => ({ 
                month: month, 
                distance: monthlyData[month] 
            }));
        }, [runs]);

    const runType = useMemo(() => {
        const typeData: { [key: string]: number } = {};
        runs.forEach(run => {
            if (!run.type) return;
            const type = run.type || "Other";
            typeData[type] = (typeData[type] || 0) + 1;
            })
            return Object.keys(typeData).map(type => ({ 
                type: type, 
                count: typeData[type] 
            }));
        }, [runs]);

    return (
        <View style={styles.container}>
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Monthly Distance (km)</Text>
                {monthlyDistance.length > 0 ? (
                    <VictoryChart
                        theme={VictoryTheme.material}
                        domainPadding={{ x: 20 }}
                        width={windowWidth - 64}
                        height={300}
                    >
                        <VictoryAxis />
                        <VictoryAxis dependentAxis />
                        <VictoryBar
                            data={monthlyDistance}
                            x="month"
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
            <Text style={styles.chartTitle}>Run Type Distribution</Text>
            {runType.length > 0 ? (
                <VictoryPie
                    data={runType}
                    x="type"
                    y="count"
                    colorScale={["#FF8538", "#6C2BFF", "#4DBF4D", "#FF4444"]}
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
        backgroundColor: "#fff",
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
    }
});
