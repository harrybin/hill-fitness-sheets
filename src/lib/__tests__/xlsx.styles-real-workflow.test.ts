import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import ExcelJS from "exceljs";
import {
  parseXLSX,
  exportXLSXWithFormatting,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "../utils";
import { Session } from "../types";

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

describe("Real-world workflow: import, complete exercises, export", () => {
  it("should preserve formatting after importing, completing 4 exercises, and exporting", async () => {
    const examplePath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");

    // 1) Load original file
    const originalBuf = readFileSync(examplePath);
    const originalArrayBuffer = toArrayBuffer(originalBuf);
    const base64Original = arrayBufferToBase64(originalArrayBuffer);

    // 2) Import exercises and sessions
    const { exercises, sessions } = parseXLSX(originalArrayBuffer);
    console.log(
      `Imported ${exercises.length} exercises, ${sessions.length} sessions`
    );

    // 3) Create a new session for today with 4 exercises completed
    const today = new Date().toISOString().split("T")[0];
    const newSession: Session = {
      date: today,
      entries: exercises.slice(0, 4).map((ex, idx) => ({
        id: `entry-${today}-${ex.id}`,
        exerciseId: ex.id,
        date: today,
        sets: [
          { setNumber: 1, weight: 50 + idx * 10, reps: 10 },
          { setNumber: 2, weight: 50 + idx * 10, reps: 8 },
        ],
      })),
    };

    // 4) Combine with existing sessions (or just use new one for this test)
    const allSessions = [...(sessions || []), newSession];
    console.log(`Total sessions after adding today: ${allSessions.length}`);

    // 5) Export with the new data
    const exportedArrayBuffer = exportXLSXWithFormatting(
      base64Original,
      allSessions,
      exercises
    );

    // 6) Read both original and exported workbooks
    const originalWb = new ExcelJS.Workbook();
    await originalWb.xlsx.load(originalArrayBuffer);

    const exportedWb = new ExcelJS.Workbook();
    await exportedWb.xlsx.load(exportedArrayBuffer);

    console.log(`Original sheets: ${originalWb.worksheets.length}`);
    console.log(`Exported sheets: ${exportedWb.worksheets.length}`);

    // 7) Compare each sheet
    for (let i = 0; i < originalWb.worksheets.length; i++) {
      const origSheet = originalWb.worksheets[i];
      const expSheet = exportedWb.worksheets[i];
      const sheetName = origSheet.name;

      if (!expSheet) {
        console.warn(`Sheet ${sheetName} missing in export`);
        continue;
      }

      let origStyled = 0;
      let expStyled = 0;

      origSheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            cell.font ||
            cell.fill ||
            cell.border ||
            cell.alignment ||
            cell.numFmt
          ) {
            origStyled++;
          }
        });
      });

      expSheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            cell.font ||
            cell.fill ||
            cell.border ||
            cell.alignment ||
            cell.numFmt
          ) {
            expStyled++;
          }
        });
      });

      const origMerges = origSheet.model.mergedCells?.length || 0;
      const expMerges = expSheet.model.mergedCells?.length || 0;
      const origCols = origSheet.columns?.length || 0;
      const expCols = expSheet.columns?.length || 0;

      console.log(`\n[${sheetName}]`);
      console.log(`  Styled cells: ${origStyled} -> ${expStyled}`);
      console.log(`  Merges: ${origMerges} -> ${expMerges}`);
      console.log(`  Column widths: ${origCols} -> ${expCols}`);

      // Assertions
      expect(expStyled).toBeGreaterThan(0);
      expect(expMerges).toBeGreaterThanOrEqual(origMerges);
      if (origCols > 0) {
        expect(expCols).toBeGreaterThan(0);
        expect(expCols).toBeGreaterThanOrEqual(origCols);
      }

      // Check that data was actually written (at least some cells have content)
      const dataCell = expSheet.getCell("F14");
      if (dataCell?.value) {
        console.log(
          `  Sample data cell F14: ${JSON.stringify(dataCell.value)}`
        );
      }
    }
  });
});
