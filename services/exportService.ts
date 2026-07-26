import * as xpoFileSystem from "expo-file-system/legacy";
import * as xpoSharing from "expo-sharing";
import { Run } from "../types";
import { computePace } from "../utils/runUtils";

const csvWrapper = (val : string) => {
    return `"${val.replace(/"/g, '""')}"`;
}

export const buildCSV = (runs : Run[]) : string => {
    const header = ["Date", "Title", "Type", "Distance (km)", "Duration (hh:mm:ss)", "Pace (min/km)", "Notes"];
    const rows = runs.map((run) => {
        const date = run.createdAt.toDate().toISOString().split("T")[0];
        const pace = computePace(run.duration, run.distance);
        return [
            date,
            csvWrapper(run.title ?? ""),
            run.type,
            run.distance.toFixed(2),
            run.duration,
            pace,
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
        const timestamp = new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
        const fileName = `walk-dont-run-${timestamp}.csv`;
        const fileUri = `${xpoFileSystem.documentDirectory}${fileName}`;
        await xpoFileSystem.writeAsStringAsync(fileUri, csv, {
            encoding: xpoFileSystem.EncodingType.UTF8,
        });
        const share = await xpoSharing.isAvailableAsync();
        if (!share) {
            throw new Error("Unable to export file.");
        }
        let handleTimeout: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
            handleTimeout = setTimeout(() => {
                reject(new Error("Export timed out"));
            }, 30000);
        });
        await Promise.race([
            xpoSharing.shareAsync(fileUri, {
                mimeType: "text/csv",
                dialogTitle: "Export run data",
            }),
            timeout
        ]).finally(() => clearTimeout(handleTimeout));
    } catch (e) {
        console.error("Error exporting runs:", e);
        throw e;
    }
};