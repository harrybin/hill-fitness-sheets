// Import-Regeln für XLSX-Parser:
// - Eine Einheit (Session) wird nur importiert, wenn mindestens eine Übung in mindestens einem Satz eine Wiederholungszahl (Reps) hat.
// - Hat eine zu importierende Einheit für eine Übung in beiden Sätzen keinen Zahlenwert (Reps), wird diese Übung in dieser Einheit mit skipped: true markiert.
import { describe, it, expect } from "vitest";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  updateXLSXWithSessions,
  exportXLSXWithFormatting,
} from "../utils";
import * as XLSX from "xlsx";
import { Exercise, Session } from "../types";

describe("XLSX Export - updateXLSXWithSessions", () => {
  it("should not create History sheet", () => {
    // Create a minimal workbook
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "ex1", name: "Bankdrücken", order: 0 },
      { id: "ex2", name: "Kniebeugen", order: 1 },
    ];

    const sessions: Session[] = [
      {
        date: "2024-01-15",
        entries: [
          {
            id: "entry1",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [
              { setNumber: 1, weight: 50, reps: 12 },
              { setNumber: 2, weight: 50, reps: 10 },
            ],
          },
        ],
      },
    ];

    const updatedBase64 = updateXLSXWithSessions(base64, sessions, exercises);
    const updatedBuffer = base64ToArrayBuffer(updatedBase64);
    const updatedWorkbook = XLSX.read(updatedBuffer, { type: "array" });

    // Should NOT create History sheet
    expect(updatedWorkbook.SheetNames).not.toContain("History");
    // Should keep original sheets
    expect(updatedWorkbook.SheetNames).toContain("Sheet1");
  });
});

describe("XLSX Export - exportXLSXWithFormatting", () => {
  it("should fill Einheit columns with session data", () => {
    // Create sheet data:
    // Cols 0-4: Exercise metadata (Nr, Übung, Notiz, WH-Zahl, Sätze)
    // Cols 5-6: Einheit 1 (WH, KG)
    const sheetData: any[][] = [
      ["Metadata1"],
      [],
      [],
      ["", "", "", "", "Einheit:", 1], // Col 4-5: Einheit 1 header
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "WH", "KG"], // Headers
      ["Datum:", "", "", "", 45000], // Col 4: Date for Einheit 1
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"], // Real headers
      [1, "Bankdrücken", "", "10-12", "Satz: 1"], // Row 7: Ex1 Satz1
      ["", "", "", "", "Satz: 2"], // Row 8: Ex1 Satz2
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Einheit 1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "ex1", name: "Bankdrücken", order: 0 },
    ];

    const sessions: Session[] = [
      {
        date: "2023-03-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2023-03-15",
            sets: [
              { setNumber: 1, weight: 50, reps: 12 },
              { setNumber: 2, weight: 50, reps: 10 },
            ],
          },
        ],
      },
    ];

    const exportedBuffer = exportXLSXWithFormatting(
      base64,
      sessions,
      exercises
    );
    const exportedWorkbook = XLSX.read(exportedBuffer, { type: "array" });
    const exportedSheet = exportedWorkbook.Sheets["Einheit 1"];

    // Exercise 1 data is at rows 7-8, cols 4-5 (WH-KG)
    const satz1RepsCell = exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 4 })];
    const satz1WeightCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 5 })];
    const satz2RepsCell = exportedSheet[XLSX.utils.encode_cell({ r: 8, c: 4 })];
    const satz2WeightCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 8, c: 5 })];

    expect(satz1RepsCell?.v).toBe(12);
    expect(satz1WeightCell?.v).toBe(50);
    expect(satz2RepsCell?.v).toBe(10);
    expect(satz2WeightCell?.v).toBe(50);
  });
  it("should handle multiple Einheit columns", () => {
    const sheetData: any[][] = [
      ["Metadata"],
      [],
      [],
      ["", "", "", "", "Einheit:", "", "Einheit:"], // Cols 4, 6: Einheit headers
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "WH", "KG", "WH", "KG"], // Col labels
      ["Datum:", "", "", "", 45000, "", 45005], // Cols 4, 6: dates
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"], // Real headers
      [1, "Bankdrücken", "", "10-12", "Satz: 1"], // Row 7: Ex1 Satz1
      ["", "", "", "", "Satz: 2"], // Row 8: Ex1 Satz2
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Einheiten");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "ex1", name: "Bankdrücken", order: 0 },
    ];

    const sessions: Session[] = [
      {
        date: "2023-03-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2023-03-15",
            sets: [
              { setNumber: 1, weight: 50, reps: 12 },
              { setNumber: 2, weight: 50, reps: 10 },
            ],
          },
        ],
      },
      {
        date: "2023-03-20",
        entries: [
          {
            id: "e2",
            exerciseId: "ex1",
            date: "2023-03-20",
            sets: [
              { setNumber: 1, weight: 55, reps: 11 },
              { setNumber: 2, weight: 55, reps: 9 },
            ],
          },
        ],
      },
    ];

    const exportedBuffer = exportXLSXWithFormatting(
      base64,
      sessions,
      exercises
    );
    const exportedWorkbook = XLSX.read(exportedBuffer, { type: "array" });
    const exportedSheet = exportedWorkbook.Sheets["Einheiten"];

    // First Einheit (cols 4-5, rows 7-8)
    const ein1Satz1RepsCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 4 })];
    const ein1Satz1WeightCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 5 })];
    expect(ein1Satz1RepsCell?.v).toBe(12);
    expect(ein1Satz1WeightCell?.v).toBe(50);

    // Second Einheit (cols 6-7, rows 7-8)
    const ein2Satz1RepsCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    const ein2Satz1WeightCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 7 })];
    expect(ein2Satz1RepsCell?.v).toBe(11);
    expect(ein2Satz1WeightCell?.v).toBe(55);
  });

  it("should not create new sheets", () => {
    const sheetData: any[][] = [
      ["Metadata"],
      ["Einheit:", ""],
      ["WH", "KG"],
      ["Datum:", 45000],
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"],
      [1, "Test", "", "10-12", "Satz: 1"],
      ["", "", "", "", "Satz: 2"],
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Original");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [{ id: "ex1", name: "Test", order: 0 }];
    const sessions: Session[] = [];

    const exportedBuffer = exportXLSXWithFormatting(
      base64,
      sessions,
      exercises
    );
    const exportedWorkbook = XLSX.read(exportedBuffer, { type: "array" });

    expect(exportedWorkbook.SheetNames).not.toContain("Trainings");
    expect(exportedWorkbook.SheetNames).toContain("Original");
  });

  it("should handle sheets without Einheit columns gracefully", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Simple", "Sheet"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "NoEinheit");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [];
    const sessions: Session[] = [];

    expect(() => {
      exportXLSXWithFormatting(base64, sessions, exercises);
    }).not.toThrow();
  });

  it("should handle exercises with only Satz 1", () => {
    const sheetData: any[][] = [
      ["Metadata"],
      [],
      [],
      ["", "", "", "", "Einheit:", ""], // Col 4: Einheit header
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "WH", "KG"], // Headers
      ["Datum:", "", "", "", 45000], // Col 4: Date
      ["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"], // Real headers
      [1, "Bankdrücken", "", "10-12", "Satz: 1"], // Row 7: Ex1 Satz1
      ["", "", "", "", "Satz: 2"], // Row 8: Ex1 Satz2
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Einheit");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "ex1", name: "Bankdrücken", order: 0 },
    ];

    const sessions: Session[] = [
      {
        date: "2023-03-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2023-03-15",
            sets: [{ setNumber: 1, weight: 50, reps: 12 }],
          },
        ],
      },
    ];

    const exportedBuffer = exportXLSXWithFormatting(
      base64,
      sessions,
      exercises
    );
    const exportedWorkbook = XLSX.read(exportedBuffer, { type: "array" });
    const exportedSheet = exportedWorkbook.Sheets["Einheit"];

    const satz1RepsCell = exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 4 })];
    const satz1WeightCell =
      exportedSheet[XLSX.utils.encode_cell({ r: 7, c: 5 })];

    expect(satz1RepsCell?.v).toBe(12);
    expect(satz1WeightCell?.v).toBe(50);
  });
});
