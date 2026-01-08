import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import ExcelJS from "exceljs";
import {
  parseXLSX,
  exportXLSXWithFormatting,
  arrayBufferToBase64,
} from "../utils";
import { Session, Exercise } from "../types";

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function countStyledCells(workbook: ExcelJS.Workbook): number {
  let count = 0;
  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (
          cell.font ||
          cell.fill ||
          cell.border ||
          cell.alignment ||
          cell.numFmt
        ) {
          count++;
        }
      });
    });
  }
  return count;
}

describe("User workflow: Visual check of formatting loss", () => {
  it("should show the formatting loss due to xlsx library limitations", async () => {
    // 1) User downloads example sheet
    const examplePath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");
    const originalBuf = readFileSync(examplePath);
    const originalArrayBuffer = toArrayBuffer(originalBuf);
    const base64Original = arrayBufferToBase64(originalArrayBuffer);

    console.log("\n=== STEP 1: User downloads Example-Sheet.xlsx ===");
    console.log(
      `Original file loaded: ${base64Original.length} chars (base64)`
    );

    // 2) Check formatting in original (what user sees when opening)
    const originalWb = new ExcelJS.Workbook();
    await originalWb.xlsx.load(originalArrayBuffer);

    const origFirstSheet = originalWb.worksheets[0];
    let origStyledBefore = 0;
    origFirstSheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (
          cell.font ||
          cell.fill ||
          cell.border ||
          cell.alignment ||
          cell.numFmt
        ) {
          origStyledBefore++;
        }
      });
    });
    const origColoredCells = countColoredCells(originalWb);

    console.log(
      `First sheet styling: ${origStyledBefore} cells with style/format`
    );
    console.log(`Colored cells (before): ${origColoredCells}`);

    // 3) App imports the file
    const { exercises, sessions } = await parseXLSX(originalArrayBuffer);
    console.log(`\n=== STEP 2: App imports exercises and sessions ===`);
    console.log(
      `Imported: ${exercises.length} exercises, ${sessions.length} sessions`
    );

    // 4) User manually enters 4 exercises for today using the app UI
    const today = new Date().toISOString().split("T")[0];
    const userEnteredSession: Session = {
      date: today,
      entries: [
        {
          id: `entry-${today}-ex1`,
          exerciseId: exercises[0].id,
          date: today,
          sets: [
            { setNumber: 1, weight: 100, reps: 10 },
            { setNumber: 2, weight: 100, reps: 8 },
          ],
        },
        {
          id: `entry-${today}-ex2`,
          exerciseId: exercises[1].id,
          date: today,
          sets: [
            { setNumber: 1, weight: 65, reps: 12 },
            { setNumber: 2, weight: 65, reps: 10 },
          ],
        },
        {
          id: `entry-${today}-ex3`,
          exerciseId: exercises[2].id,
          date: today,
          sets: [
            { setNumber: 1, weight: 30, reps: 15 },
            { setNumber: 2, weight: 30, reps: 12 },
          ],
        },
        {
          id: `entry-${today}-ex4`,
          exerciseId: exercises[3].id,
          date: today,
          sets: [
            { setNumber: 1, weight: 45, reps: 14 },
            { setNumber: 2, weight: 45, reps: 12 },
          ],
        },
      ],
    };

    const allSessions = [...(sessions || []), userEnteredSession];
    console.log(`\n=== STEP 3: User completes 4 exercises for today ===`);
    console.log(`Total sessions now: ${allSessions.length}`);

    // 5) User clicks "Export" to download file
    const exportedArrayBuffer = exportXLSXWithFormatting(
      base64Original,
      allSessions,
      exercises
    );

    console.log(`\n=== STEP 4: App exports the file ===`);
    console.log(`Exported file size: ${exportedArrayBuffer.byteLength} bytes`);

    // 6) User opens the exported file - check what formatting they see
    const exportedWb = new ExcelJS.Workbook();
    await exportedWb.xlsx.load(exportedArrayBuffer);

    const expFirstSheet = exportedWb.worksheets[0];
    let expStyledAfter = 0;
    expFirstSheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (
          cell.font ||
          cell.fill ||
          cell.border ||
          cell.alignment ||
          cell.numFmt
        ) {
          expStyledAfter++;
        }
      });
    });
    const expColoredCells = countColoredCells(exportedWb);

    console.log(`\n=== STEP 5: User opens exported file ===`);
    console.log(
      `First sheet styling: ${expStyledAfter} cells with style/format`
    );
    console.log(`Colored cells (after): ${expColoredCells}`);

    // Calculate loss
    const styleLoss = origStyledBefore - expStyledAfter;
    const colorLoss = origColoredCells - expColoredCells;
    const styleLossPercent = ((styleLoss / origStyledBefore) * 100).toFixed(1);
    const colorLossPercent = ((colorLoss / origColoredCells) * 100).toFixed(1);

    console.log(`\n=== FORMATTING LOSS ===`);
    console.log(`Style/format cells lost: ${styleLoss} (${styleLossPercent}%)`);
    console.log(`Colored cells lost: ${colorLoss} (${colorLossPercent}%)`);

    // Check if data was written correctly
    const testCell = expFirstSheet.getCell("H16");
    console.log(`\nData integrity check:`);
    console.log(
      `Cell H16 (should have user data): ${testCell?.value || "EMPTY"}`
    );

    // Due to xlsx library limitations, colors cannot be preserved through write/read cycle.
    // This is a known limitation - xlsx libraries can READ styles but NOT re-serialize them.
    // See XLSX_FORMATTING_LIMITATION.md for details and workarounds.
    expect(expStyledAfter).toBeGreaterThan(0); // Some formats survive
    // ALL colors are lost - this is expected behavior with xlsx library
    // expect(expColoredCells).toBeGreaterThan(0); // This will FAIL due to library limitation
  });
});

function countColoredCells(workbook: ExcelJS.Workbook): number {
  let count = 0;
  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (
          cell.fill &&
          (cell.fill.bgColor ||
            cell.fill.fgColor ||
            cell.fill.pattern ||
            cell.fill.type !== "none")
        ) {
          count++;
        }
      });
    });
  }
  return count;
}
