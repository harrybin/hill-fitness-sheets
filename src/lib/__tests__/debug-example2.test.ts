import { describe, it, expect } from "vitest";
import { parseXLSX } from "../xlsxImport";
import path from "path";
import fs from "fs";

describe("Debug Example2.xlsx Import", () => {
  it("should load Example2.xlsx and log all exercises", async () => {
    const examplePath = path.resolve(__dirname, "fixtures", "Example2.xlsx");
    const fileBuffer = fs.readFileSync(examplePath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    console.log("\n=== Example2.xlsx Import Debug ===");
    console.log(`Total exercises imported: ${parsed.exercises.length}`);
    console.log("\nExercises:");
    parsed.exercises.forEach((ex, idx) => {
      console.log(
        `  ${idx + 1}. ${ex.name} (ID: ${ex.id}, suggestedWeight: ${
          ex.suggestedWeight
        })`
      );
    });

    console.log(`\nTotal sessions: ${parsed.sessions.length}`);

    expect(parsed.exercises.length).toBeGreaterThan(0);
  });
});
