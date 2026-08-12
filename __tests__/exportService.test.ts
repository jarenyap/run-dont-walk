import { buildCSV, exportCSV } from "../services/exportService";
import type { Run } from "../types";

jest.mock("../utils/runUtils", () => ({
    computePace: jest.fn(() => "5:30"),
}));

const mockWrite = jest.fn().mockResolvedValue(undefined);
const mockIsAvailable = jest.fn().mockResolvedValue(true);
const mockShare = jest.fn().mockResolvedValue({});

jest.mock("expo-file-system/legacy", () => ({
    documentDirectory: "file:///mock/",
    writeAsStringAsync: (...args: any[]) => mockWrite(...args),
    EncodingType: { UTF8: "utf8" },
}));

jest.mock("expo-sharing", () => ({
    isAvailableAsync: () => mockIsAvailable(),
    shareAsync: (...args: any[]) => mockShare(...args),
}));

const { computePace } = jest.requireMock("../utils/runUtils");

function makeRun(overrides: Partial<Run> = {}): Run {
    const ts = {
        toDate: () => new Date("2026-07-12T00:00:00Z"),
        seconds: 0,
        nanoseconds: 0,
    } as any;
    return {
        id: "run-1",
        userId: "uid-1",
        authorName: "Alice",
        authorAvatarUrl: null,
        title: "Morning Jog",
        distance: 5.2,
        duration: "00:32:15",
        type: "easy",
        notes: "Felt great",
        likes: [],
        commentCount: 0,
        createdAt: ts,
        ...overrides,
    };
}

describe("buildCSV", () => {
    beforeEach(() => jest.clearAllMocks());

    it("starts with correct header row", () => {
        const csv = buildCSV([makeRun()]);
        const header = csv.split("\n")[0];
        expect(header).toBe(
            "Date,Title,Type,Distance (km),Duration (hh:mm:ss),Pace (min/km),Notes"
        );
    });

    it("includes date in YYYY-MM-DD format", () => {
        const csv = buildCSV([makeRun()]);
        const row = csv.split("\n")[1];
        expect(row.startsWith("2026-07-12,")).toBe(true);
    });

    it("formats distance to 2 decimal places", () => {
        const csv = buildCSV([
            makeRun({ distance: 12.3, title: "Solo" }),
        ]);
        const row = csv.split("\n")[1];
        // distance is the 4th column (after date, title, type)
        expect(row).toContain(",easy,12.30,");
    });

    it("wraps title in quotes and escapes internal double quotes", () => {
        const csv = buildCSV([
            makeRun({ title: 'Run "The Loop"', notes: "test" }),
        ]);
        const row = csv.split("\n")[1];
        expect(row).toContain(',"Run ""The Loop""",');
    });

    it("wraps notes in quotes", () => {
        const csv = buildCSV([makeRun({ notes: "Sunny, 20°C" })]);
        const row = csv.split("\n")[1];
        expect(row).toContain(',"Sunny, 20°C"');
    });

    it("outputs empty quoted string for missing title", () => {
        const csv = buildCSV([makeRun({ title: "" as any })]);
        const row = csv.split("\n")[1];
        expect(row.startsWith('2026-07-12,""')).toBe(true);
    });

    it("outputs empty quoted string for missing notes", () => {
        const csv = buildCSV([makeRun({ notes: "" as any })]);
        expect(csv).toContain(',""');
    });

    it("calls computePace with correct args", () => {
        buildCSV([makeRun({ duration: "01:00:00", distance: 10 })]);
        expect(computePace).toHaveBeenCalledWith("01:00:00", 10);
    });

    it("returns one row per run plus header", () => {
        const csv = buildCSV([makeRun(), makeRun({ id: "run-2" })]);
        const rows = csv.split("\n").filter(Boolean);
        expect(rows).toHaveLength(3);
    });
});

describe("exportCSV", () => {
    beforeEach(() => jest.clearAllMocks());

    it("throws when runs array is empty", async () => {
        await expect(exportCSV([])).rejects.toThrow("No runs to export");
    });

    it("writes CSV to file system", async () => {
        mockIsAvailable.mockResolvedValue(true);
        await exportCSV([makeRun()]);
        expect(mockWrite).toHaveBeenCalledWith(
            expect.stringContaining("file:///mock/walk-dont-run-"),
            expect.stringContaining("2026-07-12"),
            { encoding: "utf8" }
        );
    });

    it("shares the file when sharing is available", async () => {
        mockIsAvailable.mockResolvedValue(true);
        await exportCSV([makeRun()]);
        expect(mockShare).toHaveBeenCalledWith(
            expect.stringContaining("file:///mock/"),
            expect.objectContaining({ mimeType: "text/csv" })
        );
    });

    it("throws when sharing is unavailable", async () => {
        mockIsAvailable.mockResolvedValue(false);
        await expect(exportCSV([makeRun()])).rejects.toThrow(
            "Unable to export file."
        );
    });
});
