import { describe, it, expect } from "vitest";
import { parseXLSX } from "../utils";
import { Exercise, Session, TrainingEntry } from "../types";
import * as fs from "fs";
import * as path from "path";

describe("Example-Sheet.xlsx - Complete Data Integrity", () => {
  it("should parse Example-Sheet.xlsx and verify exercises are loaded correctly", async () => {
    // Load the Example-Sheet.xlsx file
    const exampleSheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet.xlsx"
    );
    const fileBuffer = fs.readFileSync(exampleSheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Parse the XLSX file
    const parsed = await parseXLSX(arrayBuffer);

    // Expected exercises based on the image
    const expectedExercises = [
      { name: "Beinstrecken / Maschine", id: "exercise-12" },
      { name: "Latzug / Kabelturm", id: "exercise-14" },
      { name: "Bankdrücken / Langhantel", id: "exercise-16" },
      { name: "T - Bar Rudern / Maschine", id: "exercise-18" },
      { name: "Seitheben / Seilzug", id: "exercise-20" },
      { name: "Beinanheben / Dip -Station", id: "exercise-22" },
      { name: "Bicepscurls / Kabelturm", id: "exercise-24" },
      { name: "Trizepsmaschine", id: "exercise-26" },
      { name: "Bauchpressenbank / Maschine", id: "exercise-28" },
      { name: "Rückenstrecken / Hz.", id: "exercise-30" },
      { name: "Waden/ Beinpresse", id: "exercise-32" },
      { name: "Unterarm-Curls / Kabelturm", id: "exercise-34" },
    ];

    // Verify exercises are loaded
    expect(parsed.exercises.length).toBe(expectedExercises.length);
    console.log(
      `✓ Loaded ${parsed.exercises.length} exercises from Example-Sheet.xlsx`
    );

    // Verify all exercises exist with correct IDs
    expectedExercises.forEach((expectedExercise) => {
      const found = parsed.exercises.find(
        (ex) => ex.id === expectedExercise.id
      );
      expect(found).toBeDefined();
      expect(found!.name).toContain(expectedExercise.name.split("/")[0]);
      console.log(`✓ Exercise found: ${found?.name}`);
    });
  });

  it("should parse Example-Sheet.xlsx sessions and match predefined data exactly", async () => {
    // Load the Example-Sheet.xlsx file
    const exampleSheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet.xlsx"
    );
    const fileBuffer = fs.readFileSync(exampleSheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Parse the XLSX file
    const parsed = await parseXLSX(arrayBuffer);

    // Debug file write removed

    // Define expected sessions array based on ACTUAL DATA READ FROM EXCEL
    // Einheit 1 (2025-11-18) - read directly from cells
    // Col 6=WH (Wiederholungen), Col 7=KG (Gewicht)
    const expectedSessions: Session[] = [
      {
        date: "2025-11-18",
        entries: [
          {
            id: "entry-2025-11-18-exercise-12",
            exerciseId: "exercise-12",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 190, reps: 10 }, // Beinstrecken - only Satz 1
            ],
          },
          {
            id: "entry-2025-11-18-exercise-14",
            exerciseId: "exercise-14",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 62.5, reps: 10 }, // Latzug
              { setNumber: 2, weight: 62.5, reps: 10 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-16",
            exerciseId: "exercise-16",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 10, reps: 12 }, // Bankdrücken
              { setNumber: 2, weight: 10, reps: 13 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-18",
            exerciseId: "exercise-18",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 42.5, reps: 12 }, // T-Bar
              { setNumber: 2, weight: 42.5, reps: 10 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-20",
            exerciseId: "exercise-20",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 12.5, reps: 12 }, // Seitheben
              { setNumber: 2, weight: 12.5, reps: 12 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-22",
            exerciseId: "exercise-22",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 0, reps: 15 }, // Beinanheben - "/" becomes 0
              { setNumber: 2, weight: 0, reps: 15 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-24",
            exerciseId: "exercise-24",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 45, reps: 12 }, // Biceps
              { setNumber: 2, weight: 45, reps: 10 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-26",
            exerciseId: "exercise-26",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 46, reps: 12 }, // Trizeps
              { setNumber: 2, weight: 46, reps: 10 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-28",
            exerciseId: "exercise-28",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 7.5, reps: 15 }, // Bauch
              { setNumber: 2, weight: 7.5, reps: 17 },
            ],
          },
          // exercise-30 (Rückenstrecken) is skipped - WH="/"
          {
            id: "entry-2025-11-18-exercise-32",
            exerciseId: "exercise-32",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 90, reps: 15 }, // Waden
              { setNumber: 2, weight: 90, reps: 15 },
            ],
          },
          {
            id: "entry-2025-11-18-exercise-34",
            exerciseId: "exercise-34",
            date: "2025-11-18",
            sets: [
              { setNumber: 1, weight: 15, reps: 12 }, // Unterarm
              { setNumber: 2, weight: 15, reps: 12 },
            ],
          },
        ],
      },
    ];

    // Verify session exists
    const session = parsed.sessions.find((s) => s.date === "2025-11-18");
    expect(session).toBeDefined();

    const expectedSession = expectedSessions[0];
    const parsedSession = session!;

    // Debug: log parsed session
    console.log(
      "Parsed session entries:",
      parsedSession.entries.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.length,
      }))
    );
    console.log(
      "Expected entries:",
      expectedSession.entries.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.length,
      }))
    );

    // Verify session date
    expect(parsedSession.date).toBe(expectedSession.date);

    // Verify each entry and set
    expectedSession.entries.forEach((expectedEntry) => {
      const parsedEntry = parsedSession.entries.find(
        (e) => e.exerciseId === expectedEntry.exerciseId
      );

      expect(parsedEntry).toBeDefined(
        `Exercise ${expectedEntry.exerciseId} not found in parsed session`
      );

      expect(parsedEntry!.sets.length).toBe(
        expectedEntry.sets.length,
        `${expectedEntry.exerciseId}: wrong number of sets`
      );

      expectedEntry.sets.forEach((expectedSet, setIdx) => {
        const parsedSet = parsedEntry!.sets[setIdx];

        expect(parsedSet.setNumber).toBe(expectedSet.setNumber);
        expect(parsedSet.weight).toBe(
          expectedSet.weight,
          `${expectedEntry.exerciseId} Set ${setIdx + 1}: weight should be ${
            expectedSet.weight
          }kg, got ${parsedSet.weight}kg`
        );
        expect(parsedSet.reps).toBe(
          expectedSet.reps,
          `${expectedEntry.exerciseId} Set ${setIdx + 1}: reps should be ${
            expectedSet.reps
          }, got ${parsedSet.reps}`
        );

        console.log(
          `✓ ${expectedEntry.exerciseId} Set ${parsedSet.setNumber}: ${parsedSet.weight}kg x ${parsedSet.reps} reps`
        );
      });
    });

    console.log(
      `\n✓ All session data from predefined array verified! (${expectedSession.entries.length} exercises)`
    );
  });

  it("should maintain data integrity when parsing and comparing all sessions", async () => {
    const exampleSheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet.xlsx"
    );
    const fileBuffer = fs.readFileSync(exampleSheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    // Verify basic structure
    expect(parsed.exercises).toBeDefined();
    expect(parsed.exercises.length).toBeGreaterThan(0);
    expect(parsed.sessions).toBeDefined();
    expect(parsed.sessions.length).toBeGreaterThan(0);

    console.log(`✓ Parsed structure is valid`);
    console.log(`  - Exercises: ${parsed.exercises.length}`);
    console.log(`  - Sessions: ${parsed.sessions.length}`);

    // Verify each session has valid entries
    parsed.sessions.forEach((session) => {
      expect(session.date).toBeDefined();
      expect(session.entries).toBeDefined();
      expect(Array.isArray(session.entries)).toBe(true);

      // Verify each entry has valid structure
      session.entries.forEach((entry) => {
        expect(entry.exerciseId).toBeDefined();
        expect(entry.date).toBe(session.date);
        expect(Array.isArray(entry.sets)).toBe(true);

        // Verify each set has valid structure
        entry.sets.forEach((set) => {
          expect(set.setNumber).toBeGreaterThan(0);
          expect(typeof set.weight).toBe("number");
          expect(typeof set.reps).toBe("number");
        });
      });
    });

    console.log(
      `✓ All ${parsed.sessions.length} sessions have valid structure`
    );

    // Verify exercise references are valid
    parsed.sessions.forEach((session) => {
      session.entries.forEach((entry) => {
        const exercise = parsed.exercises.find(
          (e) => e.id === entry.exerciseId
        );
        expect(exercise).toBeDefined();
      });
    });

    console.log(
      `✓ All exercise references in sessions are valid and resolvable`
    );
  });
});
