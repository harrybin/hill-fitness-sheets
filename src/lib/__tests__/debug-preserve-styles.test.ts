import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import ExcelJS from "exceljs";
import { base64ToArrayBuffer } from "../utils";

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("Debug: Check if styles are preserved in memory", () => {
  it("should show style preservation through write cycle", async () => {
    // Load original
    const examplePath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");
    const buf = readFileSync(examplePath);
    const arrayBuffer = toArrayBuffer(buf);

    const wb1 = new ExcelJS.Workbook();
    await wb1.xlsx.load(arrayBuffer);

    const sheet1 = wb1.getWorksheet("Einheit 1-8 (10-12)");

    // Count styles before modification
    let styledBefore = 0;
    if (sheet1) {
      sheet1.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            cell.font ||
            cell.fill ||
            cell.border ||
            cell.alignment ||
            cell.numFmt
          ) {
            styledBefore++;
          }
        });
      });
    }

    console.log(`Styled cells BEFORE modification: ${styledBefore}`);

    // Modify a few cells (like export does)
    const setCellPreserveStyle = (
      sheet: ExcelJS.Worksheet,
      cellRef: string,
      newData: { t?: string; v?: any }
    ) => {
      const cell = sheet.getCell(cellRef);
      const existing = { ...cell };
      if (newData.v !== undefined) {
        cell.value = newData.v;
      }
      // Preserve style properties
      if (existing.font) cell.font = existing.font;
      if (existing.fill) cell.fill = existing.fill;
      if (existing.numFmt) cell.numFmt = existing.numFmt;
    };

    // Write to some cells (simulating exercise data writes)
    if (sheet1) {
      for (let row = 14; row < 40; row++) {
        for (let col = 5; col < 12; col++) {
          const cell = sheet1.getCell(row, col);
          setCellPreserveStyle(sheet1, cell.address, { t: "n", v: 10 });
        }
      }
    }

    // Count styles after modification
    let styledAfter = 0;
    if (sheet1) {
      sheet1.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            cell.font ||
            cell.fill ||
            cell.border ||
            cell.alignment ||
            cell.numFmt
          ) {
            styledAfter++;
          }
        });
      });
    }

    console.log(`Styled cells AFTER modification: ${styledAfter}`);

    // Write and read back
    const buffer = await wb1.xlsx.writeBuffer();

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer);

    const sheet2 = wb2.getWorksheet("Einheit 1-8 (10-12)");

    // Count styles after write-read
    let styledAfterWriteRead = 0;
    if (sheet2) {
      sheet2.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            cell.font ||
            cell.fill ||
            cell.border ||
            cell.alignment ||
            cell.numFmt
          ) {
            styledAfterWriteRead++;
          }
        });
      });
    }

    console.log(`Styled cells AFTER write-read: ${styledAfterWriteRead}`);

    // Sample a specific cell to see details
    const testCell = sheet2?.getCell("F14");
    console.log(
      `Sample cell F14:`,
      testCell
        ? {
            v: testCell.value,
            s: !!testCell.font,
            z: testCell.numFmt,
          }
        : "undefined"
    );

    const untouchedCell = sheet2?.getCell("E5");
    console.log(
      `Untouched cell E5:`,
      untouchedCell
        ? {
            v: untouchedCell.value,
            s: !!untouchedCell.font,
            z: untouchedCell.numFmt,
          }
        : "undefined"
    );
  });
});
