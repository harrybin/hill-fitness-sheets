import { Exercise, Session } from "./types";

/**
 * Exports training session data directly to a Google Sheet using the Sheets API.
 * Writes data to the first Einheit sheet found, similar to the XLSX export logic.
 * Uses batchUpdate to directly modify the document without creating a new file.
 */
export async function exportToGoogleSheetDirectly(params: {
  spreadsheetId: string;
  sessions: Session[];
  exercises: Exercise[];
  accessToken: string;
}): Promise<{
  successfulSessions: string[];
  failedSessions: { date: string; error: string }[];
  partialExercises: {
    sessionDate: string;
    exerciseName: string;
    error: string;
  }[];
}> {
  try {
    const { spreadsheetId, sessions, exercises, accessToken } = params;

    console.log("🔄 Starting Google Sheets export");
    console.log(`  Spreadsheet ID: ${spreadsheetId}`);
    console.log(`  Sessions: ${sessions.length}`);
    console.log(`  Exercises: ${exercises.length}`);

    // Step 1: Get spreadsheet metadata to find sheet IDs and Einheit columns
    const metadataResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();

      // 403 Forbidden usually means missing scopes
      if (metadataResponse.status === 403) {
        throw new Error(
          "Keine Berechtigung zum Zugriff auf Google Sheets. Bitte melden Sie sich erneut an.",
        );
      }

      throw new Error(
        `Spreadsheet-Metadaten konnten nicht abgerufen werden: ${metadataResponse.status} - ${errorText}`,
      );
    }

    const metadata = await metadataResponse.json();
    const sheets = metadata.sheets || [];

    // Find the first "Einheit" sheet
    const einheitSheet = sheets.find((sheet: Record<string, unknown>) =>
      (sheet.properties as Record<string, string>)?.title
        ?.toLowerCase()
        .includes("einheit"),
    );

    if (!einheitSheet) {
      throw new Error("Kein 'Einheit' Sheet gefunden");
    }

    const sheetTitle = (einheitSheet.properties as Record<string, string>)
      .title;

    // Step 2: Get the data from the sheet to find Einheit columns and exercise rows
    const dataResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1:Z100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      throw new Error(
        `Daten konnten nicht abgerufen werden: ${dataResponse.status} - ${errorText}`,
      );
    }

    const data = await dataResponse.json();
    const values = data.values || [];

    // Helper to get cell text, handling undefined
    const getCellText = (val: unknown): string => {
      if (val == null) return "";
      return String(val).toLowerCase().trim();
    };

    // Find Einheit columns (WH/KG pairs)
    const einheitCols: Record<number, { whCol: number; kgCol: number }> = {};
    for (let row = 0; row < Math.min(20, values.length); row++) {
      const rowData = (values[row] as unknown[]) || [];
      for (let col = 0; col < rowData.length - 1; col++) {
        const cellText = getCellText(rowData[col]);
        const nextCellText = getCellText(rowData[col + 1]);

        if (cellText === "wh" && nextCellText === "kg") {
          // Convert to 1-based column index
          einheitCols[col + 1] = {
            whCol: col + 1,
            kgCol: col + 2,
          };
        }
      }
    }

    if (Object.keys(einheitCols).length === 0) {
      throw new Error("Keine Einheit-Spalten (WH/KG) gefunden");
    }

    // Step 3: Find exercise start row and Datum row
    let startRow = 0;
    let datumRow = -1;

    for (let row = 0; row < Math.min(30, values.length); row++) {
      const rowData = (values[row] as unknown[]) || [];
      for (let col = 0; col < rowData.length; col++) {
        const cellText = getCellText(rowData[col]);

        // Find "Satz 1" or "Satz: 1" to identify exercise data start
        if (
          startRow === 0 &&
          cellText.includes("satz") &&
          (cellText.includes(": 1") || cellText.includes(" 1"))
        ) {
          startRow = row + 1; // Convert to 1-based
        }

        // Find Datum row
        if (datumRow === -1 && cellText.includes("datum")) {
          datumRow = row + 1; // Convert to 1-based
        }
      }
    }

    if (startRow === 0) {
      throw new Error("Übungs-Startreihe nicht gefunden");
    }

    // Track which exercises and sessions succeeded
    const syncResults = {
      successfulSessions: [] as string[],
      failedSessions: [] as { date: string; error: string }[],
      partialExercises: [] as {
        sessionDate: string;
        exerciseName: string;
        error: string;
      }[],
    };

    const maxSessions = Object.keys(einheitCols).length;
    const recentSessions = sessions
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, maxSessions)
      .reverse(); // Reverse to get chronological order

    const sortedCols = Object.keys(einheitCols)
      .map((k) => parseInt(k))
      .sort((a, b) => a - b);

    const exercisesToExport = exercises;

    // Process each session separately for robustness
    for (let sIdx = 0; sIdx < recentSessions.length; sIdx++) {
      try {
        const session = recentSessions[sIdx];
        const whColNumber = sortedCols[sIdx];
        if (!whColNumber) continue;

        const colInfo = einheitCols[whColNumber];
        if (!colInfo) continue;

        const whWriteCol = colInfo.whCol;
        const kgWriteCol = colInfo.kgCol;

        // Write date once at the beginning
        if (datumRow > 0) {
          const cellRange = `${numberToLetter(whWriteCol)}${datumRow}`;
          const [year, month, day] = session.date.split("-");
          const formattedDate = `${day}.${month}.${year}`;

          try {
            const dateBody = {
              data: [
                {
                  range: `'${sheetTitle}'!${cellRange}`,
                  values: [[formattedDate]],
                },
              ],
              valueInputOption: "RAW",
            };

            await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(dateBody),
              },
            );
          } catch (e) {
            console.debug("Date write error:", e);
          }
        }

        // Send requests by exercise group (each exercise waits for its batch)
        for (const exercise of exercisesToExport) {
          const exerciseIdx = exercisesToExport.indexOf(exercise);
          try {
            const entry = session.entries.find(
              (e) => e.exerciseId === exercise.id,
            );
            const sortedSets = entry
              ? [...entry.sets].sort((a, b) => a.setNumber - b.setNumber)
              : [];

            // Build this exercise's requests
            const exerciseRequests: any[] = [];

            const exerciseRowIdx1 = startRow + exerciseIdx * 2;
            const exerciseRowIdx2 = startRow + exerciseIdx * 2 + 1;

            // Set 1 (Satz 1)
            if (sortedSets.length > 0) {
              const set1 = sortedSets[0];

              const repsCellRange = `${numberToLetter(whWriteCol)}${exerciseRowIdx1}`;
              const weightCellRange = `${numberToLetter(kgWriteCol)}${exerciseRowIdx1}`;

              exerciseRequests.push({
                range: `'${sheetTitle}'!${repsCellRange}`,
                values: [[Number(set1.reps)]],
              });

              exerciseRequests.push({
                range: `'${sheetTitle}'!${weightCellRange}`,
                values: [[Number(set1.weight)]],
              });
            }

            // Set 2 (Satz 2)
            if (sortedSets.length > 1) {
              const set2 = sortedSets[1];
              const repsCellRange = `${numberToLetter(whWriteCol)}${exerciseRowIdx2}`;

              exerciseRequests.push({
                range: `'${sheetTitle}'!${repsCellRange}`,
                values: [[Number(set2.reps)]],
              });
            }

            // Send and wait for this exercise's batch
            if (exerciseRequests.length > 0) {
              const exerciseResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    data: exerciseRequests,
                    valueInputOption: "RAW",
                  }),
                },
              );

              if (!exerciseResponse.ok) {
                const errorText = await exerciseResponse.text();
                if (
                  !errorText.includes("geschützte Zelle") &&
                  !errorText.includes("protected")
                ) {
                  syncResults.partialExercises.push({
                    sessionDate: session.date,
                    exerciseName: exercise.name,
                    error: `API error: ${errorText.substring(0, 100)}`,
                  });
                }
              }
            }
          } catch (exerciseError) {
            const errorMsg =
              exerciseError instanceof Error
                ? exerciseError.message
                : "Unknown error";
            syncResults.partialExercises.push({
              sessionDate: session.date,
              exerciseName: exercise.name,
              error: errorMsg,
            });
          }
        }

        // Mark session as successful
        syncResults.successfulSessions.push(session.date);
      } catch (sessionError) {
        const errorMsg =
          sessionError instanceof Error
            ? sessionError.message
            : "Unbekannter Fehler";
        syncResults.failedSessions.push({
          date: recentSessions[sIdx]?.date || "unknown",
          error: errorMsg,
        });
      }
    }

    // Return results summary
    console.log("✅ Export complete:", {
      successfulSessions: syncResults.successfulSessions.length,
      failedSessions: syncResults.failedSessions.length,
      partialExercises: syncResults.partialExercises.length,
    });
    return syncResults;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    throw new Error(`Google Sheets Export Fehler: ${errorMsg}`);
  }
}

/**
 * Converts a column number (1-based) to Excel column letter(s).
 * Example: 1 -> "A", 26 -> "Z", 27 -> "AA"
 */
function numberToLetter(colNumber: number): string {
  let letter = "";
  let num = colNumber;

  while (num > 0) {
    num -= 1;
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26);
  }

  return letter;
}
