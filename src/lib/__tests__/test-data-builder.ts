/**
 * Helper to create proper test XLSX data that matches the real Example-Sheet.xlsx structure.
 *
 * The CORRECT structure (from real Example-Sheet.xlsx):
 * - Rows 0-11: Headers/metadata/empty rows
 * - Row 11: "Datum:" marker in column 0, with dates in columns 6, 8, 10, 12, etc.
 * - Row 12: Headers with "Nr.", "Übungen", "Notiz", "WH-Zahl:", "Sätze:" in columns 0-5
 *   - Also has "Einheit:" labels in columns 6, 8, 10, 12, etc. (NO - these should have been earlier!)
 * - Rows 13+: TRAINING DATA alternating Satz 1 and Satz 2
 *   - Satz 1 rows: Exercise name in col 1, "Satz: 1" in col 5, reps/weights in cols 6+
 *   - Satz 2 rows: Empty col 1, "Satz: 2" in col 5, reps/weights in cols 6+
 *
 * KEY INSIGHT: The "Einheit:" and date information needs to be added ABOVE row 12.
 * Looking at the real file structure again:
 * - The "Einheit:" and dates are in rows 8-10 area, NOT in row 12!
 * So the correct structure is:
 * - Row 8: "Trainingsziel:" label or metadata
 * - Row 9: Metadata values
 * - Row 10: Empty or "Einheit:" headers
 * - Row 11: "Datum:" row with dates
 * - Row 12: Column headers (Nr., Übungen, etc.)
 * - Rows 13+: Training data
 */

export function createTestData(config: {
  exerciseName: string;
  einheiten: Array<{
    einheitNum: string;
    satz1Reps?: number;
    satz1Weight?: number;
    satz2Reps?: number;
    satz2Weight?: number;
  }>;
  dates?: string[];
}): any[][] {
  const data: any[][] = [];

  // Rows 0-9: Setup/metadata rows
  for (let i = 0; i < 10; i++) {
    data.push(Array(20).fill(""));
  }

  // Row 10: "Einheit:" headers in columns 6, 8, 10, etc.
  const row10 = Array(20).fill("");
  let colIdx = 6;
  for (let i = 0; i < config.einheiten.length; i++) {
    row10[colIdx] = "Einheit:";
    row10[colIdx + 1] = config.einheiten[i].einheitNum;
    colIdx += 2;
  }
  data.push(row10);

  // Row 11: "Datum:" row with dates in columns 6, 8, 10, etc.
  const row11 = Array(20).fill("");
  row11[0] = "Datum:";
  colIdx = 6;
  for (
    let i = 0;
    i < config.einheiten.length && i < (config.dates?.length || 0);
    i++
  ) {
    row11[colIdx] = config.dates?.[i] || "";
    colIdx += 2;
  }
  data.push(row11);

  // Row 12: Column headers
  const row12 = Array(20).fill("");
  row12[0] = "Nr.";
  row12[1] = "Übungen";
  row12[2] = "Notiz";
  row12[4] = "WH-Zahl";
  row12[5] = "Sätze";
  // Row 12 also needs WH/KG headers in columns 6, 7, 8, 9, etc.
  colIdx = 6;
  for (let i = 0; i < config.einheiten.length; i++) {
    row12[colIdx] = "WH";
    row12[colIdx + 1] = "KG";
    colIdx += 2;
  }
  data.push(row12);

  // Row 13: Satz 1 (exercise name in col 1, "Satz: 1" in col 5)
  const row13 = Array(20).fill("");
  row13[1] = config.exerciseName;
  row13[5] = "Satz: 1";
  colIdx = 6;
  for (let i = 0; i < config.einheiten.length; i++) {
    const einheit = config.einheiten[i];
    row13[colIdx] = einheit.satz1Reps ?? "";
    row13[colIdx + 1] = einheit.satz1Weight ?? "";
    colIdx += 2;
  }
  data.push(row13);

  // Row 14: Satz 2 (empty col 1, "Satz: 2" in col 5)
  const row14 = Array(20).fill("");
  row14[5] = "Satz: 2";
  colIdx = 6;
  for (let i = 0; i < config.einheiten.length; i++) {
    const einheit = config.einheiten[i];
    row14[colIdx] = einheit.satz2Reps ?? "";
    row14[colIdx + 1] =
      einheit.satz2Weight === undefined ? undefined : einheit.satz2Weight;
    colIdx += 2;
  }
  data.push(row14);

  return data;
}

export function createMultiExerciseTestData(config: {
  exercises: Array<{
    name: string;
    einheiten: Array<{
      einheitNum: string;
      satz1Reps?: number;
      satz1Weight?: number;
      satz2Reps?: number;
      satz2Weight?: number;
    }>;
  }>;
  dates?: string[];
}): any[][] {
  const data: any[][] = [];

  // Rows 0-9: Setup/metadata rows
  for (let i = 0; i < 10; i++) {
    data.push(Array(20).fill(""));
  }

  // Row 10: "Einheit:" headers in columns 6, 8, 10, etc.
  const row10 = Array(20).fill("");
  let colIdx = 6;
  if (config.exercises.length > 0) {
    for (let i = 0; i < config.exercises[0].einheiten.length; i++) {
      row10[colIdx] = "Einheit:";
      row10[colIdx + 1] = config.exercises[0].einheiten[i].einheitNum;
      colIdx += 2;
    }
  }
  data.push(row10);

  // Row 11: "Datum:" row with dates in columns 6, 8, 10, etc.
  const row11 = Array(20).fill("");
  row11[0] = "Datum:";
  colIdx = 6;
  if (config.exercises.length > 0) {
    for (
      let i = 0;
      i < config.exercises[0].einheiten.length &&
      i < (config.dates?.length || 0);
      i++
    ) {
      row11[colIdx] = config.dates?.[i] || "";
      colIdx += 2;
    }
  }
  data.push(row11);

  // Row 12: Column headers
  const row12 = Array(20).fill("");
  row12[0] = "Nr.";
  row12[1] = "Übungen";
  row12[2] = "Notiz";
  row12[4] = "WH-Zahl";
  row12[5] = "Sätze";
  // Row 12 also needs WH/KG headers in columns 6, 7, 8, 9, etc.
  colIdx = 6;
  if (config.exercises.length > 0) {
    for (let i = 0; i < config.exercises[0].einheiten.length; i++) {
      row12[colIdx] = "WH";
      row12[colIdx + 1] = "KG";
      colIdx += 2;
    }
  }
  data.push(row12);

  // Rows 13+: Training data for each exercise (Satz 1, then Satz 2)
  for (let exIdx = 0; exIdx < config.exercises.length; exIdx++) {
    const exercise = config.exercises[exIdx];

    // Satz 1 row (exercise name in col 1, "Satz: 1" in col 5)
    const satz1Row = Array(20).fill("");
    satz1Row[1] = exercise.name;
    satz1Row[5] = "Satz: 1";
    colIdx = 6;
    for (let i = 0; i < exercise.einheiten.length; i++) {
      const einheit = exercise.einheiten[i];
      satz1Row[colIdx] = einheit.satz1Reps ?? "";
      satz1Row[colIdx + 1] = einheit.satz1Weight ?? "";
      colIdx += 2;
    }
    data.push(satz1Row);

    // Satz 2 row (empty col 1, "Satz: 2" in col 5)
    const satz2Row = Array(20).fill("");
    satz2Row[5] = "Satz: 2";
    colIdx = 6;
    for (let i = 0; i < exercise.einheiten.length; i++) {
      const einheit = exercise.einheiten[i];
      satz2Row[colIdx] = einheit.satz2Reps ?? "";
      satz2Row[colIdx + 1] =
        einheit.satz2Weight === undefined ? undefined : einheit.satz2Weight;
      colIdx += 2;
    }
    data.push(satz2Row);
  }

  return data;
}
