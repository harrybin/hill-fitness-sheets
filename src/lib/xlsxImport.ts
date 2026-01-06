import * as XLSX from "xlsx";
import { Exercise, Session } from "./types";
import { base64ToArrayBuffer } from "./utils";

// Import-Regeln für XLSX-Parser:
// - Eine Einheit (Session) wird nur importiert, wenn mindestens eine Übung in mindestens einem Satz eine Wiederholungszahl (Reps) hat.
// - Hat eine zu importierende Einheit für eine Übung in beiden Sätzen keinen Zahlenwert (Reps), wird diese Übung in dieser Einheit mit skipped: true markiert.

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

/**
 * Parses an XLSX ArrayBuffer and returns exercises, metadata, and sessions.
 *
 * Import-Regeln:
 * - Eine Trainingseinheit (Session) wird nur importiert, wenn mindestens eine Übung in mindestens einem Satz eine Wiederholungszahl (Reps) hat.
 * - Hat eine zu importierende Einheit für eine Übung in beiden Sätzen keinen Zahlenwert (Reps), wird diese Übung in dieser Einheit mit `skipped: true` markiert.
 *
 * @param arrayBuffer XLSX file as ArrayBuffer
 * @returns { exercises, metadata, sessions }
 */
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
        console.log(
          `Merging session with date ${session.date}: existing has dateInterpolated=${existingSession.dateInterpolated}, new session has dateInterpolated=${session.dateInterpolated}`
        );
        // Preserve the dateInterpolated flag if either session has it
        if (session.dateInterpolated && !existingSession.dateInterpolated) {
          existingSession.dateInterpolated = session.dateInterpolated;
        }
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

/**
 * Interpolates dates for training sessions where dates are missing.
 * Splits dates evenly between known date points.
 * Returns array with both the session info and whether date was interpolated.
 *
 * Example:
 * Input:  [{date: '2025-11-18'}, {date: null}, {date: null}, {date: '2025-11-21'}]
 * Output: [{date: '2025-11-18', interpolated: false}, {date: '2025-11-19', interpolated: true}, {date: '2025-11-20', interpolated: true}, {date: '2025-11-21', interpolated: false}]
 */
function interpolateSessionDates(
  sessions: Array<{ whCol: number; kgCol: number; date: string | null }>
): Array<{
  whCol: number;
  kgCol: number;
  date: string;
  interpolated: boolean;
}> {
  if (sessions.length === 0) {
    return [];
  }

  const result: Array<{
    whCol: number;
    kgCol: number;
    date: string;
    interpolated: boolean;
  }> = [];
  let i = 0;

  while (i < sessions.length) {
    // If this session has a date, add it to result
    if (sessions[i].date) {
      result.push({
        whCol: sessions[i].whCol,
        kgCol: sessions[i].kgCol,
        date: sessions[i].date!,
        interpolated: false,
      });
      i++;
      continue;
    }

    // Collect consecutive undated sessions
    const unddatedSessions = [sessions[i]];
    i++;
    while (i < sessions.length && !sessions[i].date) {
      unddatedSessions.push(sessions[i]);
      i++;
    }

    // Find the next dated session or use today as fallback
    const nextDatedSession = sessions[i];
    const lastDatedSession =
      result.length > 0 ? result[result.length - 1] : null;

    if (!lastDatedSession && !nextDatedSession) {
      // No dates at all - use today for all
      const today = new Date().toISOString().split("T")[0];
      for (const undated of unddatedSessions) {
        result.push({
          whCol: undated.whCol,
          kgCol: undated.kgCol,
          date: today,
          interpolated: true,
        });
      }
      console.log(`  → All to today: ${today}`);
      continue;
    }

    if (!lastDatedSession && nextDatedSession) {
      // First sessions are undated, next one has date
      const startDate = new Date(nextDatedSession.date!);
      const endDate = new Date(nextDatedSession.date!);
      const daysBetween = 0;
      const intervalDays =
        unddatedSessions.length > 0
          ? Math.max(1, Math.floor(daysBetween / (unddatedSessions.length + 1)))
          : 1;

      for (let j = 0; j < unddatedSessions.length; j++) {
        const date = new Date(startDate);
        date.setDate(
          date.getDate() - (unddatedSessions.length - j) * intervalDays
        );
        result.push({
          whCol: unddatedSessions[j].whCol,
          kgCol: unddatedSessions[j].kgCol,
          date: date.toISOString().split("T")[0],
          interpolated: true,
        });
      }
      continue;
    }

    if (lastDatedSession && !nextDatedSession) {
      // Last sessions are undated - interpolate between last known date and today
      const startDate = new Date(lastDatedSession.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysBetween = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const intervalDays = Math.max(
        1,
        Math.floor(daysBetween / (unddatedSessions.length + 1))
      );

      for (let j = 0; j < unddatedSessions.length; j++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (j + 1) * intervalDays);
        result.push({
          whCol: unddatedSessions[j].whCol,
          kgCol: unddatedSessions[j].kgCol,
          date: date.toISOString().split("T")[0],
          interpolated: true,
        });
      }
      continue;
    }

    // Both before and after have dates - interpolate
    const startDate = new Date(lastDatedSession!.date);
    const endDate = new Date(nextDatedSession!.date);
    const daysBetween = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const intervalDays = Math.max(
      1,
      Math.floor(daysBetween / (unddatedSessions.length + 1))
    );

    for (let j = 0; j < unddatedSessions.length; j++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (j + 1) * intervalDays);
      result.push({
        whCol: unddatedSessions[j].whCol,
        kgCol: unddatedSessions[j].kgCol,
        date: date.toISOString().split("T")[0],
        interpolated: true,
      });
    }
  }

  return result;
}

/**
 * Parsed jede Sheet-Tabelle und erzeugt Sessions gemäß folgender Regeln:
 * - Eine Einheit (Session) wird nur importiert, wenn mindestens eine Übung in mindestens einem Satz eine Wiederholungszahl (Reps) hat.
 * - Hat eine Übung in einer importierten Einheit in beiden Sätzen keine Wiederholungszahl, wird sie mit `skipped: true` markiert.
 */
function parseSessionsFromSheet(
  data: any[][],
  exercises: Exercise[]
): Session[] {
  const sessions: Session[] = [];
  let hasAnyDateInSheet = false;

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
      // Use the last detected header so we align with the actual training table
      startIndex = i + 1;
    }
  }

  // Map Einheit numbers by column (if present)
  // NOTE: "Einheit:" is in one column, the number is in the next
  // But WH is in the "Einheit:" column and KG is in the number column
  // So we store the EINHEIT COLUMN (where WH is), not the number column
  const einheitByCol: Record<number, string> = {};
  for (const row of data) {
    if (!row) continue;
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = row[colIdx];
      if (typeof cell === "string" && cell.toLowerCase().includes("einheit")) {
        const value = row[colIdx + 1];
        if (value != null && String(value).trim() !== "") {
          einheitByCol[colIdx] = String(value).trim(); // FIX: store the Einheit HEADER column, not the number column
        }
      }
    }
  }

  // First, create sessions for ALL Einheiten (based on column structure)
  // Then fill in dates where available
  const sessionsByCol: Map<
    number,
    {
      whCol: number;
      kgCol: number;
      date: string | null;
      einheitNumber?: string;
    }
  > = new Map();

  // Initialize sessions for all Einheit columns
  for (const [colIdxStr, einheitNum] of Object.entries(einheitByCol)) {
    const colIdx = parseInt(colIdxStr);
    sessionsByCol.set(colIdx, {
      whCol: colIdx,
      kgCol: colIdx + 1,
      date: null,
      einheitNumber: einheitNum,
    });
  }

  // Create set of valid Einheit columns for validation later
  const einheitCols = new Set(
    Object.keys(einheitByCol).map((k) => parseInt(k))
  );

  // Fill in dates from the Datum row
  // Search MORE BROADLY - check ALL rows up to startIndex + buffer to handle test data structures
  const dateSearchLimit = Math.min(startIndex + 5, data.length);
  for (let rowIdx = 0; rowIdx < dateSearchLimit; rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;

    const hasDateLabel = row.some((cell) => {
      if (typeof cell !== "string") return false;
      const lower = cell.toLowerCase();
      return lower.includes("datum") || lower.includes("date");
    });

    if (!hasDateLabel) continue;

    row.forEach((cell, colIdx) => {
      if (colIdx < 5) return; // Training data starts at later columns
      if (typeof cell === "string") {
        const lower = cell.toLowerCase();
        if (lower.includes("datum") || lower.includes("date")) {
          return;
        }
      }

      const dateStr = parseExcelDate(cell);
      if (!dateStr) return;

      // Try to find the session at this column
      let session = sessionsByCol.get(colIdx);

      if (!session) {
        // Try the next column (date might be one column to the left of Einheit header)
        session = sessionsByCol.get(colIdx + 1);
        if (session) {
          session.date = dateStr;
        }
      }

      if (!session) {
        // Try to find the nearest Einheit column to the right
        for (
          let searchCol = colIdx + 1;
          searchCol <= colIdx + 8;
          searchCol += 2
        ) {
          if (einheitCols.has(searchCol)) {
            session = sessionsByCol.get(searchCol);
            if (session) {
              session.date = dateStr;
              break;
            }
          }
        }
      }

      if (session) {
        session.date = dateStr;
        hasAnyDateInSheet = true;
      } else {
        // Create new session if no Einheit was defined for this column
        sessionsByCol.set(colIdx, {
          whCol: colIdx,
          kgCol: colIdx + 1,
          date: dateStr,
          einheitNumber: einheitByCol[colIdx] ?? einheitByCol[colIdx + 1],
        });
        hasAnyDateInSheet = true;
      }
    });
  }

  // Secondary pass: detect dates anywhere in the header area, but ignore small integers
  // IMPORTANT: Only search rows AFTER the Datum row to avoid parsing header row numbers as dates
  // ONLY SEARCH COLUMNS THAT HAVE ACTUAL EINHEITEN
  const headerRowLimit = Math.min(startIndex, data.length);
  const datumRowIndex = 11;

  for (let rowIdx = datumRowIndex + 1; rowIdx < headerRowLimit; rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      if (colIdx < 5) continue; // Ignore metadata columns

      // ONLY check columns that have Einheiten defined
      if (!einheitCols.has(colIdx)) continue;

      const cell = row[colIdx];
      if (typeof cell === "number" && cell < 60) {
        continue;
      }

      const dateStr = parseExcelDate(cell);
      if (!dateStr) continue;

      const session = sessionsByCol.get(colIdx);
      if (session && !session.date) {
        // Update session with found date
        session.date = dateStr;
        hasAnyDateInSheet = true;
      }
    }
  }

  // Convert map to array, sorted by column index
  const trainingSessions = Array.from(sessionsByCol.values()).sort(
    (a, b) => a.whCol - b.whCol
  );

  // CRITICAL FIX: Only keep sessions that correspond to actual Einheit columns
  // Filter out any stray sessions created in wrong columns
  const validSessions = trainingSessions.filter((s) => {
    // Keep session if:
    // 1. Its column has an Einheit, OR
    // 2. It's within the expected range (col 5 to col 21, step 2)
    if (einheitCols.has(s.whCol)) return true;

    // Fallback: keep if it looks like it's in the typical Einheit position (odd columns 7, 9, 11, etc)
    if (s.whCol >= 7 && s.whCol <= 21 && (s.whCol - 7) % 2 === 0) return true;

    return false;
  });

  if (validSessions.length === 0) {
    return sessions;
  }

  if (!hasAnyDateInSheet) {
    console.log(
      "⚠️  Skipping sheet: no dates found in header; ignoring undated Einheiten"
    );
    return sessions;
  }

  // Interpolate missing dates: fill gaps between known dates
  const sessionsWithInterpolatedDates = interpolateSessionDates(validSessions);

  console.log(
    `Found ${sessionsWithInterpolatedDates.length} training sessions in this sheet`
  );

  for (const {
    whCol,
    kgCol,
    date,
    interpolated: interpolatedFlag = false,
  } of sessionsWithInterpolatedDates) {
    let hasAnyReps = false; // true if any exercise yields at least one set
    const entries: any[] = [];

    for (let exerciseIdx = 0; exerciseIdx < exercises.length; exerciseIdx++) {
      const exercise = exercises[exerciseIdx];
      const exerciseRowIdx1 = startIndex + exerciseIdx * 2;
      const exerciseRowIdx2 = startIndex + exerciseIdx * 2 + 1;
      if (exerciseRowIdx1 >= data.length) continue;

      const exerciseRow1 = data[exerciseRowIdx1];
      const exerciseRow2 =
        exerciseRowIdx2 < data.length ? data[exerciseRowIdx2] : null;

      const isRow1Empty =
        !exerciseRow1 ||
        ((exerciseRow1[whCol] == null ||
          String(exerciseRow1[whCol]).trim() === "") &&
          (exerciseRow1[kgCol] == null ||
            String(exerciseRow1[kgCol]).trim() === ""));
      const isRow2Empty =
        !exerciseRow2 ||
        ((exerciseRow2[whCol] == null ||
          String(exerciseRow2[whCol]).trim() === "") &&
          (exerciseRow2[kgCol] == null ||
            String(exerciseRow2[kgCol]).trim() === ""));

      const reps1 = exerciseRow1?.[whCol];
      const weight1 = exerciseRow1?.[kgCol];
      const reps2 = exerciseRow2 ? exerciseRow2[whCol] : null;
      const weight2Raw = exerciseRow2 ? exerciseRow2[kgCol] : null;

      const weight2 =
        (weight2Raw === undefined || weight2Raw === null) &&
        reps2 != null &&
        reps2 !== "/" &&
        String(reps2).trim() !== ""
          ? weight1
          : weight2Raw;

      // Check if both reps are empty/missing (for skipped unit detection)
      const reps1Str = reps1 != null ? String(reps1).trim() : "";
      const reps2Str = reps2 != null ? String(reps2).trim() : "";
      const bothRepsEmpty =
        (reps1Str === "" || reps1Str === "/") &&
        (reps2Str === "" || reps2Str === "/");

      const sets: any[] = [];

      // Satz 1
      if (reps1 != null) {
        const repsStr1 = String(reps1).trim();
        const weightStr1 = weight1 != null ? String(weight1).trim() : "";
        const weightMissing =
          weightStr1 === "" || weightStr1 === "/" || weight1 == null;
        if (repsStr1 !== "/" && repsStr1 !== "") {
          const repsNum1 = parseInt(repsStr1);
          const weightNum1Raw = parseFloat(weightStr1.replace(",", "."));
          const weightNum1 = !isNaN(weightNum1Raw) ? weightNum1Raw : 0;
          const hasValidWeight = weightNum1 > 0;
          if (
            !isNaN(repsNum1) &&
            repsNum1 > 0 &&
            (hasValidWeight || weightMissing)
          ) {
            sets.push({
              setNumber: 1,
              weight: hasValidWeight ? weightNum1 : 0,
              reps: repsNum1,
            });
          }
        }
      }

      // Satz 2
      if (reps2 != null) {
        const repsStr2 = String(reps2).trim();
        const weightStr2 = weight2 != null ? String(weight2).trim() : "";
        const weightMissing =
          weightStr2 === "" || weightStr2 === "/" || weight2 == null;
        if (repsStr2 !== "/" && repsStr2 !== "") {
          const repsNum2 = parseInt(repsStr2);
          const weightNum2Raw = parseFloat(weightStr2.replace(",", "."));
          const weightNum2 = !isNaN(weightNum2Raw) ? weightNum2Raw : 0;
          const hasValidWeight = weightNum2 > 0;
          if (
            !isNaN(repsNum2) &&
            repsNum2 > 0 &&
            (hasValidWeight || weightMissing)
          ) {
            sets.push({
              setNumber: 2,
              weight: hasValidWeight ? weightNum2 : 0,
              reps: repsNum2,
            });
          }
        }
      }

      if (sets.length > 0) {
        hasAnyReps = true;
      }

      const entry: any = {
        id: `entry-${date}-${exercise.id}`,
        exerciseId: exercise.id,
        date,
        sets,
      };
      // Mark as skipped if both reps are empty/missing (per import rules)
      if (bothRepsEmpty) {
        entry.skipped = true;
      }
      entries.push(entry);
    }

    // Session only counts if at least one exercise has reps
    if (!hasAnyReps) {
      console.log(
        `⚠️  Filtering out session at col ${whCol}, date ${date}: no reps found in any exercise`
      );
      continue;
    }

    const totalSets = entries.reduce(
      (sum, entry) => sum + (entry.sets ? entry.sets.length : 0),
      0
    );

    if (totalSets < 4) {
      console.log(
        `⚠️  Filtering out session at col ${whCol}, date ${date}: only ${totalSets} sets found (looks empty)`
      );
      continue;
    }

    const sessionToAdd = { date, entries, dateInterpolated: interpolatedFlag };
    sessions.push(sessionToAdd);
  }

  console.log(`Imported ${sessions.length} sessions from this sheet`);
  return sessions;
}
