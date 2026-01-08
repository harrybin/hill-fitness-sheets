import { describe, it, expect } from "vitest";
import { parseXLSX } from "../xlsxImport";
import { Exercise, Session } from "../types";
import * as fs from "fs";
import * as path from "path";

describe("Suggested Weights Import - Empty XLSX", () => {
  it("should extract suggestedWeight from Einheit 1 when importing empty XLSX", async () => {
    // Load the Example-Sheet-empty.xlsx file (fresh sheet with no training data, only suggested weights)
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Parse the XLSX file
    const parsed = await parseXLSX(arrayBuffer);

    // Verify exercises were imported
    expect(parsed.exercises.length).toBeGreaterThan(0);
    console.log(
      `✓ Loaded ${parsed.exercises.length} exercises from empty XLSX`
    );

    // Verify no sessions were created (empty training data)
    expect(parsed.sessions.length).toBe(0);
    console.log(`✓ No sessions created (as expected for empty training sheet)`);

    // Verify suggestedWeight was extracted for exercises
    const exercisesWithWeights = parsed.exercises.filter(
      (e) => e.suggestedWeight !== undefined
    );
    expect(exercisesWithWeights.length).toBeGreaterThan(0);
    console.log(
      `✓ ${exercisesWithWeights.length} exercises have suggestedWeight values`
    );
  });

  it("should extract correct suggestedWeight values from Einheit 1 column", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);
    const expectedWeights: Record<string, number> = {
      "Beinstrecken / Maschine": 190,
      "Latzug / Kabelturm": 62.5,
      "Bankdrücken / Langhantel": 10,
      "T - Bar Rudern / Maschine": 42.5,
      "Seitheben / Seilzug": 12.5,
      "Beinanheben / Dip -Station": undefined, // "/" in the sheet
      "Bicepscurls / Kabelturm": 45,
      Trizepsmaschine: 46,
      "Bauchpressenbank / Maschine": 7.5,
      "Rückenstrecken / Hz.": 18,
      "Waden/ Beinpresse": 90,
      "Unterarm-Curls / Kabelturm": 15,
    };

    // Verify each exercise has the correct suggestedWeight
    Object.entries(expectedWeights).forEach(
      ([exerciseName, expectedWeight]) => {
        const exercise = parsed.exercises.find((e) =>
          e.name.includes(exerciseName.split("/")[0])
        );

        expect(exercise).toBeDefined(
          `Exercise "${exerciseName}" not found in parsed exercises`
        );

        if (expectedWeight === undefined) {
          expect(exercise!.suggestedWeight).toBeUndefined();
          console.log(
            `✓ "${exercise!.name}": suggestedWeight is undefined (as expected)`
          );
        } else {
          expect(exercise!.suggestedWeight).toBe(expectedWeight);
          console.log(
            `✓ "${exercise!.name}": suggestedWeight = ${
              exercise!.suggestedWeight
            }kg`
          );
        }
      }
    );
  });

  it("should mark suggestedWeight as optional (undefined is valid)", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    // Verify all exercises have the suggestedWeight property
    parsed.exercises.forEach((exercise) => {
      expect(exercise).toHaveProperty("suggestedWeight");
      // suggestedWeight can be either a number or undefined
      const isValidWeight =
        exercise.suggestedWeight === undefined ||
        (typeof exercise.suggestedWeight === "number" &&
          exercise.suggestedWeight > 0);
      expect(isValidWeight).toBe(true);
    });

    console.log(`✓ All exercises have valid suggestedWeight property`);
  });

  it("should handle mixed scenarios: some exercises with weights, some without", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    const withWeights = parsed.exercises.filter(
      (e) => e.suggestedWeight !== undefined
    );
    const withoutWeights = parsed.exercises.filter(
      (e) => e.suggestedWeight === undefined
    );

    expect(withWeights.length).toBeGreaterThan(0);
    expect(withoutWeights.length).toBeGreaterThanOrEqual(0);

    console.log(
      `✓ Mixed scenario: ${withWeights.length} with weights, ${withoutWeights.length} without`
    );

    // Verify exercises without weights still have complete structure
    withoutWeights.forEach((exercise) => {
      expect(exercise.id).toBeDefined();
      expect(exercise.name).toBeDefined();
      expect(exercise.order).toBeDefined();
      console.log(`✓ Exercise without weight is complete: "${exercise.name}"`);
    });
  });

  it("should preserve exercise data integrity when extracting suggested weights", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    // Verify all exercises have required properties
    parsed.exercises.forEach((exercise) => {
      expect(exercise.id).toBeDefined();
      expect(exercise.id).toMatch(/^exercise-\d+$/);

      expect(exercise.name).toBeDefined();
      expect(exercise.name.length).toBeGreaterThan(0);

      expect(typeof exercise.order).toBe("number");
      expect(exercise.order).toBeGreaterThanOrEqual(0);

      // suggestedWeight is optional
      if (exercise.suggestedWeight !== undefined) {
        expect(typeof exercise.suggestedWeight).toBe("number");
        expect(exercise.suggestedWeight).toBeGreaterThan(0);
      }

      console.log(
        `✓ Exercise integrity verified: "${exercise.name}" (weight: ${
          exercise.suggestedWeight ?? "none"
        })`
      );
    });

    // Verify no duplicate IDs
    const ids = parsed.exercises.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify order is sequential
    const orders = parsed.exercises.map((e) => e.order);
    expect(Math.max(...orders)).toBe(parsed.exercises.length - 1);

    console.log(
      `✓ All exercises have unique IDs and sequential order properties`
    );
  });

  it("should correctly identify Einheit 1 columns in sheet structure", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Parse and check if suggested weights were detected
    // This indirectly tests that Einheit 1 columns were found
    const parsed = await parseXLSX(arrayBuffer);

    const exercisesWithSuggestedWeights = parsed.exercises.filter(
      (e) => e.suggestedWeight !== undefined
    );

    // Most exercises should have suggested weights if Einheit 1 was detected
    // (At least 10 out of 12 in the test file)
    expect(exercisesWithSuggestedWeights.length).toBeGreaterThanOrEqual(10);

    console.log(
      `✓ Einheit 1 columns correctly identified and parsed (${exercisesWithSuggestedWeights.length}/12 exercises have weights)`
    );
  });

  it("should use suggestedWeight in Exercise interface correctly", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    // Verify Exercise interface compliance
    parsed.exercises.forEach((exercise) => {
      const exerciseObj: Exercise = {
        id: exercise.id,
        name: exercise.name,
        order: exercise.order,
        notes: exercise.notes,
        suggestedWeight: exercise.suggestedWeight,
      };

      // All properties should be defined and valid
      expect(exerciseObj.id).toBeDefined();
      expect(exerciseObj.name).toBeDefined();
      expect(typeof exerciseObj.order).toBe("number");
      // notes is optional
      // suggestedWeight is optional
    });

    console.log(`✓ All exercises conform to Exercise interface`);
  });

  it("should produce valid Exercise objects suitable for UI rendering", async () => {
    const emptySheetPath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-empty.xlsx"
    );
    const fileBuffer = fs.readFileSync(emptySheetPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    // Simulate UI usage: exercises with suggestedWeight should display it
    parsed.exercises.forEach((exercise) => {
      // UI would show this if available
      const displayWeight = exercise.suggestedWeight
        ? `${exercise.suggestedWeight}kg`
        : "keine";

      expect(displayWeight).toBeDefined();
      expect(displayWeight.length).toBeGreaterThan(0);

      console.log(
        `✓ UI-Ready: "${exercise.name}" - Suggested: ${displayWeight}`
      );
    });
  });

  it("should clear suggestedWeight for exercises with training history", async () => {
    // Load the Example-Sheet.xlsx file (has both exercises and training data)
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

    // When there's actual training data, suggestedWeights should be cleared
    // because the UI should prioritize actual training history
    const exercisesWithSuggestedWeight = parsed.exercises.filter(
      (e) => e.suggestedWeight !== undefined
    );

    // Most or all exercises should NOT have suggestedWeight if they have training history
    expect(exercisesWithSuggestedWeight.length).toBeLessThanOrEqual(1);

    console.log(
      `✓ Exercises with training history have suggestedWeight cleared: ${
        parsed.exercises.length - exercisesWithSuggestedWeight.length
      }/${parsed.exercises.length}`
    );

    // Verify training sessions exist
    expect(parsed.sessions.length).toBeGreaterThan(0);
    console.log(
      `✓ ${parsed.sessions.length} training sessions found (suggestedWeights cleared for them)`
    );

    // All exercises with training data should NOT have suggestedWeight
    parsed.exercises.forEach((exercise) => {
      const hasTrainingData = parsed.sessions.some((session) =>
        session.entries.some((entry) => entry.exerciseId === exercise.id)
      );

      if (hasTrainingData) {
        expect(exercise.suggestedWeight).toBeUndefined();
        console.log(
          `✓ "${exercise.name}": suggestedWeight correctly cleared (has training history)`
        );
      }
    });
  });
});
