import * as xpoFileSystem from "expo-file-system/legacy";
import * as xpoSharing from "expo-sharing";
import { Run } from "../types";
import { computePace } from "../utils/runUtils";

const csvWrapper = (val : string) => {
    return `"${val.replace(/"/g, '""')}"`;
}

export const buildCSV = (runs : Run[]) : string => {
    const header = ["Date", "Distance (km)", "Duration (hh:mm:ss)", "Pace (min/km)", "Title", "Notes\n"];
    const rows = runs.map((run) => {
        const date = run.createdAt.toDate().toISOString().split("T")[0];
        const pace = computePace(run.duration, run.distance);
        return [
            date,
            run.distance.toFixed(2),
            run.duration,
            pace,
            run.type,
            csvWrapper(run.title ?? ""),
            csvWrapper(run.notes ?? "") 
        ].join(",");
    });
    return header.join(",") + "\n" + rows.join("\n");
}

export const exportCSV = async (runs : Run[]) : Promise<void> => {
    if (runs.length === 0) {
        throw new Error("No runs to export");
    }
    try {
        const csv = buildCSV(runs);
        const fileName = `walk-dont-run-${Date.now()}.csv`;
        const fileUri = `${xpoFileSystem.documentDirectory}${fileName}`;
        await xpoFileSystem.writeAsStringAsync(fileUri, csv, {
            encoding: xpoFileSystem.EncodingType.UTF8,
        });
        const share = await xpoSharing.isAvailableAsync();
        if (!share) {
            throw new Error("Unable to export file.");
        }
        await Promise.race([
            xpoSharing.shareAsync(fileUri, {
                mimeType: "text/csv",
                dialogTitle: "Export run data",
            }),
            new Promise((_, reject) => 
                setTimeout(() => 
                    reject(new Error("Export timed out")), 30000))
        ]);
    } catch (e) {
        console.error("Error exporting runs:", e);
        throw e;
    }
};