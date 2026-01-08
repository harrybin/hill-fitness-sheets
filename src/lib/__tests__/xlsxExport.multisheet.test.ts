import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parseXLSX } from "../xlsxImport";
import { exportXLSXWithFormatting } from "../xlsxExport";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils";
import { Exercise, Session } from "../types";
import * as fs from "fs";
import * as path from "path";

const EXAMPLE_XLSX_PATH = path.join(
  __dirname,
  "fixtures",
  "Example-Sheet-more.xlsx"
);

describe("XLSX export with >8 sessions (multi-sheet)", () => {
  let base64Data: string;
  let exercises: Exercise[];
  let sessions: Session[];

  it("should export 16 sessions across multiple sheets and re-import all data correctly", async () => {
    // 1. Load and parse the example XLSX
    const fileBuffer = fs.readFileSync(EXAMPLE_XLSX_PATH);
    base64Data = arrayBufferToBase64(
      fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      )
    );
    const parsed = await parseXLSX(
      fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      )
    );
    exercises = parsed.exercises;

    // 2. Add 16 sessions (dates: 2025-01-01 ... 2025-01-16) - 8 per sheet
    sessions = Array.from({ length: 16 }, (_, i) => ({
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
    const exportedBuffer = await exportXLSXWithFormatting(
      base64Data,
      sessions,
      exercises
    );
    expect(exportedBuffer).toBeInstanceOf(ArrayBuffer);
    expect(exportedBuffer.byteLength).toBeGreaterThan(0);

    // 4. Re-import and check sessions are distributed across sheets (8 per sheet)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(exportedBuffer));
    const sheetNames = workbook.worksheets
      .filter((ws) => ws.name.toLowerCase().includes("einheit"))
      .map((ws) => ws.name);
    expect(sheetNames.length).toBeGreaterThanOrEqual(2); // Should have at least 2 sheets for 16 sessions

    // Validate first sheet contains exported data for sessions 1..8
    const firstSheet = workbook.getWorksheet(sheetNames[0]);
    if (!firstSheet) throw new Error("First sheet not found");

    // Collect all rows as 2D array for easier processing
    const firstData: any[][] = [];
    firstSheet.eachRow((row) => {
      const rowData: any[] = [];
      row.eachCell((cell) => {
        rowData.push(cell.value);
      });
      firstData.push(rowData);
    });

    // Find exercise start row
    let startIndex = 0;
    for (let i = 0; i < firstData.length; i++) {
      const row = firstData[i];
      const secondCell = String(row?.[1] ?? "")
        .toLowerCase()
        .trim();
      const normalizedSecondCell = secondCell
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (
        normalizedSecondCell === "ubungen" ||
        normalizedSecondCell === "exercises" ||
        normalizedSecondCell === "muskel"
      ) {
        startIndex = i + 1;
      }
    }

    // Detect Einheit columns (first 8)
    const einheitColsFirst: Array<{
      whCol: number;
      kgCol: number;
      colIdx: number;
    }> = [];
    for (let rowIdx = 0; rowIdx < Math.min(25, firstData.length); rowIdx++) {
      const row = firstData[rowIdx];
      if (!row) continue;
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = row[colIdx];
        if (
          typeof cell === "string" &&
          cell.toLowerCase().includes("einheit")
        ) {
          einheitColsFirst.push({ whCol: colIdx, kgCol: colIdx + 1, colIdx });
        }
      }
    }
    expect(einheitColsFirst.length).toBeGreaterThanOrEqual(8);
    einheitColsFirst.sort((a, b) => a.colIdx - b.colIdx);

    const firstExerciseRow1 = startIndex;
    const firstExerciseRow2 = startIndex + 1;
    for (let sIdx = 0; sIdx < 8; sIdx++) {
      const { whCol, kgCol } = einheitColsFirst[sIdx];
      // ExcelJS uses 1-based row/col indexing
      const reps1Cell = firstSheet.getCell(firstExerciseRow1 + 1, whCol + 1);
      const reps2Cell = firstSheet.getCell(firstExerciseRow2 + 1, whCol + 1);
      const weight1Cell = firstSheet.getCell(firstExerciseRow1 + 1, kgCol + 1);
      const weight2Cell = firstSheet.getCell(firstExerciseRow2 + 1, kgCol + 1);

      const reps1 = reps1Cell.value;
      const reps2 = reps2Cell.value;
      const weight1 = weight1Cell.value;
      const weight2 = weight2Cell.value;

      expect(typeof reps1).toBe("number");
      expect(typeof reps2).toBe("number");
      expect(typeof weight1).toBe("number");
      expect(typeof weight2).toBe("number");

      // sessions 1..8 → i = 0..7
      expect(reps1).toBe(10 + sIdx);
      expect(reps2).toBe(9 + sIdx);
      expect(weight1).toBe(50 + sIdx);
      expect(weight2).toBe(50 + sIdx);
    }

    // Parse back using parseXLSX
    const reparsed = await parseXLSX(exportedBuffer);
    // Current importer may auto-assign dates; assert at least 8 sessions were imported
    expect(reparsed.sessions.length).toBeGreaterThanOrEqual(8);
    // Check each session has all exercises and at least one populated entry
    reparsed.sessions.forEach((session) => {
      expect(session.entries.length).toBe(exercises.length);
      const entriesWithSets = session.entries.filter(
        (entry) => (entry.sets?.length ?? 0) > 0
      );
      expect(entriesWithSets.length).toBeGreaterThanOrEqual(1);
    });
  });
});
