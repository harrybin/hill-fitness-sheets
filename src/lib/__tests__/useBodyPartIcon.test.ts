import { describe, it, expect } from "vitest";
import { useBodyPartIcon, getBodyPartColor } from "../useBodyPartIcon";
import { mapExerciseToBodyPart } from "../bodyPartIcons";

describe("useBodyPartIcon Hook and Components", () => {
  describe("useBodyPartIcon", () => {
    it("should return body part details for valid exercise names", () => {
      const testExercises = [
        "Bankdrücken",
        "Kniebeugen",
        "Latzug / Kabelturm",
        "Trizepsmaschine",
      ];

      testExercises.forEach((exerciseName) => {
        const result = useBodyPartIcon(exerciseName);
        expect(result.bodyPart).toBeDefined();
        expect(result.icon).toBeDefined();
        expect(result.description).toBeDefined();
        expect(result.component).toBeDefined();
        console.log(
          `✓ "${exerciseName}" → "${result.bodyPart}" (${result.description})`
        );
      });
    });

    it("should have all required properties in hook return", () => {
      const result = useBodyPartIcon("Bankdrücken");

      expect(result).toHaveProperty("bodyPart");
      expect(result).toHaveProperty("icon");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("component");

      expect(typeof result.bodyPart).toBe("string");
      expect(typeof result.icon).toBe("string");
      expect(typeof result.description).toBe("string");
      console.log("✓ All required properties present");
    });

    it("should handle unknown exercise names gracefully", () => {
      const result = useBodyPartIcon("Unbekannte Übung");
      expect(result.bodyPart).toBeUndefined();
      expect(result.icon).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.component).toBeDefined();
      console.log("✓ Unknown exercise handled gracefully");
    });
  });

  describe("getBodyPartColor", () => {
    it("should return appropriate colors for all body parts", () => {
      const bodyPartsWithExpectedColors = [
        // Legs - blue
        { bodyPart: "legs", expectedColor: "text-blue-600" },
        { bodyPart: "quads", expectedColor: "text-blue-600" },
        { bodyPart: "calves", expectedColor: "text-blue-600" },
        // Upper Body - orange
        { bodyPart: "chest", expectedColor: "text-orange-600" },
        { bodyPart: "back", expectedColor: "text-orange-600" },
        { bodyPart: "lats", expectedColor: "text-orange-600" },
        // Arms - red
        { bodyPart: "arms", expectedColor: "text-red-600" },
        { bodyPart: "biceps", expectedColor: "text-red-600" },
        { bodyPart: "triceps", expectedColor: "text-red-600" },
        // Core - yellow
        { bodyPart: "abs", expectedColor: "text-yellow-600" },
        { bodyPart: "core", expectedColor: "text-yellow-600" },
      ];

      bodyPartsWithExpectedColors.forEach(({ bodyPart, expectedColor }) => {
        const color = getBodyPartColor(bodyPart);
        expect(color).toBe(expectedColor);
        console.log(`✓ "${bodyPart}" → "${color}"`);
      });
    });

    it("should return gray for unknown body parts", () => {
      const color = getBodyPartColor("unknown");
      expect(color).toBe("text-gray-500");

      const undefinedColor = getBodyPartColor(undefined);
      expect(undefinedColor).toBe("text-gray-500");
      console.log("✓ Unknown body parts return gray color");
    });

    it("should have consistent color grouping", () => {
      // Verify that related body parts have same color
      expect(getBodyPartColor("legs")).toBe(getBodyPartColor("quads"));
      expect(getBodyPartColor("chest")).toBe(getBodyPartColor("back"));
      expect(getBodyPartColor("biceps")).toBe(getBodyPartColor("triceps"));
      expect(getBodyPartColor("abs")).toBe(getBodyPartColor("core"));
      console.log("✓ Related body parts have consistent colors");
    });
  });

  describe("Integration with bodyPartIcons", () => {
    it("should work with all exercises from codebase", () => {
      const exercises = [
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
      ];

      const results = exercises.map((exercise) => {
        const hookResult = useBodyPartIcon(exercise);
        const directMapping = mapExerciseToBodyPart(exercise);

        // Verify consistency between hook and direct mapping
        expect(hookResult.bodyPart).toBe(directMapping);

        return {
          exercise,
          bodyPart: hookResult.bodyPart,
          color: getBodyPartColor(hookResult.bodyPart),
          description: hookResult.description,
        };
      });

      console.log("\n📋 Full Integration Summary:");
      console.log("─".repeat(80));
      results.forEach((result) => {
        console.log(
          `${result.exercise.padEnd(40)} → ${result.bodyPart?.padEnd(12)} [${
            result.color
          }] (${result.description})`
        );
      });
      console.log("─".repeat(80));
      console.log(`✓ Integration verified for ${results.length} exercises`);
    });
  });
});
