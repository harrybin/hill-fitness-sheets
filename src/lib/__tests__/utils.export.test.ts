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
  it("should create History sheet with correct structure", () => {
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

    // Should have History sheet
    expect(updatedWorkbook.SheetNames).toContain("History");

    const historySheet = updatedWorkbook.Sheets["History"];
    const historyData: any[][] = XLSX.utils.sheet_to_json(historySheet, {
      header: 1,
    });

    // Check headers
    expect(historyData[0]).toEqual([
      "Date",
      "Exercise",
      "Weight",
      "Reps",
      "Set",
    ]);

    // Check data rows
    expect(historyData[1]).toEqual(["2024-01-15", "Bankdrücken", 50, 12, 1]);
    expect(historyData[2]).toEqual(["2024-01-15", "Bankdrücken", 50, 10, 2]);
  });

  it("should sort sessions by date ascending", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [{ id: "ex1", name: "Test", order: 0 }];

    const sessions: Session[] = [
      {
        date: "2024-01-20",
        entries: [
          {
            id: "e3",
            exerciseId: "ex1",
            date: "2024-01-20",
            sets: [{ setNumber: 1, weight: 60, reps: 10 }],
          },
        ],
      },
      {
        date: "2024-01-10",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-10",
            sets: [{ setNumber: 1, weight: 50, reps: 12 }],
          },
        ],
      },
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e2",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [{ setNumber: 1, weight: 55, reps: 11 }],
          },
        ],
      },
    ];

    const updatedBase64 = updateXLSXWithSessions(base64, sessions, exercises);
    const updatedBuffer = base64ToArrayBuffer(updatedBase64);
    const updatedWorkbook = XLSX.read(updatedBuffer, { type: "array" });

    const historySheet = updatedWorkbook.Sheets["History"];
    const historyData: any[][] = XLSX.utils.sheet_to_json(historySheet, {
      header: 1,
    });

    // Dates should be in ascending order
    expect(historyData[1][0]).toBe("2024-01-10");
    expect(historyData[2][0]).toBe("2024-01-15");
    expect(historyData[3][0]).toBe("2024-01-20");
  });

  it("should sort sets by setNumber", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [{ id: "ex1", name: "Test", order: 0 }];

    const sessions: Session[] = [
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [
              { setNumber: 2, weight: 50, reps: 10 }, // Out of order
              { setNumber: 1, weight: 50, reps: 12 },
            ],
          },
        ],
      },
    ];

    const updatedBase64 = updateXLSXWithSessions(base64, sessions, exercises);
    const updatedBuffer = base64ToArrayBuffer(updatedBase64);
    const updatedWorkbook = XLSX.read(updatedBuffer, { type: "array" });

    const historySheet = updatedWorkbook.Sheets["History"];
    const historyData: any[][] = XLSX.utils.sheet_to_json(historySheet, {
      header: 1,
    });

    // Should be sorted by setNumber
    expect(historyData[1][4]).toBe(1); // Set column
    expect(historyData[2][4]).toBe(2);
  });

  it("should map exerciseId to exercise name", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "abc-123", name: "Bankdrücken", order: 0 },
      { id: "def-456", name: "Kniebeugen", order: 1 },
    ];

    const sessions: Session[] = [
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
            exerciseId: "abc-123",
            date: "2024-01-15",
            sets: [{ setNumber: 1, weight: 50, reps: 12 }],
          },
          {
            id: "e2",
            exerciseId: "def-456",
            date: "2024-01-15",
            sets: [{ setNumber: 1, weight: 80, reps: 15 }],
          },
        ],
      },
    ];

    const updatedBase64 = updateXLSXWithSessions(base64, sessions, exercises);
    const updatedBuffer = base64ToArrayBuffer(updatedBase64);
    const updatedWorkbook = XLSX.read(updatedBuffer, { type: "array" });

    const historySheet = updatedWorkbook.Sheets["History"];
    const historyData: any[][] = XLSX.utils.sheet_to_json(historySheet, {
      header: 1,
    });

    expect(historyData[1][1]).toBe("Bankdrücken");
    expect(historyData[2][1]).toBe("Kniebeugen");
  });

  it("should replace old History sheet if it exists", () => {
    const workbook = XLSX.utils.book_new();

    // Add existing History sheet
    const oldHistory = XLSX.utils.aoa_to_sheet([
      ["Date", "Exercise", "Weight", "Reps", "Set"],
      ["2024-01-01", "Old Exercise", 100, 5, 1],
    ]);
    XLSX.utils.book_append_sheet(workbook, oldHistory, "History");

    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "ex1", name: "New Exercise", order: 0 },
    ];

    const sessions: Session[] = [
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [{ setNumber: 1, weight: 50, reps: 12 }],
          },
        ],
      },
    ];

    const updatedBase64 = updateXLSXWithSessions(base64, sessions, exercises);
    const updatedBuffer = base64ToArrayBuffer(updatedBase64);
    const updatedWorkbook = XLSX.read(updatedBuffer, { type: "array" });

    const historySheet = updatedWorkbook.Sheets["History"];
    const historyData: any[][] = XLSX.utils.sheet_to_json(historySheet, {
      header: 1,
    });

    // Should only have new data, not old
    expect(historyData).toHaveLength(2); // Header + 1 data row
    expect(historyData[1][1]).toBe("New Exercise");
  });
});

describe("XLSX Export - exportXLSXWithFormatting", () => {
  it("should create Trainings sheet with correct headers", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Original");
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
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
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

    const exportedBuffer = exportXLSXWithFormatting(
      base64,
      sessions,
      exercises
    );
    const exportedWorkbook = XLSX.read(exportedBuffer, { type: "array" });

    expect(exportedWorkbook.SheetNames).toContain("Trainings");

    const trainingsSheet = exportedWorkbook.Sheets["Trainings"];
    const trainingsData: any[][] = XLSX.utils.sheet_to_json(trainingsSheet, {
      header: 1,
    });

    expect(trainingsData[0]).toEqual([
      "Datum",
      "Übung",
      "Satz 1 Gewicht (kg)",
      "Satz 1 Wiederholungen",
      "Satz 2 Gewicht (kg)",
      "Satz 2 Wiederholungen",
    ]);
  });

  it("should sort sessions by date descending", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Original");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [{ id: "ex1", name: "Test", order: 0 }];

    const sessions: Session[] = [
      {
        date: "2024-01-10",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-10",
            sets: [{ setNumber: 1, weight: 50, reps: 12 }],
          },
        ],
      },
      {
        date: "2024-01-20",
        entries: [
          {
            id: "e2",
            exerciseId: "ex1",
            date: "2024-01-20",
            sets: [{ setNumber: 1, weight: 60, reps: 10 }],
          },
        ],
      },
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e3",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [{ setNumber: 1, weight: 55, reps: 11 }],
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

    const trainingsSheet = exportedWorkbook.Sheets["Trainings"];
    const trainingsData: any[][] = XLSX.utils.sheet_to_json(trainingsSheet, {
      header: 1,
    });

    // Dates should be in descending order (newest first)
    expect(trainingsData[1][0]).toBe("2024-01-20");
    expect(trainingsData[2][0]).toBe("2024-01-15");
    expect(trainingsData[3][0]).toBe("2024-01-10");
  });

  it("should format one row per exercise per session", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Original");
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
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [
              { setNumber: 1, weight: 50, reps: 12 },
              { setNumber: 2, weight: 50, reps: 10 },
            ],
          },
          {
            id: "e2",
            exerciseId: "ex2",
            date: "2024-01-15",
            sets: [
              { setNumber: 1, weight: 80, reps: 15 },
              { setNumber: 2, weight: 80, reps: 12 },
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

    const trainingsSheet = exportedWorkbook.Sheets["Trainings"];
    const trainingsData: any[][] = XLSX.utils.sheet_to_json(trainingsSheet, {
      header: 1,
    });

    // Should have 2 data rows (one per exercise)
    expect(trainingsData).toHaveLength(3); // Header + 2 data rows

    expect(trainingsData[1]).toEqual([
      "2024-01-15",
      "Bankdrücken",
      50,
      12,
      50,
      10,
    ]);
    expect(trainingsData[2]).toEqual([
      "2024-01-15",
      "Kniebeugen",
      80,
      15,
      80,
      12,
    ]);
  });

  it("should handle skipped exercises with / markers", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Original");
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
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-15",
            sets: [],
            skipped: true,
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

    const trainingsSheet = exportedWorkbook.Sheets["Trainings"];
    const trainingsData: any[][] = XLSX.utils.sheet_to_json(trainingsSheet, {
      header: 1,
    });

    // Skipped exercise should have "/" for all values
    expect(trainingsData[1]).toEqual([
      "2024-01-15",
      "Bankdrücken",
      "/",
      "/",
      "/",
      "/",
    ]);
  });

  it("should preserve original sheets unchanged", () => {
    const workbook = XLSX.utils.book_new();
    const originalSheet = XLSX.utils.aoa_to_sheet([
      ["Original", "Data"],
      ["Row", "1"],
    ]);
    XLSX.utils.book_append_sheet(workbook, originalSheet, "Original");
    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [{ id: "ex1", name: "Test", order: 0 }];

    const sessions: Session[] = [
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-15",
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

    // Original sheet should still exist
    expect(exportedWorkbook.SheetNames).toContain("Original");

    const preservedSheet = exportedWorkbook.Sheets["Original"];
    const preservedData: any[][] = XLSX.utils.sheet_to_json(preservedSheet, {
      header: 1,
    });

    // Data should be unchanged
    expect(preservedData[0]).toEqual(["Original", "Data"]);
    expect(preservedData[1]).toEqual(["Row", "1"]);
  });

  it("should remove old Trainings sheet before creating new one", () => {
    const workbook = XLSX.utils.book_new();

    // Add old Trainings sheet
    const oldTrainings = XLSX.utils.aoa_to_sheet([
      ["Datum", "Übung"],
      ["2024-01-01", "Old Exercise"],
    ]);
    XLSX.utils.book_append_sheet(workbook, oldTrainings, "Trainings");

    const arrayBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const base64 = arrayBufferToBase64(arrayBuffer);

    const exercises: Exercise[] = [
      { id: "ex1", name: "New Exercise", order: 0 },
    ];

    const sessions: Session[] = [
      {
        date: "2024-01-15",
        entries: [
          {
            id: "e1",
            exerciseId: "ex1",
            date: "2024-01-15",
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

    const trainingsSheet = exportedWorkbook.Sheets["Trainings"];
    const trainingsData: any[][] = XLSX.utils.sheet_to_json(trainingsSheet, {
      header: 1,
    });

    // Should have new headers and data, not old
    expect(trainingsData[0]).toEqual([
      "Datum",
      "Übung",
      "Satz 1 Gewicht (kg)",
      "Satz 1 Wiederholungen",
      "Satz 2 Gewicht (kg)",
      "Satz 2 Wiederholungen",
    ]);
    expect(trainingsData[1][1]).toBe("New Exercise");
  });

  it("should return ArrayBuffer for download", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["Test"]]);
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

    expect(exportedBuffer).toBeInstanceOf(ArrayBuffer);
    expect(exportedBuffer.byteLength).toBeGreaterThan(0);
  });
});
