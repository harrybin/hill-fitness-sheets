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
import ExcelJS from "exceljs";
import { Exercise, Session } from "../types";

describe("XLSX Export - updateXLSXWithSessions", () => {
  it("should not create History sheet", async () => {
    // Create a minimal workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");
    sheet.addRow(["Test"]);
    const arrayBuffer = await workbook.xlsx.writeBuffer();
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
    const updatedWorkbook = new ExcelJS.Workbook();
    await updatedWorkbook.xlsx.load(updatedBuffer);

    // Should NOT create History sheet
    const sheetNames = updatedWorkbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).not.toContain("History");
    // Should keep original sheets
    expect(sheetNames).toContain("Sheet1");
  });
});

describe("XLSX Export - exportXLSXWithFormatting", () => {
  it("should fill Einheit columns with session data", async () => {
    // Create sheet data:
    // Cols 0-4: Exercise metadata (Nr, Übung, Notiz, WH-Zahl, Sätze)
    // Cols 5-6: Einheit 1 (WH, KG)
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Einheit 1");

    // Add rows
    sheet.addRow(["Metadata1"]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow(["", "", "", "", "Einheit:", 1]); // Row 4
    sheet.addRow(["Nr.", "Übungen", "Notiz", "WH-Zahl", "WH", "KG"]); // Headers Row 5
    sheet.addRow(["Datum:", "", "", "", 45000]); // Row 6
    sheet.addRow(["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"]); // Row 7
    sheet.addRow([1, "Bankdrücken", "", "10-12", "Satz: 1"]); // Row 8: Ex1 Satz1
    sheet.addRow(["", "", "", "", "Satz: 2"]); // Row 9: Ex1 Satz2

    const arrayBuffer = await workbook.xlsx.writeBuffer();
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
    const exportedWorkbook = new ExcelJS.Workbook();
    await exportedWorkbook.xlsx.load(exportedBuffer);
    const exportedSheet = exportedWorkbook.getWorksheet("Einheit 1");

    // Exercise 1 data is at rows 8-9, cols 5-6 (WH-KG)
    const satz1RepsCell = exportedSheet?.getCell(8, 5);
    const satz1WeightCell = exportedSheet?.getCell(8, 6);
    const satz2RepsCell = exportedSheet?.getCell(9, 5);
    const satz2WeightCell = exportedSheet?.getCell(9, 6);

    expect(satz1RepsCell?.value).toBe(12);
    expect(satz1WeightCell?.value).toBe(50);
    expect(satz2RepsCell?.value).toBe(10);
    expect(satz2WeightCell?.value).toBe(50);
  });
  it("should handle multiple Einheit columns", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Einheiten");

    // Add rows
    sheet.addRow(["Metadata"]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow(["", "", "", "", "Einheit:", "", "Einheit:"]); // Cols 5, 7: Einheit headers
    sheet.addRow([
      "Nr.",
      "Übungen",
      "Notiz",
      "WH-Zahl",
      "WH",
      "KG",
      "WH",
      "KG",
    ]); // Col labels
    sheet.addRow(["Datum:", "", "", "", 45000, "", 45005]); // Cols 5, 7: dates
    sheet.addRow(["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"]); // Real headers
    sheet.addRow([1, "Bankdrücken", "", "10-12", "Satz: 1"]); // Row 8: Ex1 Satz1
    sheet.addRow(["", "", "", "", "Satz: 2"]); // Row 9: Ex1 Satz2

    const arrayBuffer = await workbook.xlsx.writeBuffer();
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
    const exportedWorkbook = new ExcelJS.Workbook();
    await exportedWorkbook.xlsx.load(exportedBuffer);
    const exportedSheet = exportedWorkbook.getWorksheet("Einheiten");

    // First Einheit (cols 5-6, rows 8-9)
    const ein1Satz1RepsCell = exportedSheet?.getCell(8, 5);
    const ein1Satz1WeightCell = exportedSheet?.getCell(8, 6);
    expect(ein1Satz1RepsCell?.value).toBe(12);
    expect(ein1Satz1WeightCell?.value).toBe(50);

    // Second Einheit (cols 7-8, rows 8-9)
    const ein2Satz1RepsCell = exportedSheet?.getCell(8, 7);
    const ein2Satz1WeightCell = exportedSheet?.getCell(8, 8);
    expect(ein2Satz1RepsCell?.value).toBe(11);
    expect(ein2Satz1WeightCell?.value).toBe(55);
  });

  it("should not create new sheets", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Original");

    // Add rows
    sheet.addRow(["Metadata"]);
    sheet.addRow(["Einheit:", ""]);
    sheet.addRow(["WH", "KG"]);
    sheet.addRow(["Datum:", 45000]);
    sheet.addRow(["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"]);
    sheet.addRow([1, "Test", "", "10-12", "Satz: 1"]);
    sheet.addRow(["", "", "", "", "Satz: 2"]);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [{ id: "ex1", name: "Test", order: 0 }];
    const sessions: Session[] = [];

    const exportedBuffer = exportXLSXWithFormatting(
      base64,
      sessions,
      exercises
    );
    const exportedWorkbook = new ExcelJS.Workbook();
    await exportedWorkbook.xlsx.load(exportedBuffer);

    const sheetNames = exportedWorkbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).not.toContain("Trainings");
    expect(sheetNames).toContain("Original");
  });

  it("should handle sheets without Einheit columns gracefully", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("NoEinheit");
    sheet.addRow(["Simple", "Sheet"]);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [];
    const sessions: Session[] = [];

    expect(() => {
      exportXLSXWithFormatting(base64, sessions, exercises);
    }).not.toThrow();
  });

  it("should handle exercises with only Satz 1", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Einheit");

    // Add rows
    sheet.addRow(["Metadata"]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow(["", "", "", "", "Einheit:", ""]); // Col 5: Einheit header
    sheet.addRow(["Nr.", "Übungen", "Notiz", "WH-Zahl", "WH", "KG"]); // Headers
    sheet.addRow(["Datum:", "", "", "", 45000]); // Col 5: Date
    sheet.addRow(["Nr.", "Übungen", "Notiz", "WH-Zahl", "Sätze:"]); // Real headers
    sheet.addRow([1, "Bankdrücken", "", "10-12", "Satz: 1"]); // Row 8: Ex1 Satz1
    sheet.addRow(["", "", "", "", "Satz: 2"]); // Row 9: Ex1 Satz2

    const arrayBuffer = await workbook.xlsx.writeBuffer();
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
    const exportedWorkbook = new ExcelJS.Workbook();
    await exportedWorkbook.xlsx.load(exportedBuffer);
    const exportedSheet = exportedWorkbook.getWorksheet("Einheit");

    const satz1RepsCell = exportedSheet?.getCell(8, 5);
    const satz1WeightCell = exportedSheet?.getCell(8, 6);

    expect(satz1RepsCell?.value).toBe(12);
    expect(satz1WeightCell?.value).toBe(50);
  });
});
