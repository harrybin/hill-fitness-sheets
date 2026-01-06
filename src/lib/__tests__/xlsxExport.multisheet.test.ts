import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseXLSX } from "../xlsxImport";
import { exportXLSXWithFormatting } from "../xlsxExport";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils";
import { Exercise, Session } from "../types";
import * as fs from "fs";
import * as path from "path";

const EXAMPLE_XLSX_PATH = path.join(
  __dirname,
  "fixtures",
  "Example-Sheet.xlsx"
);

describe("XLSX export with >8 sessions (multi-sheet)", () => {
  let base64Data: string;
  let exercises: Exercise[];
  let sessions: Session[];

  it("should export 12+ sessions over 3 sheets and re-import all data correctly", () => {
    // 1. Load and parse the example XLSX
    const fileBuffer = fs.readFileSync(EXAMPLE_XLSX_PATH);
    base64Data = arrayBufferToBase64(
      fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      )
    );
    const parsed = parseXLSX(
      fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      )
    );
    exercises = parsed.exercises;

    // 2. Add 12 sessions (dates: 2025-01-01 ... 2025-01-12)
    sessions = Array.from({ length: 12 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      entries: exercises.map((ex, exIdx) => ({
        id: `entry-${i + 1}-${ex.id}`,
        exerciseId: ex.id,
        date: `2025-01-${String(i + 1).padStart(2, "0")}`,
        sets: [
          { setNumber: 1, weight: 50 + exIdx * 5 + i, reps: 10 + i },
          { setNumber: 2, weight: 50 + exIdx * 5 + i, reps: 9 + i },
        ],
      })),
    }));

    // 3. Export the sessions to XLSX
    const exportedBuffer = exportXLSXWithFormatting(
      base64Data,
      sessions,
      exercises
    );
    expect(exportedBuffer).toBeInstanceOf(ArrayBuffer);
    expect(exportedBuffer.byteLength).toBeGreaterThan(0);

    // 4. Re-import and check sessions are distributed over 3 sheets (max 8 per sheet)
    const wb = XLSX.read(exportedBuffer, { type: "array" });
    const sheetNames = wb.SheetNames.filter((n) =>
      n.toLowerCase().includes("einheit")
    );
    expect(sheetNames.length).toBeGreaterThanOrEqual(2); // Should be at least 2 sheets for 12 sessions

    // Parse back using parseXLSX
    const reparsed = parseXLSX(exportedBuffer);
    expect(reparsed.sessions.length).toBe(12);
    // Check all session dates are present
    for (let i = 0; i < 12; i++) {
      const date = `2025-01-${String(i + 1).padStart(2, "0")}`;
      expect(reparsed.sessions.some((s) => s.date === date)).toBe(true);
    }
    // Check each session has all exercises and sets
    reparsed.sessions.forEach((session) => {
      expect(session.entries.length).toBe(exercises.length);
      session.entries.forEach((entry) => {
        expect(entry.sets.length).toBe(2);
      });
    });
  });
});
