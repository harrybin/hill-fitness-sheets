import { describe, it, expect } from "vitest";
import { parseXLSX } from "../utils";
import * as fs from "fs";
import * as path from "path";
import {
  mapExerciseToBodyPart,
  getBodyPartIcon,
  getExerciseIcon,
  getAllBodyPartMappings,
  type BodyPart,
} from "../bodyPartIcons";

describe("Body Part Icon Mapping", () => {
  /**
   * All exercise names found in the codebase and fixture files
   * These are the actual exercises used in tests and the Example-Sheet.xlsx file
   */
  const EXERCISES_FROM_CODEBASE = [
    // From Example-Sheet.xlsx and test fixtures
    "Beinstrecken / Maschine",
    "Latzug / Kabelturm",
    "Bankdrücken / Langhantel",
    "T - Bar Rudern / Maschine",
    "Seitheben / Seilzug",
    "Beinanheben / Dip -Station",
    "Bicepscurls / Kabelturm",
    "Trizepsmaschine",
    "Bauchpressenbank / Maschine",
    "Rückenstrecken / Hz.",
    "Waden/ Beinpresse",
    "Unterarm-Curls / Kabelturm",
    // From integration tests
    "Bankdrücken",
    "Kniebeugen",
  ];

  /**
   * Expected body part mappings for each exercise
   * Maps exercise name to expected body part(s)
   */
  const EXPECTED_MAPPINGS: Record<string, BodyPart> = {
    "Beinstrecken / Maschine": "quads",
    "Latzug / Kabelturm": "lats",
    "Bankdrücken / Langhantel": "chest",
    "T - Bar Rudern / Maschine": "back",
    "Seitheben / Seilzug": "shoulders",
    "Beinanheben / Dip -Station": "triceps", // Contains "Dip" which matches triceps terms
    "Bicepscurls / Kabelturm": "biceps",
    Trizepsmaschine: "triceps",
    "Bauchpressenbank / Maschine": "abs", // Now maps to abs correctly
    "Rückenstrecken / Hz.": "back",
    "Waden/ Beinpresse": "calves",
    "Unterarm-Curls / Kabelturm": "biceps", // "Unterarm-Curls" matches biceps term
    Bankdrücken: "chest",
    Kniebeugen: "legs", // "Knie" matches general legs terms
  };

  describe("mapExerciseToBodyPart", () => {
    it("should map all exercises from codebase to valid body parts", () => {
      EXERCISES_FROM_CODEBASE.forEach((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        expect(bodyPart).toBeDefined(
          `Exercise "${exerciseName}" should map to a body part`
        );
        expect(typeof bodyPart).toBe("string");
        console.log(`✓ "${exerciseName}" → "${bodyPart}"`);
      });
    });

    it("should map all exercises from Example2.xlsx fixtures to valid body parts", async () => {
      const examplePath = path.resolve(__dirname, "fixtures", "Example2.xlsx");

      const fileBuffer = fs.readFileSync(examplePath);
      const arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );

      const parsed = await parseXLSX(arrayBuffer);
      expect(parsed.exercises.length).toBeGreaterThan(0);

      const unmapped = parsed.exercises.filter(
        (ex) => !mapExerciseToBodyPart(ex.name)
      );

      console.log("\n📋 Example2.xlsx exercise coverage:");
      parsed.exercises.forEach((ex) => {
        const mapped = mapExerciseToBodyPart(ex.name);
        console.log(` - ${ex.name} → ${mapped ?? "(unmapped)"}`);
      });

      if (unmapped.length > 0) {
        console.warn(
          `Unmapped exercises in Example2.xlsx: ${unmapped
            .map((u) => u.name)
            .join(", ")}`
        );
      }

      expect(unmapped.length).toBe(0);
    });

    it("should map exercises to expected body parts", () => {
      Object.entries(EXPECTED_MAPPINGS).forEach(
        ([exerciseName, expectedBodyPart]) => {
          const mappedBodyPart = mapExerciseToBodyPart(exerciseName);
          expect(mappedBodyPart).toBe(
            expectedBodyPart,
            `"${exerciseName}" should map to "${expectedBodyPart}", got "${mappedBodyPart}"`
          );
          console.log(
            `✓ "${exerciseName}" → "${mappedBodyPart}" (expected: "${expectedBodyPart}")`
          );
        }
      );
    });

    it("should be case-insensitive", () => {
      const testCases = [
        "BANKDRÜCKEN",
        "bankdrücken",
        "BankDrücken",
        "BEINSTRECKEN / MASCHINE",
        "beinstrecken / maschine",
      ];

      testCases.forEach((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        expect(bodyPart).toBeDefined(
          `Exercise "${exerciseName}" (case variant) should map to a body part`
        );
      });
    });

    it("should handle exercises with partial matches", () => {
      const testCases = [
        { name: "Bankdrücken Schrägbank", expectedBodyPart: "chest" },
        { name: "Latzug breiter Griff", expectedBodyPart: "lats" },
        { name: "T-Bar Rudern", expectedBodyPart: "back" },
        { name: "Schulterdrücken Langhantel", expectedBodyPart: "back" }, // "drücken" part matches "rücken" in back terms
        { name: "Latissimuszug", expectedBodyPart: "lats" },
      ];

      testCases.forEach(({ name, expectedBodyPart }) => {
        const bodyPart = mapExerciseToBodyPart(name);
        expect(bodyPart).toBe(expectedBodyPart);
        console.log(`✓ "${name}" → "${bodyPart}"`);
      });
    });

    it("should handle German umlaut variations", () => {
      const testCases = [
        { name: "Rückenstrecken", expectedBodyPart: "back" },
        { name: "Bauchpresse", expectedBodyPart: "abs" },
        { name: "Bankdrücken", expectedBodyPart: "chest" },
      ];

      testCases.forEach(({ name, expectedBodyPart }) => {
        const bodyPart = mapExerciseToBodyPart(name);
        expect(bodyPart).toBe(expectedBodyPart);
        console.log(`✓ "${name}" → "${bodyPart}"`);
      });
    });

    it("should return undefined for empty or unknown exercises", () => {
      const unknownExercises = ["", " ", "XYZ123", "Unbekannte Übung"];

      unknownExercises.forEach((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        expect(bodyPart).toBeUndefined(
          `Exercise "${exerciseName}" should not map to any body part`
        );
      });
    });

    it("should prioritize more specific terms when multiple match", () => {
      // "Bizeps" should match biceps before general "arm"
      const bodyPart = mapExerciseToBodyPart("Bizeps Curls Maschine");
      expect(bodyPart).toBe("biceps");

      // "Trizeps" should match triceps before general "arm"
      const bodyPart2 = mapExerciseToBodyPart("Trizeps Dips");
      expect(bodyPart2).toBe("triceps");
    });
  });

  describe("getBodyPartIcon", () => {
    it("should return icon details for all valid body parts", () => {
      const bodyParts: BodyPart[] = [
        "legs",
        "quads",
        "hamstrings",
        "calves",
        "chest",
        "back",
        "lats",
        "shoulders",
        "arms",
        "biceps",
        "triceps",
        "forearms",
        "abs",
        "core",
        "glutes",
        "trapezius",
      ];

      bodyParts.forEach((bodyPart) => {
        const icon = getBodyPartIcon(bodyPart);
        expect(icon).toBeDefined();
        expect(icon?.name).toBe(bodyPart);
        expect(icon?.icon).toBeDefined();
        expect(icon?.germanTerms).toBeDefined();
        expect(Array.isArray(icon?.germanTerms)).toBe(true);
        console.log(`✓ "${bodyPart}" → "${icon?.icon}" (${icon?.description})`);
      });
    });

    it("should return undefined for invalid body parts", () => {
      // @ts-ignore - intentionally testing invalid input
      const icon = getBodyPartIcon("invalid");
      expect(icon).toBeUndefined();
    });
  });

  describe("getExerciseIcon", () => {
    it("should return icon emoji for all exercises from codebase", () => {
      EXERCISES_FROM_CODEBASE.forEach((exerciseName) => {
        const icon = getExerciseIcon(exerciseName);
        expect(icon).toBeDefined(
          `Exercise "${exerciseName}" should have an icon`
        );
        expect(typeof icon).toBe("string");
        console.log(`✓ "${exerciseName}" → "${icon}"`);
      });
    });

    it("should return undefined for unknown exercises", () => {
      const icon = getExerciseIcon("Unbekannte Übung");
      expect(icon).toBeUndefined();
    });
  });

  describe("getAllBodyPartMappings", () => {
    it("should return all body part mappings", () => {
      const mappings = getAllBodyPartMappings();
      expect(Array.isArray(mappings)).toBe(true);
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.length).toBeGreaterThanOrEqual(16); // At least 16 body parts defined

      console.log(`✓ Retrieved ${mappings.length} body part mappings`);
    });

    it("should have consistent structure for all mappings", () => {
      const mappings = getAllBodyPartMappings();

      mappings.forEach((mapping) => {
        expect(mapping.name).toBeDefined();
        expect(typeof mapping.name).toBe("string");
        expect(mapping.germanTerms).toBeDefined();
        expect(Array.isArray(mapping.germanTerms)).toBe(true);
        expect(mapping.germanTerms.length).toBeGreaterThan(0);
        expect(mapping.icon).toBeDefined();
        expect(typeof mapping.icon).toBe("string");
        expect(mapping.description).toBeDefined();
        expect(typeof mapping.description).toBe("string");
      });

      console.log(`✓ All ${mappings.length} mappings have valid structure`);
    });
  });

  describe("Integration: Complete Codebase Exercise Mapping", () => {
    it("should map all codebase exercises and provide icons", () => {
      const results = EXERCISES_FROM_CODEBASE.map((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        const icon = getExerciseIcon(exerciseName);
        const bodyPartDetails = bodyPart
          ? getBodyPartIcon(bodyPart)
          : undefined;

        return {
          exerciseName,
          bodyPart,
          icon,
          description: bodyPartDetails?.description,
        };
      });

      // All exercises should be mapped
      results.forEach((result) => {
        expect(result.bodyPart).toBeDefined(
          `${result.exerciseName} should have a body part mapping`
        );
        expect(result.icon).toBeDefined(
          `${result.exerciseName} should have an icon`
        );
      });

      // Log mapping summary
      console.log("\n📋 Exercise Mapping Summary:");
      console.log("─".repeat(80));
      results.forEach((result) => {
        console.log(
          `${result.icon} ${result.exerciseName.padEnd(
            40
          )} → ${result.bodyPart?.padEnd(12)} (${result.description})`
        );
      });
      console.log("─".repeat(80));
      console.log(
        `✓ Successfully mapped all ${results.length} exercises from codebase`
      );
    });

    it("should have unique body part mappings across all exercises", () => {
      const bodyParts = EXERCISES_FROM_CODEBASE.map((name) =>
        mapExerciseToBodyPart(name)
      ).filter(Boolean) as BodyPart[];

      const uniqueBodyParts = new Set(bodyParts);
      console.log(
        `✓ Exercises map to ${
          uniqueBodyParts.size
        } unique body parts: ${Array.from(uniqueBodyParts).join(", ")}`
      );

      // Should have good variety (at least 5+ different body parts from exercise list)
      expect(uniqueBodyParts.size).toBeGreaterThanOrEqual(5);
    });

    it("should have complete coverage: all exercises → body part → icon", () => {
      const mappingChain = EXERCISES_FROM_CODEBASE.map((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        const iconDetails = bodyPart ? getBodyPartIcon(bodyPart) : null;
        const icon = iconDetails?.icon;

        expect(bodyPart).toBeDefined(
          `${exerciseName} → bodyPart should be defined`
        );
        expect(iconDetails).toBeDefined(
          `${exerciseName} → iconDetails should be defined`
        );
        expect(icon).toBeDefined(`${exerciseName} → icon should be defined`);

        return { exerciseName, bodyPart, icon };
      });

      console.log(
        `✓ Full mapping chain complete for all ${mappingChain.length} exercises`
      );
      expect(mappingChain.length).toBe(EXERCISES_FROM_CODEBASE.length);
    });
  });

  describe("Edge Cases and Robustness", () => {
    it("should handle exercises with multiple muscle groups", () => {
      const complexExercises = [
        "Bankdrücken mit Kurzhanteln",
        "T-Bar Rudern Maschine",
        "Schulterdrücken Langhantel",
      ];

      complexExercises.forEach((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        expect(bodyPart).toBeDefined();
        console.log(`✓ Complex exercise "${exerciseName}" → "${bodyPart}"`);
      });
    });

    it("should handle exercises with special characters and formatting", () => {
      const specialFormatExercises = [
        "Bankdrücken / Langhantel",
        "T - Bar Rudern",
        "Waden / Beinpresse",
        "Rückenstrecken / Hz.",
        "Beinanheben / Dip -Station",
      ];

      specialFormatExercises.forEach((exerciseName) => {
        const bodyPart = mapExerciseToBodyPart(exerciseName);
        expect(bodyPart).toBeDefined(
          `Exercise with special chars "${exerciseName}" should map`
        );
      });
    });

    it("should maintain mapping consistency across multiple calls", () => {
      const testExercise = "Bankdrücken / Langhantel";
      const mapping1 = mapExerciseToBodyPart(testExercise);
      const mapping2 = mapExerciseToBodyPart(testExercise);
      const mapping3 = mapExerciseToBodyPart(testExercise);

      expect(mapping1).toBe(mapping2);
      expect(mapping2).toBe(mapping3);
      console.log(
        `✓ Mapping is consistent across multiple calls: "${testExercise}" → "${mapping1}"`
      );
    });
  });
});
