import { describe, it, expect } from "vitest";
import { parseXLSX } from "../utils";
import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("parseXLSX skipped logic", () => {
  const exampleSheetPath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");
  let exampleSheetBuffer: ArrayBuffer;

  const loadExampleSheet = (): ArrayBuffer => {
    if (!exampleSheetBuffer) {
      const fileBuffer = readFileSync(exampleSheetPath);
      exampleSheetBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );
    }
    return exampleSheetBuffer;
  };

  it("should set skipped=true for exercises with no values if session has any reps", async () => {
    const arrayBuffer = loadExampleSheet();
    const result = await parseXLSX(arrayBuffer);

    // Find a session with at least one entry with reps
    const sessionWithReps = result.sessions.find((session) =>
      session.entries.some((entry) => entry.sets.length > 0)
    );
    expect(sessionWithReps).toBeDefined();

    // In dieser Session sollten Einträge existieren, die skipped=true sind
    const skippedEntries = sessionWithReps!.entries.filter(
      (entry) => entry.skipped === true
    );
    expect(skippedEntries.length).toBeGreaterThan(0);

    // skipped-Entries dürfen keine Sets haben
    skippedEntries.forEach((entry) => {
      expect(entry.sets.length).toBe(0);
    });

    // Einträge mit Sets dürfen nicht skipped sein
    const nonSkippedEntries = sessionWithReps!.entries.filter(
      (entry) => entry.sets.length > 0
    );
    nonSkippedEntries.forEach((entry) => {
      expect(entry.skipped).not.toBe(true);
    });
  });
});
