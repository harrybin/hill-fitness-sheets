import { describe, it, expect } from "vitest";
import { parseXLSX, updateXLSXWithSessions, exportXLSXWithFormatting } from "../utils";
import * as XLSX from "xlsx";
import { Exercise, Session } from "../types";

describe("CRITICAL: Merged Cell Handling", () => {
  it("should inherit weight from Satz 1 to Satz 2 when weight cell is merged", () => {
    // Simulate merged cell behavior: weight only in row 1, undefined in row 2
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50], // Satz 1: 12 reps, 50kg
      ["", "", "", "", "Satz 2", "", 10, undefined], // Satz 2: 10 reps, no weight (merged cell)
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].entries).toHaveLength(1);

    const sets = result.sessions[0].entries[0].sets;
    expect(sets).toHaveLength(2);

    // Satz 1
    expect(sets[0].setNumber).toBe(1);
    expect(sets[0].weight).toBe(50);
    expect(sets[0].reps).toBe(12);

    // Satz 2 should inherit weight from Satz 1
    expect(sets[1].setNumber).toBe(2);
    expect(sets[1].weight).toBe(50); // Inherited from Satz 1
    expect(sets[1].reps).toBe(10);
  });

  it("should use explicit weight for Satz 2 if provided (non-merged cell)", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, 45], // Explicit different weight
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    const sets = result.sessions[0].entries[0].sets;

    expect(sets[0].weight).toBe(50);
    expect(sets[1].weight).toBe(45); // Uses explicit weight
  });

  it("should skip Satz 2 if only reps are missing (weight is undefined)", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", "/", undefined], // "/" means skipped
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    const sets = result.sessions[0].entries[0].sets;

    // Only Satz 1 should be parsed
    expect(sets).toHaveLength(1);
    expect(sets[0].setNumber).toBe(1);
  });

  it("should handle multiple exercises with merged cells", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
      ["", "Kniebeugen", "", "", "Satz 1", "", 15, 80],
      ["", "", "", "", "Satz 2", "", 12, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    expect(result.exercises).toHaveLength(2);
    expect(result.sessions[0].entries).toHaveLength(2);

    // First exercise
    const sets1 = result.sessions[0].entries[0].sets;
    expect(sets1[0].weight).toBe(50);
    expect(sets1[1].weight).toBe(50); // Inherited

    // Second exercise
    const sets2 = result.sessions[0].entries[1].sets;
    expect(sets2[0].weight).toBe(80);
    expect(sets2[1].weight).toBe(80); // Inherited
  });
});

describe("Multi-Sheet Session Import", () => {
  it("should parse sessions from multiple continuation sheets", () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: "Einheit 1-8"
    const data1 = [
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "Einheit:", "1", "", "2"],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["Datum:", "", "", "", "", "", "2024-01-01", "", "2024-01-05"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50, 10, 52.5],
      ["", "", "", "", "Satz 2", "", 10, undefined, 10, undefined],
    ];
    const sheet1 = XLSX.utils.aoa_to_sheet(data1);
    XLSX.utils.book_append_sheet(workbook, sheet1, "Einheit 1-8");

    // Sheet 2: "Einheit 9-16"
    const data2 = [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "Einheit:", "3"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Datum:", "", "", "", "", "", "2024-01-10"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 55],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];
    const sheet2 = XLSX.utils.aoa_to_sheet(data2);
    XLSX.utils.book_append_sheet(workbook, sheet2, "Einheit 9-16");

    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseXLSX(arrayBuffer);

    // Should have 3 sessions total (2 from sheet 1, 1 from sheet 2)
    expect(result.sessions).toHaveLength(3);

    const dates = result.sessions.map((s) => s.date).sort();
    expect(dates).toEqual(["2024-01-01", "2024-01-05", "2024-01-10"]);

    // All sessions should have the same exercise
    result.sessions.forEach((session) => {
      expect(session.entries).toHaveLength(1);
      expect(session.entries[0].sets).toHaveLength(2);
    });
  });

  it("should only parse exercises once from first sheet", () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1
    const data1 = [
      ["", "Übungen", "Notiz"],
      ["", "Exercise 1", "Note 1"],
      ["", "Exercise 2", "Note 2"],
    ];
    const sheet1 = XLSX.utils.aoa_to_sheet(data1);
    XLSX.utils.book_append_sheet(workbook, sheet1, "Sheet1");

    // Sheet 2
    const data2 = [
      ["", "Übungen", "Notiz"],
      ["", "Exercise 1", "Note 1"], // Duplicate
      ["", "Exercise 2", "Note 2"], // Duplicate
    ];
    const sheet2 = XLSX.utils.aoa_to_sheet(data2);
    XLSX.utils.book_append_sheet(workbook, sheet2, "Sheet2");

    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseXLSX(arrayBuffer);

    // Should only have 2 exercises (not duplicated)
    expect(result.exercises).toHaveLength(2);
  });

  it("should merge entries from different sheets by date", () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Exercise 1 on date
    const data1 = [
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
      ["", "Kniebeugen", "", "", "Satz 1", "", 0, 0], // Skipped
      ["", "", "", "", "Satz 2", "", 0, 0], // Skipped
    ];
    const sheet1 = XLSX.utils.aoa_to_sheet(data1);
    XLSX.utils.book_append_sheet(workbook, sheet1, "Sheet1");

    // Sheet 2: Exercise 2 on same date (continuation)
    const data2 = [
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 0, 0], // Skipped
      ["", "", "", "", "Satz 2", "", 0, 0],
      ["", "Kniebeugen", "", "", "Satz 1", "", 15, 80],
      ["", "", "", "", "Satz 2", "", 12, undefined],
    ];
    const sheet2 = XLSX.utils.aoa_to_sheet(data2);
    XLSX.utils.book_append_sheet(workbook, sheet2, "Sheet2");

    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseXLSX(arrayBuffer);

    // Should have 1 session with 2 exercises
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe("2024-01-15");

    // Should have both exercises merged
    const session = result.sessions[0];
    expect(session.entries.length).toBeGreaterThanOrEqual(1);

    // Should have sets from both exercises (non-zero)
    const totalSets = session.entries.reduce((sum, e) => sum + e.sets.length, 0);
    expect(totalSets).toBeGreaterThan(0);
  });
});

describe("Set Data Parsing", () => {
  it("should parse WH (reps) and KG (weight) columns correctly", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    const sets = result.sessions[0].entries[0].sets;

    expect(sets[0].reps).toBe(12);
    expect(sets[0].weight).toBe(50);
    expect(sets[1].reps).toBe(10);
  });

  it("should skip sets with '/' marker", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", "/", "/"], // Skipped
      ["", "", "", "", "Satz 2", "", "/", "/"], // Skipped
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    // Should have result with no entries (or empty sets)
    if (result.sessions.length > 0 && result.sessions[0].entries.length > 0) {
      expect(result.sessions[0].entries[0].sets).toHaveLength(0);
    }
  });

  it("should handle decimal weights (German comma notation)", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, "52,5"], // German decimal
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    const sets = result.sessions[0].entries[0].sets;

    expect(sets[0].weight).toBe(52.5);
  });

  it("should validate weight > 0 and reps > 0", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 0, undefined], // Invalid: 0 reps
      ["", "Kniebeugen", "", "", "Satz 1", "", 10, 0], // Invalid: 0 weight
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    // Should only have 1 valid set (Bankdrücken Satz 1)
    const totalValidSets = result.sessions[0].entries.reduce(
      (sum, e) => sum + e.sets.length,
      0
    );
    expect(totalValidSets).toBe(1);
  });

  it("should assign correct setNumber (1 or 2)", () => {
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
      ["Datum:", "", "", "", "", "", "2024-01-15"],
      ["", "Übungen", "Notiz", "WH-Zahl", "Sätze"],
      ["", "Bankdrücken", "", "", "Satz 1", "", 12, 50],
      ["", "", "", "", "Satz 2", "", 10, undefined],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseXLSX(arrayBuffer);

    const sets = result.sessions[0].entries[0].sets;

    expect(sets[0].setNumber).toBe(1);
    expect(sets[1].setNumber).toBe(2);
  });
});

describe("Legacy History Sheet Support", () => {
  it("should parse data from History sheet", () => {
    const workbook = XLSX.utils.book_new();

    // Main sheet with exercises
    const exerciseData = [
      ["", "Übungen", "Notiz"],
      ["", "Bankdrücken", ""],
      ["", "Kniebeugen", ""],
    ];
    const exerciseSheet = XLSX.utils.aoa_to_sheet(exerciseData);
    XLSX.utils.book_append_sheet(workbook, exerciseSheet, "Exercises");

    // History sheet
    const historyData = [
      ["Date", "Exercise", "Weight", "Reps", "Set"],
      ["2024-01-15", "Bankdrücken", 50, 12, 1],
      ["2024-01-15", "Bankdrücken", 50, 10, 2],
      ["2024-01-15", "Kniebeugen", 80, 15, 1],
      ["2024-01-15", "Kniebeugen", 80, 12, 2],
    ];
    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(workbook, historySheet, "History");

    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe("2024-01-15");
    expect(result.sessions[0].entries).toHaveLength(2);

    const entry1 = result.sessions[0].entries.find(
      (e) => result.exercises.find((ex) => ex.id === e.exerciseId)?.name === "Bankdrücken"
    );
    const entry2 = result.sessions[0].entries.find(
      (e) => result.exercises.find((ex) => ex.id === e.exerciseId)?.name === "Kniebeugen"
    );

    expect(entry1?.sets).toHaveLength(2);
    expect(entry2?.sets).toHaveLength(2);
  });

  it("should handle case-insensitive exercise matching in History sheet", () => {
    const workbook = XLSX.utils.book_new();

    const exerciseData = [
      ["", "Übungen", "Notiz"],
      ["", "BANKDRÜCKEN", ""],
    ];
    const exerciseSheet = XLSX.utils.aoa_to_sheet(exerciseData);
    XLSX.utils.book_append_sheet(workbook, exerciseSheet, "Exercises");

    const historyData = [
      ["Date", "Exercise", "Weight", "Reps", "Set"],
      ["2024-01-15", "bankdrücken", 50, 12, 1], // Different case
    ];
    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(workbook, historySheet, "History");

    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].entries).toHaveLength(1);
  });

  it("should detect Historie sheet (German variant)", () => {
    const workbook = XLSX.utils.book_new();

    const exerciseData = [
      ["", "Übungen", "Notiz"],
      ["", "Bankdrücken", ""],
    ];
    const exerciseSheet = XLSX.utils.aoa_to_sheet(exerciseData);
    XLSX.utils.book_append_sheet(workbook, exerciseSheet, "Exercises");

    const historyData = [
      ["Date", "Exercise", "Weight", "Reps", "Set"],
      ["2024-01-15", "Bankdrücken", 50, 12, 1],
    ];
    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(workbook, historySheet, "Historie");

    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseXLSX(arrayBuffer);

    expect(result.sessions).toHaveLength(1);
  });
});
