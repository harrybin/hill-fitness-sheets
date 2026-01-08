import ExcelJS from "exceljs";
import { Exercise, Session } from "./types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";

/**
 * Updates an existing XLSX file with new training sessions.
 * Creates/overwrites an "App-Data" sheet with session history.
 * ExcelJS version preserves existing sheets and formatting.
 */
export async function updateXLSXWithSessions(
  base64Data: string,
  sessions: Session[],
  exercises: Exercise[]
): Promise<string> {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const workbook = new ExcelJS.Workbook();
    // ExcelJS expects a Buffer on Node.js - cast to any to bypass type checking
    await workbook.xlsx.load(new Uint8Array(arrayBuffer) as any);

    // NOTE: We don't create/update "App-Data" sheet for now
    // The export to Einheit columns is the main feature
    // Skip creating hidden sheets for now to avoid conflicts with protected names

    // Write to buffer and convert to base64
    const outputBuffer = (await workbook.xlsx.writeBuffer()) as any;
    // Convert Node Buffer to ArrayBuffer
    const arr = new ArrayBuffer(outputBuffer.length);
    const view = new Uint8Array(arr);
    for (let i = 0; i < outputBuffer.length; i++) {
      view[i] = outputBuffer[i];
    }
    return arrayBufferToBase64(arr);
  } catch (error) {
    console.error("Error updating XLSX:", error);
    return base64Data;
  }
}

/**
 * Exports XLSX with training session data written to Einheit sheets.
 * Loads the provided XLSX file, writes training data to available Einheit columns,
 * and returns the modified workbook as an ArrayBuffer.
 *
 * Uses ExcelJS for all operations - preserves existing formatting and structure.
 */
export async function exportXLSXWithFormatting(
  base64Data: string,
  sessions: Session[],
  exercises: Exercise[]
): Promise<ArrayBuffer> {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const workbook = new ExcelJS.Workbook();
    // ExcelJS expects a Buffer on Node.js - cast to any to bypass type checking
    await workbook.xlsx.load(new Uint8Array(arrayBuffer) as any);

    // Remove protected named ranges that might cause conflicts
    // The Excel file has a "History" defined name that's protected
    if ((workbook as any).definedNames) {
      const definedNames = (workbook as any).definedNames || {};
      // Remove the "History" defined name if it exists
      if (definedNames.History) {
        delete definedNames.History;
      }
      // Also try to remove any defined names that might conflict
      Object.keys(definedNames).forEach((key) => {
        if (
          key &&
          typeof key === "string" &&
          (key.includes("History") || key.includes("history"))
        ) {
          delete definedNames[key];
        }
      });
    }

    // ONLY export to the first sheet - continuation sheets have different exercises/dates
    // Determine how many Einheit columns are available, then take that many most recent sessions

    // Use only the first 'Einheit' sheet
    const einheitSheets = workbook.worksheets.filter((ws) =>
      ws.name.toLowerCase().includes("einheit")
    );

    if (einheitSheets.length > 0) {
      const worksheet = einheitSheets[0];

      // Find Einheit columns first to know how many sessions we can export
      const einheitCols: Record<number, { whCol: number; kgCol: number }> = {};
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < 15) {
          row.eachCell((cell, colNumber) => {
            const cellValue = String(cell.value || "").toLowerCase();
            if (cellValue.includes("einheit")) {
              einheitCols[colNumber] = {
                whCol: colNumber,
                kgCol: colNumber + 1,
              };
            }
          });
        }
      });

      const maxSessions = Math.max(
        Object.keys(einheitCols).length,
        8 // Default to 8 if no columns found
      );

      // Take up to maxSessions most recent sessions
      const recentSessions = sessions
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, maxSessions)
        .reverse(); // Reverse to get chronological order

      const chunk = recentSessions;

      // Find exercise start row (row with "Übungen"/"Exercises"/"Muskel" in column B)
      let startIndex = 0;
      worksheet.eachRow((row, rowNumber) => {
        if (startIndex === 0) {
          const cellB = row.getCell(2);
          const cellValue = String(cellB.value || "")
            .toLowerCase()
            .trim();
          const normalized = cellValue
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (
            normalized === "ubungen" ||
            normalized === "exercises" ||
            normalized === "muskel"
          ) {
            startIndex = rowNumber + 1;
          }
        }
      });

      if (Object.keys(einheitCols).length === 0) {
        console.warn("No Einheit columns found in first sheet");
      } else {
        // Find Datum row (row with "Datum" label)
        let datumRowIdx = -1;
        worksheet.eachRow((row, rowNumber) => {
          if (datumRowIdx === -1 && rowNumber < 20) {
            // Only check first 20 rows
            row.eachCell((cell) => {
              const cellValue = String(cell.value || "").toLowerCase();
              if (cellValue.includes("datum")) {
                datumRowIdx = rowNumber;
              }
            });
          }
        });

        // Process each session in this chunk
        const sortedCols = Object.keys(einheitCols)
          .map((k) => parseInt(k))
          .sort((a, b) => a - b);

        for (let sIdx = 0; sIdx < chunk.length; sIdx++) {
          const session = chunk[sIdx];
          const colIdx = sortedCols[sIdx];
          if (!colIdx) continue;

          const colInfo = einheitCols[colIdx];

          // Write date to Datum row (same column as Einheit WH column)
          if (datumRowIdx > 0) {
            const dateCell = worksheet.getCell(datumRowIdx, colIdx);
            dateCell.value = new Date(session.date);
            dateCell.numFmt = "DD.MM.YYYY";
          }

          // Write exercise data
          exercises.forEach((exercise, exerciseIdx) => {
            const entry = session.entries.find(
              (e) => e.exerciseId === exercise.id
            );
            const sortedSets = entry
              ? [...entry.sets].sort((a, b) => a.setNumber - b.setNumber)
              : [];

            const exerciseRowIdx1 = startIndex + exerciseIdx * 2;
            const exerciseRowIdx2 = startIndex + exerciseIdx * 2 + 1;

            // Satz 1 (Set 1)
            if (sortedSets.length > 0) {
              const set1 = sortedSets[0];
              const repsCell = worksheet.getCell(
                exerciseRowIdx1,
                colInfo.whCol
              );
              const weightCell = worksheet.getCell(
                exerciseRowIdx1,
                colInfo.kgCol
              );

              repsCell.value = set1.reps;
              weightCell.value = set1.weight;
            }

            // Satz 2 (Set 2) - only reps (weight is merged cell in template)
            if (sortedSets.length > 1) {
              const set2 = sortedSets[1];
              const repsCell = worksheet.getCell(
                exerciseRowIdx2,
                colInfo.whCol
              );
              repsCell.value = set2.reps;
              // Do NOT write weight in row 2 - it's a merged cell in the template
            }
          });
        }
      }
    }

    // Write to buffer
    let outputBuffer: any;
    try {
      outputBuffer = (await workbook.xlsx.writeBuffer()) as any;
    } catch (error: any) {
      // If we get an error about protected names, try clearing them
      if (error.message && error.message.includes("protected")) {
        console.warn("Clearing protected names before retry:", error.message);
        // Try to clear all defined names
        if ((workbook as any).definedNames) {
          (workbook as any).definedNames = {};
        }
        // Try again
        outputBuffer = (await workbook.xlsx.writeBuffer()) as any;
      } else {
        throw error;
      }
    }

    // Convert Node Buffer to ArrayBuffer
    const arr = new ArrayBuffer(outputBuffer.length);
    const view = new Uint8Array(arr);
    for (let i = 0; i < outputBuffer.length; i++) {
      view[i] = outputBuffer[i];
    }
    return arr;
  } catch (error) {
    console.error("Error exporting XLSX:", error);
    throw error;
  }
}
