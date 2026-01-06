import * as XLSX from "xlsx";
import { Exercise, Session } from "./types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";

function parseExcelDate(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(trimmed)) {
      const parts = trimmed.split(".");
      let year = parts[2];
      if (year.length === 2) {
        year = "20" + year;
      }
      const month = parts[1].padStart(2, "0");
      const day = parts[0].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
      const parts = trimmed.split("/");
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      let year = parts[2];
      if (year.length === 2) {
        year = "20" + year;
      }
      return `${year}-${month}-${day}`;
    }
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    return null;
  }

  return null;
}

export function updateXLSXWithSessions(
  base64Data: string,
  sessions: Session[],
  exercises: Exercise[]
): string {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Apply date formatting to all Einheit date cells in all sheets
    // This ensures dates display as formatted dates (dd.mm.yyyy) not raw numbers
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      // Iterate through all cells looking for Einheit headers
      for (const cellRef in sheet) {
        const cell = sheet[cellRef];
        if (!cell || typeof cell.v !== "string") continue;

        // Check if this cell contains "Einheit:" followed by a number
        const cellStr = String(cell.v).toLowerCase();
        if (cellStr.includes("einheit") && !cellStr.includes("wiederholung")) {
          // This is an Einheit header cell - the value in the next cell is the date
          // Get the column and row, then find the date value below the header
          const match = cellRef.match(/([A-Z]+)(\d+)/);
          if (match) {
            const colLetter = match[1];
            const rowNum = parseInt(match[2], 10);

            // The date should be in the row below the "Einheit:" label
            const dateRowRef = colLetter + (rowNum + 1);
            const dateCell = sheet[dateRowRef];

            if (dateCell && typeof dateCell.v === "number") {
              // Apply German date format to this cell
              dateCell.z = "dd.mm.yyyy";
            }
          }
        }
      }
    });

    const historySheetName = "App-Data";
    if (workbook.SheetNames.includes(historySheetName)) {
      delete workbook.Sheets[historySheetName];
      workbook.SheetNames = workbook.SheetNames.filter(
        (name) => name !== historySheetName
      );
    }

    const historyData: any[][] = [
      ["Date", "Exercise", "Weight", "Reps", "Set"],
    ];

    const sortedSessions = [...sessions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    sortedSessions.forEach((session) => {
      session.entries.forEach((entry) => {
        const exercise = exercises.find((ex) => ex.id === entry.exerciseId);
        if (!exercise) return;

        const sortedSets = [...entry.sets].sort(
          (a, b) => a.setNumber - b.setNumber
        );

        sortedSets.forEach((set) => {
          historyData.push([
            session.date,
            exercise.name,
            set.weight,
            set.reps,
            set.setNumber,
          ]);
        });
      });
    });

    const newSheet = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(workbook, newSheet, historySheetName);

    const updatedBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    return arrayBufferToBase64(updatedBuffer);
  } catch (error) {
    console.error("Error updating XLSX:", error);
    return base64Data;
  }
}

export function exportXLSXWithFormatting(
  base64Data: string,
  sessions: Session[],
  exercises: Exercise[]
): ArrayBuffer {
  try {
    console.log("[exportXLSXWithFormatting] Starting export with:", {
      sessionsCount: sessions.length,
      exercisesCount: exercises.length,
      sessionDates: sessions.map((s) => s.date),
    });

    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const workbook = XLSX.read(arrayBuffer, { type: "array", bookVBA: true });

    console.log(
      "[exportXLSXWithFormatting] Workbook sheets:",
      workbook.SheetNames
    );

    // Remove old "History" sheet if it exists (we now use "App-Data")
    if (workbook.SheetNames.includes("History")) {
      delete workbook.Sheets["History"];
      workbook.SheetNames = workbook.SheetNames.filter(
        (name) => name !== "History"
      );
      console.log("[exportXLSXWithFormatting] Removed legacy 'History' sheet");
    }

    // Process each sheet to fill Einheit columns with session data
    workbook.SheetNames.forEach((sheetName) => {
      console.log(`[exportXLSXWithFormatting] Processing sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.log(
          `[exportXLSXWithFormatting] Sheet ${sheetName} not found, skipping`
        );
        return;
      }

      // Get raw data to understand sheet structure
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName} has ${data.length} rows`
      );

      // Find exercise start row
      let startIndex = 0;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const secondCell = String(row?.[1] ?? "")
          .toLowerCase()
          .trim();
        const normalizedSecondCell = secondCell
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (
          normalizedSecondCell === "ubungen" ||
          normalizedSecondCell === "exercises" ||
          normalizedSecondCell === "muskel"
        ) {
          startIndex = i + 1;
        }
      }
      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName}: startIndex = ${startIndex}`
      );

      // Find Einheit columns (where "Einheit:" header appears)
      const einheitCols: Record<number, { whCol: number; kgCol: number }> = {};

      for (let rowIdx = 0; rowIdx < Math.min(15, data.length); rowIdx++) {
        const row = data[rowIdx];
        if (!row) continue;

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const cell = row[colIdx];
          if (
            typeof cell === "string" &&
            cell.toLowerCase().includes("einheit")
          ) {
            // Found an Einheit header
            // WH data goes in this column, KG in the next column
            einheitCols[colIdx] = {
              whCol: colIdx,
              kgCol: colIdx + 1,
            };
          }
        }
      }
      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName}: Found Einheit columns:`,
        Object.keys(einheitCols)
      );

      if (Object.keys(einheitCols).length === 0) {
        console.log(
          `[exportXLSXWithFormatting] Sheet ${sheetName}: No Einheit columns found, skipping`
        );
        return;
      }

      // Find the Datum row and extract dates for each Einheit column
      const einheitSessions: Record<
        number,
        { date: string; whCol: number; kgCol: number }
      > = {};

      for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
        const row = data[rowIdx];
        if (!row) continue;

        // Check if this row has "Datum:" label
        const hasDatumLabel = row.some((cell) => {
          if (typeof cell !== "string") return false;
          return cell.toLowerCase().includes("datum");
        });

        if (!hasDatumLabel) continue;

        console.log(
          `[exportXLSXWithFormatting] Sheet ${sheetName}: Found Datum row at index ${rowIdx}`
        );

        // This is the Datum row - extract dates for each Einheit column
        Object.entries(einheitCols).forEach(([colIdxStr, colInfo]) => {
          const colIdx = parseInt(colIdxStr);
          const dateValue = row[colIdx];

          if (dateValue != null) {
            const dateStr = parseExcelDate(dateValue);
            if (dateStr) {
              einheitSessions[colIdx] = {
                date: dateStr,
                whCol: colInfo.whCol,
                kgCol: colInfo.kgCol,
              };
              console.log(
                `[exportXLSXWithFormatting] Sheet ${sheetName}: Mapped Einheit col ${colIdx} to date ${dateStr}`
              );
            } else {
              console.log(
                `[exportXLSXWithFormatting] Sheet ${sheetName}: Could not parse date at col ${colIdx}: ${dateValue}`
              );
            }
          } else {
            console.log(
              `[exportXLSXWithFormatting] Sheet ${sheetName}: No date value at col ${colIdx} (undefined/null)`
            );
          }
        });
      }
      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName}: Found ${
          Object.keys(einheitSessions).length
        } Einheit sessions`
      );

      if (Object.keys(einheitSessions).length === 0) {
        console.log(
          `[exportXLSXWithFormatting] Sheet ${sheetName}: No dates found, skipping`
        );
        return;
      }

      // Fill in the WH/KG values for each Einheit
      Object.entries(einheitSessions).forEach(([colIdxStr, einheit]) => {
        const colIdx = parseInt(colIdxStr);
        const session = sessions.find((s) => s.date === einheit.date);
        if (!session) {
          console.log(
            `[exportXLSXWithFormatting] Sheet ${sheetName}: No session found for date ${einheit.date}`
          );
          return;
        }

        console.log(
          `[exportXLSXWithFormatting] Sheet ${sheetName}: Filling Einheit col ${colIdx} with date ${einheit.date}:`,
          {
            entriesCount: session.entries.length,
          }
        );

        // For each exercise, fill in the data
        exercises.forEach((exercise, exerciseIdx) => {
          const entry = session.entries.find(
            (e) => e.exerciseId === exercise.id
          );
          const sortedSets = entry
            ? [...entry.sets].sort((a, b) => a.setNumber - b.setNumber)
            : [];

          // Calculate row indices for this exercise (2 rows per exercise: Satz 1, Satz 2)
          const exerciseRowIdx1 = startIndex + exerciseIdx * 2;
          const exerciseRowIdx2 = startIndex + exerciseIdx * 2 + 1;

          // Satz 1
          if (sortedSets.length > 0) {
            const set1 = sortedSets[0];
            const repsCellRef = XLSX.utils.encode_cell({
              r: exerciseRowIdx1,
              c: einheit.whCol,
            });
            const weightCellRef = XLSX.utils.encode_cell({
              r: exerciseRowIdx1,
              c: einheit.kgCol,
            });

            console.log(
              `[exportXLSXWithFormatting] Sheet ${sheetName}: Setting Satz1 for ${exercise.name} at ${repsCellRef}/${weightCellRef} = ${set1.reps}/${set1.weight}`
            );

            // Replace with clean cell objects - clear all formatting
            sheet[repsCellRef] = { t: "n", v: set1.reps };
            sheet[weightCellRef] = { t: "n", v: set1.weight };
          }

          // Satz 2
          if (sortedSets.length > 1) {
            const set2 = sortedSets[1];
            const repsCellRef = XLSX.utils.encode_cell({
              r: exerciseRowIdx2,
              c: einheit.whCol,
            });
            const weightCellRef = XLSX.utils.encode_cell({
              r: exerciseRowIdx2,
              c: einheit.kgCol,
            });

            console.log(
              `[exportXLSXWithFormatting] Sheet ${sheetName}: Setting Satz2 for ${exercise.name} at ${repsCellRef}/${weightCellRef} = ${set2.reps}/${set2.weight}`
            );

            // Replace with clean cell objects - clear all formatting
            sheet[repsCellRef] = { t: "n", v: set2.reps };
            sheet[weightCellRef] = { t: "n", v: set2.weight };
          }
        });
      });

      // Update sheet range to include all written cells
      // Calculate the max row and column we've written to
      let maxRow = startIndex;
      let maxCol = 0;

      const cellKeys = Object.keys(sheet).filter((k) => !k.startsWith("!"));
      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName}: Total cells in sheet: ${cellKeys.length}`
      );

      cellKeys.forEach((key) => {
        try {
          const cell = XLSX.utils.decode_cell(key);
          maxRow = Math.max(maxRow, cell.r);
          maxCol = Math.max(maxCol, cell.c);
        } catch (e) {
          // Skip invalid cell references
        }
      });

      // Add a buffer to ensure all data is included
      maxRow = Math.max(maxRow, startIndex + exercises.length * 2);
      maxCol = Math.max(
        maxCol,
        Math.max(...Object.keys(einheitCols).map((k) => parseInt(k) + 1))
      );

      const newRef = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: maxRow, c: maxCol },
      });

      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName}: Updating ref from ${sheet["!ref"]} to ${newRef}`
      );
      sheet["!ref"] = newRef;

      // Verify some of the cells were actually written
      console.log(
        `[exportXLSXWithFormatting] Sheet ${sheetName}: Checking written cells:`
      );
      console.log(`  G14:`, sheet["G14"]);
      console.log(`  H14:`, sheet["H14"]);
      console.log(`  I16:`, sheet["I16"]);
      console.log(`  J16:`, sheet["J16"]);
    });

    const buffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
      bookVBA: true,
    });

    console.log(
      "[exportXLSXWithFormatting] Export complete, buffer size:",
      buffer.byteLength,
      "bytes"
    );

    // Verify the buffer contains data by reading it back
    const wb2 = XLSX.read(buffer, { type: "array", bookVBA: true });
    // Find the first sheet with Einheit data (handle both "Einheit 1-8 (10-12)" and test sheet names like "Einheit 1", "Einheiten", etc.)
    const sheetNameToVerify = wb2.SheetNames.find(
      (name) =>
        name.includes("Einheit") &&
        !name.includes("9-16") &&
        !name.includes("17-24")
    );
    if (sheetNameToVerify) {
      const sheet2 = wb2.Sheets[sheetNameToVerify];
      if (sheet2) {
        console.log(
          `[exportXLSXWithFormatting] Verifying written data in sheet "${sheetNameToVerify}":`
        );
        console.log("  G14:", sheet2["G14"]);
        console.log("  H14:", sheet2["H14"]);
        console.log("  I16:", sheet2["I16"]);
        console.log("  J16:", sheet2["J16"]);
      }
    }

    return buffer;
  } catch (error) {
    console.error("Error exporting XLSX:", error);
    throw error;
  }
}
