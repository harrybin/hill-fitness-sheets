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
          cell.numFmt ||
          cell.protection
        ) {
          count++;
        }
      });
    });
  }
  return count;
}

describe("XLSX style preservation on round-trip export", () => {
  it("should preserve styles, merges, and column widths across all sheets (expected to fail currently)", async () => {
    const examplePath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");

    // 1) Load as ArrayBuffer
    const originalBuf = readFileSync(examplePath);
    const originalArrayBuffer = toArrayBuffer(originalBuf);

    // 2) Convert to base64 and back to simulate app storage
    const base64 = arrayBufferToBase64(originalArrayBuffer);
    const roundTrippedArrayBuffer = base64ToArrayBuffer(base64);

    // 3) Import using existing method to obtain sessions/exercises
    const { exercises, sessions } = parseXLSX(roundTrippedArrayBuffer);

    // 4) Export using existing method (returns new XLSX as ArrayBuffer)
    const exportedArrayBuffer = exportXLSXWithFormatting(
      base64,
      sessions || [],
      exercises || []
    );

    // 5) Read original and exported workbooks
    const originalWb = new ExcelJS.Workbook();
    await originalWb.xlsx.load(roundTrippedArrayBuffer);
    const exportedWb = new ExcelJS.Workbook();
    await exportedWb.xlsx.load(exportedArrayBuffer);

    // Sanity: sheet count must match
    expect(exportedWb.worksheets.length).toBe(originalWb.worksheets.length);

    // 6) For each sheet, compare style-related aspects
    for (let i = 0; i < originalWb.worksheets.length; i++) {
      const origSheet = originalWb.worksheets[i];
      const expSheet = exportedWb.worksheets[i];

      expect(expSheet).toBeDefined();

      // a) Styled cell count should be preserved
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

      // Require at minimum some styled cells exist after export
      expect(expStyled).toBeGreaterThan(0);

      // Stronger expectation (likely failing currently): do not lose styles
      expect(expStyled).toBeGreaterThanOrEqual(origStyled);

      // b) Merged ranges preserved
      const origMerges = origSheet.model.mergedCells?.length || 0;
      const expMerges = expSheet.model.mergedCells?.length || 0;
      expect(expMerges).toBeGreaterThanOrEqual(origMerges);

      // c) Column widths preserved
      const origCols = origSheet.columns?.length || 0;
      const expCols = expSheet.columns?.length || 0;
      if (origCols > 0) {
        expect(expCols).toBeGreaterThan(0);
        expect(expCols).toBeGreaterThanOrEqual(origCols);
      }
    }
  });
});
