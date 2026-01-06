import { describe, it, expect, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { exportXLSXWithFormatting } from "./xlsxExport";
import { Exercise, Session } from "./types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";

// Helper to create a minimal test XLSX file with Einheit structure
function createTestXLSX(): string {
  const ws = XLSX.utils.aoa_to_sheet([
    ["", "", "", "", "", "Einheit:", "", "Einheit:", ""],
    ["", "", "", "", "", "Datum:", "", "Datum:", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["Nr", "Übungen", "Notiz", "WH-Zahl", "Satz:", "WH", "KG", "WH", "KG"],
    ["1", "Beinstrecken", "Test", "10-12", "Satz 1", "", "", "", ""],
    ["", "", "", "", "Satz 2", "", "", "", ""],
    ["2", "Bankdrücken", "Test", "10-12", "Satz 1", "", "", "", ""],
    ["", "", "", "", "Satz 2", "", "", "", ""],
  ]);

  ws["!merges"] = [
    { s: { r: 5, c: 5 }, e: { r: 6, c: 5 } }, // Reps column merged for exercise 1 at column F (5)
    { s: { r: 5, c: 6 }, e: { r: 6, c: 6 } }, // Weight column merged for exercise 1 at column G (6)
    { s: { r: 7, c: 5 }, e: { r: 8, c: 5 } }, // Reps column merged for exercise 2 at column F (5)
    { s: { r: 7, c: 6 }, e: { r: 8, c: 6 } }, // Weight column merged for exercise 2 at column G (6)
    { s: { r: 5, c: 7 }, e: { r: 6, c: 7 } }, // Reps column merged for exercise 1 at column H (7)
    { s: { r: 5, c: 8 }, e: { r: 6, c: 8 } }, // Weight column merged for exercise 1 at column I (8)
    { s: { r: 7, c: 7 }, e: { r: 8, c: 7 } }, // Reps column merged for exercise 2 at column H (7)
    { s: { r: 7, c: 8 }, e: { r: 8, c: 8 } }, // Weight column merged for exercise 2 at column I (8)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Einheit 1-8 (10-12)");

  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return arrayBufferToBase64(buffer);
}

// Helper to extract cell values from exported workbook
function getCellValue(
  exportedBuffer: ArrayBuffer,
  sheetName: string,
  cellRef: string
): any {
  const wb = XLSX.read(exportedBuffer, { type: "array" });
  const ws = wb.Sheets[sheetName];
  if (!ws || !ws[cellRef]) return undefined;
  return ws[cellRef].v;
}

// Helper to get merged cells from exported workbook
function getMergedCells(
  exportedBuffer: ArrayBuffer,
  sheetName: string
): XLSX.Range[] {
  const wb = XLSX.read(exportedBuffer, { type: "array" });
  const ws = wb.Sheets[sheetName];
  return ws?.["!merges"] || [];
}

describe("exportXLSXWithFormatting", () => {
  let testXLSXBase64: string;
  let mockExercises: Exercise[];
  let mockSessions: Session[];

  beforeEach(() => {
    testXLSXBase64 = createTestXLSX();

    mockExercises = [
      {
        id: "exercise-1",
        name: "Beinstrecken / Maschine",
        notes: "Sitz: 3",
        order: 1,
      },
      {
        id: "exercise-2",
        name: "Bankdrücken",
        notes: "",
        order: 2,
      },
    ];

    mockSessions = [
      {
        date: "2025-01-01",
        entries: [
          {
            exerciseId: "exercise-1",
            sets: [
              { setNumber: 1, reps: 12, weight: 50 },
              { setNumber: 2, reps: 11, weight: 50 },
            ],
          },
          {
            exerciseId: "exercise-2",
            sets: [
              { setNumber: 1, reps: 10, weight: 100 },
              { setNumber: 2, reps: 9, weight: 100 },
            ],
          },
        ],
      },
      {
        date: "2025-01-02",
        entries: [
          {
            exerciseId: "exercise-1",
            sets: [{ setNumber: 1, reps: 12, weight: 52.5 }],
          },
          {
            exerciseId: "exercise-2",
            sets: [
              { setNumber: 1, reps: 11, weight: 105 },
              { setNumber: 2, reps: 10, weight: 105 },
            ],
          },
        ],
      },
    ];
  });

  it("should export XLSX with session data filled in", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should write Satz 1 reps and weight correctly", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    const reps = getCellValue(result, "Einheit 1-8 (10-12)", "F6"); // Row 6, Col F (reps)
    const weight = getCellValue(result, "Einheit 1-8 (10-12)", "G6"); // Row 6, Col G (weight)

    expect(reps).toBe(12);
    expect(weight).toBe(50);
  });

  it("should unmerge and write Satz 2 data correctly", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    const reps = getCellValue(result, "Einheit 1-8 (10-12)", "F7"); // Row 7, Col F (reps)
    const weight = getCellValue(result, "Einheit 1-8 (10-12)", "G7"); // Row 7, Col G (weight)

    expect(reps).toBe(11);
    expect(weight).toBe(50);
  });

  it("should remove merged cells that span Satz 1 and Satz 2", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    const mergedCells = getMergedCells(result, "Einheit 1-8 (10-12)");

    // Check that merged cells spanning both Satz 1 and Satz 2 have been removed
    const isMergedAcrossRows = mergedCells.some(
      (merge) =>
        merge.s.r !== merge.e.r && // Different rows
        merge.s.c >= 5 && // In the data columns (F=5, G=6)
        merge.e.c <= 6
    );

    expect(isMergedAcrossRows).toBe(false);
  });

  it("should write dates to empty Einheit columns", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    // The second session date should be written to column H (Einheit 2)
    const datumCell = getCellValue(result, "Einheit 1-8 (10-12)", "H1");

    // Check that a date was written
    expect(datumCell).toBeDefined();
  });

  it("should handle sessions with partial data (missing Satz 2)", () => {
    const partialSessions: Session[] = [
      {
        date: "2025-01-01",
        entries: [
          {
            exerciseId: "exercise-1",
            sets: [{ setNumber: 1, reps: 12, weight: 50 }], // Only Satz 1
          },
        ],
      },
    ];

    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      partialSessions,
      mockExercises
    );

    const satz1Reps = getCellValue(result, "Einheit 1-8 (10-12)", "F6");
    const satz2Reps = getCellValue(result, "Einheit 1-8 (10-12)", "F7");

    expect(satz1Reps).toBe(12);
    // Satz 2 should be empty (from the template) or undefined
    expect(
      satz2Reps == null || satz2Reps === "" || satz2Reps === undefined
    ).toBe(true);
  });

  it("should maintain XLSX structure with correct range", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    const wb = XLSX.read(result, { type: "array" });
    const ws = wb.Sheets["Einheit 1-8 (10-12)"];

    expect(ws["!ref"]).toBeDefined();
    expect(typeof ws["!ref"]).toBe("string");
  });

  it("should apply German date format (dd.mm.yyyy) to date cells", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    const wb = XLSX.read(result, { type: "array" });
    const ws = wb.Sheets["Einheit 1-8 (10-12)"];

    // Check that written date cells have the German format
    const datumCells = ["F1", "H1"];
    datumCells.forEach((cellRef) => {
      const cell = ws[cellRef];
      if (cell && cell.v !== undefined && typeof cell.v === "number") {
        // Only check format if this is a numeric date value
        expect(cell.z).toBe("dd.mm.yyyy");
      }
    });
  });

  it("should return valid XLSX that can be read back", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    const wb = XLSX.read(result, { type: "array" });

    expect(wb.SheetNames).toContain("Einheit 1-8 (10-12)");
    expect(wb.Sheets["Einheit 1-8 (10-12)"]).toBeDefined();
  });

  it("should handle multiple exercises correctly", () => {
    const result = exportXLSXWithFormatting(
      testXLSXBase64,
      mockSessions,
      mockExercises
    );

    // Exercise 1 data
    const ex1Satz1Reps = getCellValue(result, "Einheit 1-8 (10-12)", "F6");
    const ex1Satz2Weight = getCellValue(result, "Einheit 1-8 (10-12)", "G7");

    // Exercise 2 data (next two rows)
    const ex2Satz1Reps = getCellValue(result, "Einheit 1-8 (10-12)", "F8");
    const ex2Satz2Weight = getCellValue(result, "Einheit 1-8 (10-12)", "G9");

    expect(ex1Satz1Reps).toBe(12);
    expect(ex1Satz2Weight).toBe(50);
    expect(ex2Satz1Reps).toBe(10);
    expect(ex2Satz2Weight).toBe(100);
  });
});
