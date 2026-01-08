import { describe, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import ExcelJS from "exceljs";

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("Debug: Inspect color cell serialization", () => {
  it("should show why colors are lost", async () => {
    const examplePath = resolve(__dirname, "fixtures", "Example-Sheet.xlsx");
    const buf = readFileSync(examplePath);
    const arrayBuffer = toArrayBuffer(buf);

    const wb1 = new ExcelJS.Workbook();
    await wb1.xlsx.load(arrayBuffer);

    const sheet1 = wb1.worksheets[0];

    // Find a colored cell
    let coloredCell: ExcelJS.Cell | null = null;
    let coloredCellRef: string = "";
    sheet1.eachRow((row) => {
      row.eachCell((cell) => {
        if (
          cell.fill &&
          (cell.fill.bgColor ||
            cell.fill.fgColor ||
            cell.fill.pattern !== "none")
        ) {
          coloredCell = cell;
          coloredCellRef = cell.address;
        }
      });
    });

    if (coloredCell) {
      console.log(`\nFound colored cell: ${coloredCellRef}`);
      console.log(`Cell value:`, coloredCell.value);
      console.log(`Cell fill:`, JSON.stringify(coloredCell.fill, null, 2));
      console.log(`Cell font:`, JSON.stringify(coloredCell.font, null, 2));
    }

    // Write and read back
    const buffer = await wb1.xlsx.writeBuffer();

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer);

    const sheet2 = wb2.worksheets[0];
    const readBackCell = sheet2.getCell(coloredCellRef);

    console.log(`\nAfter write-read:`);
    console.log(`Cell exists: ${!!readBackCell}`);
    if (readBackCell) {
      console.log(`Cell value:`, readBackCell.value);
      console.log(`Cell fill:`, JSON.stringify(readBackCell.fill, null, 2));
      console.log(`Cell font:`, JSON.stringify(readBackCell.font, null, 2));
      console.log(
        `Fill preserved: ${
          JSON.stringify(readBackCell.fill) !== JSON.stringify({ type: "none" })
        }`
      );
    }
  });
});
