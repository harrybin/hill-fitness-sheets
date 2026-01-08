import { readFileSync } from "fs";
import { resolve } from "path";
import ExcelJS from "exceljs";

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// Load original file
const examplePath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");
const originalBuf = readFileSync(examplePath);
const originalArrayBuffer = toArrayBuffer(originalBuf);

const wb = new ExcelJS.Workbook();
await wb.xlsx.load(originalArrayBuffer);

const sheet = wb.getWorksheet("Einheit 1-8 (10-12)");

// Sample some cells to see what styles look like
console.log("\n=== Sampling cell styles ===");
const cellsToCheck = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1"];
cellsToCheck.forEach((ref) => {
  const cell = sheet?.getCell(ref);
  if (cell?.value) {
    console.log(`${ref}:`, {
      value: cell.value,
      font: cell.font,
      fill: cell.fill,
      numFmt: cell.numFmt,
    });
  }
});

console.log("\n=== Checking data rows ===");
if (sheet) {
  for (let row = 14; row < 20; row++) {
    for (let col = 5; col < 10; col++) {
      const cell = sheet.getCell(row, col);
      if (cell?.value) {
        console.log(`${cell.address}:`, {
          value: cell.value,
          hasFont: !!cell.font,
          hasFormat: !!cell.numFmt,
        });
      }
    }
  }
}

console.log("\n=== Workbook metadata ===");
console.log("Worksheets:", wb.worksheets.length);
console.log("Theme colors:", (wb as any).theme?.colors?.length || 0);

console.log("\n=== Sheet themes ===");
const sheetTheme = (sheet?.model as any)?.theme;
console.log("Has sheet theme:", !!sheetTheme);

// Count cells with different style properties
let cellsWithFont = 0,
  cellsWithFill = 0,
  cellsWithBoth = 0;
if (sheet) {
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.font) cellsWithFont++;
      if (cell.fill) cellsWithFill++;
      if (cell.font && cell.fill) cellsWithBoth++;
    });
  });
}

console.log("\nStyle distribution:");
console.log(`Cells with font: ${cellsWithFont}`);
console.log(`Cells with fill: ${cellsWithFill}`);
console.log(`Cells with both: ${cellsWithBoth}`);
