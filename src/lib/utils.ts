import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import { Exercise, Session } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function parseXLSX(arrayBuffer: ArrayBuffer): {
  exercises: Exercise[];
  metadata: {
    trainingGoal?: string;
    legalNotice?: string;
    notes?: string;
  };
  sessions: Session[];
} {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  console.log("Available sheets:", workbook.SheetNames);

  // Process all sheets to gather sessions
  const allSessions: Session[] = [];
  let exercises: Exercise[] = [];
  const metadata: {
    trainingGoal?: string;
    legalNotice?: string;
    notes?: string;
  } = {};

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n=== Processing sheet: ${sheetName} ===`);

    const worksheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`Sheet has ${data.length} rows`);

    // Only parse exercises from the first sheet (they're the same across all sheets)
    if (exercises.length === 0) {
      const parsedData = parseSheetData(data);
      exercises = parsedData.exercises;
      Object.assign(metadata, parsedData.metadata);
    }

    // Parse sessions from this sheet
    const sessions = parseSessionsFromSheet(data, exercises);

    // Merge sessions
    sessions.forEach((session) => {
      const existingSession = allSessions.find((s) => s.date === session.date);
      if (existingSession) {
        // Merge entries
        session.entries.forEach((entry) => {
          const existingEntry = existingSession.entries.find(
            (e) => e.exerciseId === entry.exerciseId
          );
          if (existingEntry) {
            // Merge sets
            existingEntry.sets.push(...entry.sets);
          } else {
            existingSession.entries.push(entry);
          }
        });
      } else {
        allSessions.push(session);
      }
    });
  }

  console.log(`\n=== Final Results ===`);
  console.log(`Total exercises: ${exercises.length}`);
  console.log(`Total sessions: ${allSessions.length}`);
  if (allSessions.length > 0) {
    console.log("Session dates:", allSessions.map((s) => s.date).sort());
  }

  // Check for history sheet (legacy support)
  const historySheetName = workbook.SheetNames.find(
    (name) =>
      name.toLowerCase().includes("history") ||
      name.toLowerCase().includes("historie")
  );

  if (historySheetName) {
    try {
      const historyData: any[][] = XLSX.utils.sheet_to_json(
        workbook.Sheets[historySheetName],
        { header: 1 }
      );

      console.log(
        `Parsing ${
          historyData.length - 1
        } history rows from sheet "${historySheetName}"`
      );

      for (let i = 1; i < historyData.length; i++) {
        const row = historyData[i];
        if (!row || row.length < 4) continue;

        const dateStr = parseExcelDate(row[0]);
        if (!dateStr) {
          console.warn(`Row ${i}: Invalid date format:`, row[0]);
          continue;
        }

        const exerciseName = String(row[1] || "").trim();
        const weight = parseFloat(String(row[2] || "0"));
        const reps = parseInt(String(row[3] || "0"));
        const setNumber = parseInt(String(row[4] || "1"));

        if (!exerciseName || isNaN(weight) || isNaN(reps)) {
          console.warn(`Row ${i}: Invalid data:`, {
            exerciseName,
            weight,
            reps,
          });
          continue;
        }

        const exercise = exercises.find(
          (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );

        if (!exercise) {
          console.warn(
            `Row ${i}: Exercise "${exerciseName}" not found in exercise list`
          );
          continue;
        }

        let session = allSessions.find((s) => s.date === dateStr);
        if (!session) {
          session = { date: dateStr, entries: [] };
          allSessions.push(session);
        }

        let entry = session.entries.find((e) => e.exerciseId === exercise.id);
        if (!entry) {
          entry = {
            id: `entry-${dateStr}-${exercise.id}`,
            exerciseId: exercise.id,
            date: dateStr,
            sets: [],
          };
          session.entries.push(entry);
        }

        entry.sets.push({
          setNumber: setNumber || entry.sets.length + 1,
          weight,
          reps,
        });
      }

      console.log(
        `Additionally imported ${allSessions.length} total sessions including history sheet`
      );
    } catch (error) {
      console.error("Error parsing history:", error);
    }
  }

  return { exercises, metadata, sessions: allSessions };
}

function parseSheetData(data: any[][]): {
  exercises: Exercise[];
  metadata: {
    trainingGoal?: string;
    legalNotice?: string;
    notes?: string;
  };
} {
  const exercises: Exercise[] = [];
  const metadata: {
    trainingGoal?: string;
    legalNotice?: string;
    notes?: string;
  } = {};

  const ignoredKeywords = [
    "trainingsziel",
    "training goal",
    "rechtliche hinweise",
    "legal notice",
    "hinweise",
    "notizen",
    "notes",
    "bei bedarf",
    "copyright",
  ];

  const isMetadataRow = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim();
    return ignoredKeywords.some((keyword) => lowerText.includes(keyword));
  };

  let startIndex = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    const secondCell = String(row[1] || "")
      .toLowerCase()
      .trim();
    const normalizedSecondCell = secondCell
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      normalizedSecondCell === "ubungen" ||
      normalizedSecondCell === "exercises" ||
      secondCell === "übungen"
    ) {
      startIndex = i + 1;
      break;
    }

    const cellBStr = String(row[1] || "").trim();

    if (cellBStr && isMetadataRow(cellBStr)) {
      const value = String(row[2] || "").trim();
      const lowerCellB = cellBStr.toLowerCase();

      if (
        lowerCellB.includes("trainingsziel") ||
        lowerCellB.includes("training goal")
      ) {
        metadata.trainingGoal = value;
      } else if (
        lowerCellB.includes("rechtliche") ||
        lowerCellB.includes("legal")
      ) {
        metadata.legalNotice = value;
      } else if (
        lowerCellB.includes("hinweise") ||
        lowerCellB.includes("notiz") ||
        lowerCellB.includes("notes")
      ) {
        if (!metadata.legalNotice) {
          metadata.notes = value;
        }
      }
    }
  }

  console.log(
    `Starting to parse exercises from row ${startIndex}, total rows: ${data.length}`
  );

  for (let i = startIndex; i < data.length; i++) {
    const row = data[i];

    if (!row || row.length === 0) {
      continue;
    }

    const cellBStr = String(row[1] || "").trim();

    if (!cellBStr || cellBStr === "") {
      continue;
    }

    if (isMetadataRow(cellBStr)) {
      continue;
    }

    const exerciseName = cellBStr;
    const notes = String(row[2] || "").trim();

    exercises.push({
      id: `exercise-${i}`,
      name: exerciseName,
      notes: notes || undefined,
      order: exercises.length,
    });
  }

  console.log(`Parsed ${exercises.length} exercises`);

  return { exercises, metadata };
}

function parseSessionsFromSheet(
  data: any[][],
  exercises: Exercise[]
): Session[] {
  const sessions: Session[] = [];

  const parseExcelDate = (value: any): string | null => {
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
  };

  // Find exercise start row
  let startIndex = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const secondCell = String(row[1] || "")
      .toLowerCase()
      .trim();
    const normalizedSecondCell = secondCell
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      normalizedSecondCell === "ubungen" ||
      normalizedSecondCell === "exercises" ||
      secondCell === "übungen"
    ) {
      startIndex = i + 1;
      break;
    }
  }

  // Find the date row - Row with "Datum:" in column 0
  let dateRowIndex = -1;
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i];
    const cellA = String(row[0] || "")
      .toLowerCase()
      .trim();
    if (cellA.includes("datum")) {
      dateRowIndex = i;
      console.log(`Found "Datum:" row at index ${i}`);
      break;
    }
  }

  if (dateRowIndex >= 0) {
    const dateRow = data[dateRowIndex];
    
    // Also find the Einheit row (row 8) to map Einheit numbers to columns
    let einheitRowIndex = -1;
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || "")
          .toLowerCase()
          .trim();
        if (cell === "einheit:") {
          einheitRowIndex = i;
          break;
        }
      }
      if (einheitRowIndex >= 0) break;
    }
    
    const trainingSessions: {
      whCol: number;
      kgCol: number;
      date: string;
      einheitNumber?: number;
    }[] = [];

    console.log("Scanning date row:", dateRow);
    if (einheitRowIndex >= 0) {
      console.log("Scanning Einheit row at index", einheitRowIndex);
    }

    // Dates and WH/KG pairs start at column 6
    // Pattern: date at col 6, WH/KG at 6,7; date at col 8, WH/KG at 8,9; etc.
    const maxCol = Math.max(
      dateRow.length,
      einheitRowIndex >= 0 ? data[einheitRowIndex].length : 0
    );
    for (let colIdx = 6; colIdx < maxCol; colIdx += 2) {
      const dateValue = dateRow[colIdx];

      let parsedDate = parseExcelDate(dateValue);
      let einheitNumber: number | undefined;

      // If no date found, try to get Einheit number and generate a date
      if (!parsedDate && einheitRowIndex >= 0) {
        const einheitRow = data[einheitRowIndex];
        // Einheit numbers are typically at colIdx+1 (after "Einheit:" text)
        if (colIdx + 1 < einheitRow.length) {
          const einheitValue = einheitRow[colIdx + 1];
          if (einheitValue != null && einheitValue !== "") {
            const num =
              typeof einheitValue === "number"
                ? einheitValue
                : parseInt(String(einheitValue));
            if (!isNaN(num) && num > 0) {
              einheitNumber = num;
              // Generate a synthetic date based on Einheit number
              // Space them 3 days apart, counting backwards from today
              const baseDate = new Date();
              baseDate.setDate(baseDate.getDate() - (num - 1) * 3);
              parsedDate = baseDate.toISOString().split("T")[0];
              console.log(
                `No date for Einheit ${num} at column ${colIdx}, generated date: ${parsedDate}`
              );
            }
          }
        }
      }

      if (parsedDate) {
        const whCol = colIdx;
        const kgCol = colIdx + 1;
        trainingSessions.push({ whCol, kgCol, date: parsedDate, einheitNumber });
        console.log(
          `Found training session at column ${colIdx}: ${parsedDate} (WH: ${whCol}, KG: ${kgCol})${
            einheitNumber ? ` [Einheit ${einheitNumber}]` : ""
          }`
        );
      }
    }

    if (trainingSessions.length > 0) {
      console.log(
        `Found ${trainingSessions.length} training sessions in this sheet`
      );

      for (let exerciseIdx = 0; exerciseIdx < exercises.length; exerciseIdx++) {
        const exercise = exercises[exerciseIdx];
        // Each exercise spans 2 rows (Satz 1 and Satz 2)
        const exerciseRowIdx1 = startIndex + exerciseIdx * 2;
        const exerciseRowIdx2 = startIndex + exerciseIdx * 2 + 1;

        if (exerciseRowIdx1 >= data.length) continue;

        const exerciseRow1 = data[exerciseRowIdx1];
        const exerciseRow2 =
          exerciseRowIdx2 < data.length ? data[exerciseRowIdx2] : null;

        for (const { whCol, kgCol, date } of trainingSessions) {
          // Get data for Satz 1
          const reps1 = exerciseRow1[whCol];
          const weight1 = exerciseRow1[kgCol];

          // Get data for Satz 2
          const reps2 = exerciseRow2 ? exerciseRow2[whCol] : null;
          const weight2 = exerciseRow2 ? exerciseRow2[kgCol] : null;

          const sets = [];

          // Process Satz 1
          if (reps1 != null && weight1 != null) {
            const repsStr1 = String(reps1).trim();
            const weightStr1 = String(weight1).trim();

            if (
              repsStr1 !== "/" &&
              weightStr1 !== "/" &&
              repsStr1 !== "" &&
              weightStr1 !== ""
            ) {
              const repsNum1 = parseInt(repsStr1);
              const weightNum1 = parseFloat(weightStr1.replace(",", "."));

              if (
                !isNaN(weightNum1) &&
                weightNum1 > 0 &&
                !isNaN(repsNum1) &&
                repsNum1 > 0
              ) {
                sets.push({ setNumber: 1, weight: weightNum1, reps: repsNum1 });
              }
            }
          }

          // Process Satz 2
          if (reps2 != null && weight2 != null) {
            const repsStr2 = String(reps2).trim();
            const weightStr2 = String(weight2).trim();

            if (
              repsStr2 !== "/" &&
              weightStr2 !== "/" &&
              repsStr2 !== "" &&
              weightStr2 !== ""
            ) {
              const repsNum2 = parseInt(repsStr2);
              const weightNum2 = parseFloat(weightStr2.replace(",", "."));

              if (
                !isNaN(weightNum2) &&
                weightNum2 > 0 &&
                !isNaN(repsNum2) &&
                repsNum2 > 0
              ) {
                sets.push({ setNumber: 2, weight: weightNum2, reps: repsNum2 });
              }
            }
          }

          if (sets.length === 0) continue;

          let session = sessions.find((s) => s.date === date);
          if (!session) {
            session = { date, entries: [] };
            sessions.push(session);
          }

          let entry = session.entries.find((e) => e.exerciseId === exercise.id);
          if (!entry) {
            entry = {
              id: `entry-${date}-${exercise.id}`,
              exerciseId: exercise.id,
              date: date,
              sets: [],
            };
            session.entries.push(entry);
          }

          entry.sets.push(...sets);
        }
      }

      console.log(`Imported ${sessions.length} sessions from this sheet`);
    }
  }

  return sessions;
}

export function updateXLSXWithSessions(
  base64Data: string,
  sessions: Session[],
  exercises: Exercise[]
): string {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const historySheetName = "History";
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
