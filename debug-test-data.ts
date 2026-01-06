import * as XLSX from "xlsx";
import { createTestData } from "./src/lib/__tests__/test-data-builder.ts";

const data = createTestData({
  exerciseName: "Bankdrücken",
  einheiten: [
    {
      einheitNum: "1",
      satz1Reps: 12,
      satz1Weight: 50,
      satz2Reps: 10,
      satz2Weight: undefined,
    },
  ],
  dates: ["2024-01-15"],
});

// Log the data to see what's being generated
console.log("Generated test data:");
for (let i = 0; i < Math.min(15, data.length); i++) {
  const row = data[i];
  console.log(
    `Row ${i}:`,
    row
      .slice(0, 10)
      .map((cell) => {
        if (cell === "" || cell === undefined) return "-";
        return cell;
      })
      .join(" | ")
  );
}
