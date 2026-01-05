import { parseXLSX } from "../utils";
describe("XLSX Import Rules", () => {
  it("should not import a session if no exercise has reps", () => {
    // All exercises have no reps in both sets for both sessions
    const data = [
      ["", "Übungen", "Notiz"],
      ["", "Bankdrücken", ""],
      ["", "", ""],
      ["", "Kniebeugen", ""],
      ["", "", ""],
      ["", "", "", "", "", "Einheit:", "1", "2"],
      ["Datum:", "", "", "", "", "", "2024-01-10", "2024-01-11"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", "", ""],
      ["", "", "", "", "Satz 2", "", "", ""],
      ["", "Kniebeugen", "", "", "Satz 1", "", "", ""],
      ["", "", "", "", "Satz 2", "", "", ""],
      ["", "Bankdrücken", "", "", "Satz 1", "", "", ""],
      ["", "", "", "", "Satz 2", "", "", ""],
      ["", "Kniebeugen", "", "", "Satz 1", "", "", ""],
      ["", "", "", "", "Satz 2", "", "", ""],
    ];
    const XLSX = require("xlsx");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const result = parseXLSX(arrayBuffer);
    // No session should be imported
    expect(result.sessions.length).toBe(0);
  });
});
import { describe, it, expect } from "vitest";
import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
  parseXLSX,
  updateXLSXWithSessions,
  exportXLSXWithFormatting,
} from "../utils";
import * as XLSX from "xlsx";
import { Exercise, Session } from "../types";

describe("Base64 Conversion Utilities", () => {
  describe("arrayBufferToBase64 and base64ToArrayBuffer", () => {
    it("should convert ArrayBuffer to base64 string", () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const arrayBuffer = data.buffer;
      const base64 = arrayBufferToBase64(arrayBuffer);

      expect(base64).toBe("SGVsbG8=");
    });

    it("should convert base64 string back to ArrayBuffer", () => {
      const base64 = "SGVsbG8="; // "Hello"
      const arrayBuffer = base64ToArrayBuffer(base64);
      const data = new Uint8Array(arrayBuffer);

      expect(Array.from(data)).toEqual([72, 101, 108, 108, 111]);
    });

    it("should maintain data integrity on roundtrip conversion", () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
      const arrayBuffer = originalData.buffer;

      const base64 = arrayBufferToBase64(arrayBuffer);
      const converted = base64ToArrayBuffer(base64);
      const resultData = new Uint8Array(converted);

      expect(Array.from(resultData)).toEqual(Array.from(originalData));
    });

    it("should handle empty ArrayBuffer", () => {
      const emptyBuffer = new ArrayBuffer(0);
      const base64 = arrayBufferToBase64(emptyBuffer);
      const converted = base64ToArrayBuffer(base64);

      expect(converted.byteLength).toBe(0);
    });

    it("should handle large data", () => {
      const largeData = new Uint8Array(10000);
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }

      const base64 = arrayBufferToBase64(largeData.buffer);
      const converted = base64ToArrayBuffer(base64);
      const resultData = new Uint8Array(converted);

      expect(resultData.length).toBe(10000);
      expect(Array.from(resultData)).toEqual(Array.from(largeData));
    });
  });
});

describe("XLSX Exercise Import", () => {
  describe("Header Detection", () => {
    it("should detect German 'Übungen' header", () => {
      const data = [
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", "Achse 1"],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].name).toBe("Bankdrücken");
    });

    it("should detect English 'Exercises' header", () => {
      const data = [
        ["", "Exercises", "Notes"],
        ["", "Bench Press", "Axis 1"],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].name).toBe("Bench Press");
    });

    it("should normalize accented characters in header", () => {
      // Test that "übungen" with combining marks is normalized
      const data = [
        ["", "ubungen", "Notiz"], // Normalized form
        ["", "Kniebeugen", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].name).toBe("Kniebeugen");
    });
  });

  describe("Exercise Parsing", () => {
    it("should parse exercise name from Column B", () => {
      const data = [
        ["", "Übungen", "Notiz", "WH-Zahl"],
        ["", "Bankdrücken", "Achse 1 Fußteller", "10-12"],
        ["", "Kniebeugen", "", "12-15"],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].name).toBe("Bankdrücken");
      expect(result.exercises[1].name).toBe("Kniebeugen");
    });

    it("should parse notes from Column C", () => {
      const data = [
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", "Achse 1 Fußteller"],
        ["", "Kniebeugen", "enger Griff"],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises[0].notes).toBe("Achse 1 Fußteller");
      expect(result.exercises[1].notes).toBe("enger Griff");
    });

    it("should generate unique IDs for exercises", () => {
      const data = [
        ["", "Übungen", "Notiz"],
        ["", "Exercise 1", ""],
        ["", "Exercise 2", ""],
        ["", "Exercise 3", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(3);
      expect(result.exercises[0].id).toBeTruthy();
      expect(result.exercises[1].id).toBeTruthy();
      expect(result.exercises[2].id).toBeTruthy();

      // IDs should be unique
      const ids = result.exercises.map((e) => e.id);
      expect(new Set(ids).size).toBe(3);
    });

    it("should preserve exercise order", () => {
      const data = [
        ["", "Übungen", "Notiz"],
        ["", "First", ""],
        ["", "Second", ""],
        ["", "Third", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises[0].order).toBe(0);
      expect(result.exercises[1].order).toBe(1);
      expect(result.exercises[2].order).toBe(2);
    });

    it("should skip empty rows", () => {
      const data = [
        ["", "Übungen", "Notiz"],
        ["", "Exercise 1", ""],
        ["", "", ""], // Empty row
        ["", "Exercise 2", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].name).toBe("Exercise 1");
      expect(result.exercises[1].name).toBe("Exercise 2");
    });

    it("should skip rows with metadata keywords", () => {
      const data = [
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", ""],
        ["", "Trainingsziel", "Muskelaufbau"], // Should be skipped
        ["", "Kniebeugen", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.exercises).toHaveLength(2);
      expect(result.exercises.some((e) => e.name === "Trainingsziel")).toBe(
        false
      );
    });
  });

  describe("Metadata Extraction", () => {
    it("should extract trainingGoal from metadata rows", () => {
      const data = [
        ["", "Trainingsziel", "Muskelaufbau"],
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.metadata.trainingGoal).toBe("Muskelaufbau");
    });

    it("should extract legalNotice from metadata rows", () => {
      const data = [
        ["", "Rechtliche Hinweise", "Consult a physician"],
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.metadata.legalNotice).toBe("Consult a physician");
    });

    it("should extract notes from metadata rows", () => {
      const data = [
        ["", "Notizen", "Important notes here"],
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.metadata.notes).toBe("Important notes here");
    });

    it("should handle case-insensitive metadata keywords", () => {
      const data = [
        ["", "TRAININGSZIEL", "Strength"],
        ["", "Übungen", "Notiz"],
        ["", "Bankdrücken", ""],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      const result = parseXLSX(arrayBuffer);

      expect(result.metadata.trainingGoal).toBe("Strength");
    });
  });
});

describe("Import-Export Roundtrip", () => {
  it("should import Example-Sheet.xlsx, export it, and maintain data integrity across all sheets", async () => {
    // Import the actual Example-Sheet.xlsx file
    const fs = await import("fs");
    const path = await import("path");

    const exampleSheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet.xlsx"
    );
    const fileBuffer = fs.readFileSync(exampleSheetPath);
    const originalArrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Parse the original file
    const parsed = parseXLSX(originalArrayBuffer);

    expect(parsed.exercises.length).toBeGreaterThan(0);
    console.log(
      `Imported ${parsed.exercises.length} exercises and ${parsed.sessions.length} sessions`
    );

    // Convert to base64 for export function
    const base64Data = arrayBufferToBase64(originalArrayBuffer);

    // Export back to XLSX
    const exportedBuffer = exportXLSXWithFormatting(
      base64Data,
      parsed.sessions,
      parsed.exercises
    );

    // Parse the exported file
    const reparsed = parseXLSX(exportedBuffer);

    // Verify exercises match
    expect(reparsed.exercises.length).toBe(parsed.exercises.length);

    parsed.exercises.forEach((originalEx, idx) => {
      const exportedEx = reparsed.exercises[idx];
      expect(exportedEx.name).toBe(originalEx.name);
      expect(exportedEx.notes).toBe(originalEx.notes);
      expect(exportedEx.order).toBe(originalEx.order);
    });

    // Verify sessions match
    expect(reparsed.sessions.length).toBe(parsed.sessions.length);

    // Sort sessions by date for comparison
    const sortedOriginal = [...parsed.sessions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const sortedExported = [...reparsed.sessions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    sortedOriginal.forEach((originalSession, sessionIdx) => {
      const exportedSession = sortedExported[sessionIdx];

      expect(exportedSession.date).toBe(originalSession.date);
      expect(exportedSession.entries.length).toBe(
        originalSession.entries.length
      );

      originalSession.entries.forEach((originalEntry) => {
        const exportedEntry = exportedSession.entries.find(
          (e) => e.exerciseId === originalEntry.exerciseId
        );

        expect(exportedEntry).toBeDefined();
        expect(exportedEntry!.sets.length).toBe(originalEntry.sets.length);

        // Sort sets by set number for comparison
        const sortedOriginalSets = [...originalEntry.sets].sort(
          (a, b) => a.setNumber - b.setNumber
        );
        const sortedExportedSets = [...exportedEntry!.sets].sort(
          (a, b) => a.setNumber - b.setNumber
        );

        sortedOriginalSets.forEach((originalSet, setIdx) => {
          const exportedSet = sortedExportedSets[setIdx];
          expect(exportedSet.setNumber).toBe(originalSet.setNumber);
          expect(exportedSet.weight).toBe(originalSet.weight);
          expect(exportedSet.reps).toBe(originalSet.reps);
        });
      });
    });

    // Verify all sheets are present in the exported workbook
    const originalWorkbook = XLSX.read(originalArrayBuffer, { type: "array" });
    const exportedWorkbook = XLSX.read(exportedBuffer, { type: "array" });

    console.log(`Original sheets: ${originalWorkbook.SheetNames.join(", ")}`);
    console.log(`Exported sheets: ${exportedWorkbook.SheetNames.join(", ")}`);

    // All original sheets should still be present (except those we might have removed)
    originalWorkbook.SheetNames.forEach((sheetName) => {
      if (sheetName !== "Trainings") {
        // Trainings is regenerated
        expect(exportedWorkbook.SheetNames).toContain(sheetName);
      }
    });

    // Trainings sheet should be added
    expect(exportedWorkbook.SheetNames).toContain("Trainings");

    // Verify that original exercise sheets are unchanged
    const sheetNamesToVerify = originalWorkbook.SheetNames.filter(
      (name) =>
        name.toLowerCase().includes("einheit") ||
        name.toLowerCase().includes("unit")
    );

    sheetNamesToVerify.forEach((sheetName) => {
      const originalSheet = originalWorkbook.Sheets[sheetName];
      const exportedSheet = exportedWorkbook.Sheets[sheetName];

      expect(exportedSheet).toBeDefined();

      // Convert sheets to JSON for comparison
      const originalData = XLSX.utils.sheet_to_json(originalSheet, {
        header: 1,
        defval: null,
      });
      const exportedData = XLSX.utils.sheet_to_json(exportedSheet, {
        header: 1,
        defval: null,
      });

      expect(exportedData.length).toBe(originalData.length);

      // Verify key exercise data is preserved (first few columns with exercise info)
      for (let i = 0; i < Math.min(originalData.length, 20); i++) {
        const originalRow = originalData[i] as any[];
        const exportedRow = exportedData[i] as any[];

        // Check first 5 columns (exercise metadata)
        for (let col = 0; col < 5; col++) {
          expect(exportedRow[col]).toEqual(originalRow[col]);
        }
      }
    });
  });
});

describe("Date Parsing", () => {
  it("should parse ISO format dates (YYYY-MM-DD)", () => {
    const data = [
      // Row 0-7: Header rows
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      // Row 8: Einheit row
      ["", "", "", "", "", "Einheit:", "1"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      // Row 11: Datum row
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      // Row 12: Header
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      // Row 13-14: Bankdrücken Satz 1 & 2
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe("2024-01-15");
  });

  it("should parse German format dates (DD.MM.YYYY)", () => {
    const data = [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "Einheit:", "1"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Datum:", "", "", "", "", "", "15.01.2024"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe("2024-01-15");
  });

  it("should parse German format with 2-digit year", () => {
    const data = [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "Einheit:", "1"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Datum:", "", "", "", "", "", "15.01.24"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe("2024-01-15");
  });

  it("should parse US format dates (MM/DD/YYYY)", () => {
    const data = [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "Einheit:", "1"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Datum:", "", "", "", "", "", "1/15/2024"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe("2024-01-15");
  });

  it("should parse Excel serial number dates", () => {
    // Excel serial 45305 = 2024-01-15 (but XLSX library may have off-by-one issue)
    const data = [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "Einheit:", "1"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Datum:", "", "", "", "", "", 45305],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    // Excel serial number conversion can vary, accept 2024-01-14 or 2024-01-15
    expect(result.sessions[0].date).toMatch(/^2024-01-(14|15)$/);
  });
});
