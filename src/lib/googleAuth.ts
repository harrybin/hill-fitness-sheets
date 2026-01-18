// Google OAuth and Drive API integration

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

export interface GoogleAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at: number;
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

export function initGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("VITE_GOOGLE_CLIENT_ID nicht konfiguriert"));
      return;
    }

    if (typeof google === "undefined" || !google.accounts) {
      // Load Google Identity Services script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Google Auth Script konnte nicht geladen werden"));
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

export function requestGoogleAuth(): Promise<GoogleAuthToken> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("VITE_GOOGLE_CLIENT_ID nicht konfiguriert"));
      return;
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          const token: GoogleAuthToken = {
            access_token: response.access_token,
            expires_in: parseInt(response.expires_in || "3600"),
            token_type: response.token_type || "Bearer",
            scope: response.scope || SCOPES,
            expires_at:
              Date.now() + parseInt(response.expires_in || "3600") * 1000,
          };

          resolve(token);
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      reject(error);
    }
  });
}

export async function downloadFileFromDrive(
  fileId: string,
  accessToken: string,
): Promise<ArrayBuffer> {
  // First, get file metadata to determine if it's a Google Sheets file or uploaded file
  const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`;

  const metadataResponse = await fetch(metadataUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metadataResponse.ok) {
    if (metadataResponse.status === 404) {
      throw new Error(
        `Datei nicht gefunden (404). Stellen Sie sicher, dass:\n` +
          `1. Die Datei mit Ihrem Google-Konto geteilt ist\n` +
          `2. Sie sich mit dem richtigen Konto angemeldet haben\n` +
          `3. Die Datei-ID korrekt ist`,
      );
    }
    throw new Error(
      `Drive API Fehler: ${metadataResponse.status} ${metadataResponse.statusText}`,
    );
  }

  const metadata = await metadataResponse.json();
  const mimeType = metadata.mimeType;

  let url: string;

  // Check if it's a Google Sheets file or an uploaded file
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    // Native Google Sheets - use export endpoint
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
  } else {
    // Uploaded file (e.g., .xlsx) - use direct download
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive API Fehler: ${response.status} - ${errorText}`);
  }

  return response.arrayBuffer();
}

export function saveToken(token: GoogleAuthToken): void {
  localStorage.setItem("google_auth_token", JSON.stringify(token));
}

export function loadToken(): GoogleAuthToken | null {
  const tokenStr = localStorage.getItem("google_auth_token");
  if (!tokenStr) return null;

  try {
    const token = JSON.parse(tokenStr) as GoogleAuthToken;
    // Check if token is expired
    if (token.expires_at && token.expires_at < Date.now()) {
      localStorage.removeItem("google_auth_token");
      return null;
    }

    // Check if token has required scopes (especially 'spreadsheets' for Sheets API)
    const requiredScopes = ["spreadsheets"];
    const tokenScopes = (token.scope || "").split(" ");
    const hasRequiredScopes = requiredScopes.some((scope) =>
      tokenScopes.some((ts) => ts.includes(scope)),
    );

    if (!hasRequiredScopes) {
      // Token exists but doesn't have required scopes - need to re-authenticate
      console.warn("Token missing required scopes. Clearing cached token.");
      localStorage.removeItem("google_auth_token");
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem("google_auth_token");
}

/**
 * Fetches exercise and session data directly from a Google Sheet using the Sheets API.
 * Reads the first available "Einheit" sheet and parses exercise/session data.
 * Returns data as a 2D array format compatible with XLSX parsing logic.
 */
export async function fetchExercisesFromSheetsAPI(
  spreadsheetId: string,
  accessToken: string,
): Promise<ArrayBuffer> {
  try {
    // Step 1: Get spreadsheet metadata to find sheets
    const metadataResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!metadataResponse.ok) {
      if (metadataResponse.status === 403) {
        throw new Error(
          "Keine Berechtigung zum Zugriff auf Google Sheets. Bitte melden Sie sich mit dem richtigen Konto an.",
        );
      }
      if (metadataResponse.status === 404) {
        throw new Error(
          "Google Sheet nicht gefunden. Überprüfen Sie die Datei-ID.",
        );
      }
      const errorText = await metadataResponse.text();
      throw new Error(
        `Metadaten konnten nicht abgerufen werden: ${metadataResponse.status} - ${errorText}`,
      );
    }

    const metadata = await metadataResponse.json();
    const sheets = metadata.sheets || [];

    if (sheets.length === 0) {
      throw new Error("Das Google Sheet enthält keine Arbeitsblätter");
    }

    // Find the first "Einheit" sheet (or use first sheet if none found)
    let targetSheet = sheets.find((sheet: Record<string, unknown>) =>
      (sheet.properties as Record<string, string>)?.title
        ?.toLowerCase()
        .includes("einheit"),
    );

    if (!targetSheet) {
      // Fallback to first sheet with most content
      targetSheet = sheets[0];
    }

    const sheetTitle = (targetSheet.properties as Record<string, string>).title;

    // Step 2: Read data from the sheet (up to first 1000 rows to capture all exercises and sessions)
    const dataResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z1000?valueRenderOption=FORMATTED_VALUE`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      throw new Error(
        `Blatt-Daten konnten nicht abgerufen werden: ${dataResponse.status} - ${errorText}`,
      );
    }

    const data = await dataResponse.json();
    const values = data.values || [];

    if (values.length === 0) {
      throw new Error("Das Google Sheet ist leer oder unlesbar");
    }

    // Step 3: Convert 2D array to ArrayBuffer (XLSX-compatible format)
    // We'll create a minimal XLSX that can be parsed by the existing parseXLSX function
    // Import ExcelJS dynamically to create workbook
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetTitle);

    // Add all rows from the Sheets API response
    values.forEach((row: (string | number | boolean | null | undefined)[]) => {
      worksheet.addRow(row);
    });

    // Convert to ArrayBuffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as ArrayBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Fehler beim Import aus Google Sheets API");
  }
}

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google {
    namespace accounts {
      namespace oauth2 {
        interface TokenClient {
          requestAccessToken(options?: { prompt?: string }): void;
        }

        interface TokenResponse {
          access_token: string;
          expires_in?: string;
          token_type?: string;
          scope?: string;
          error?: string;
          error_description?: string;
        }

        function initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (response: TokenResponse) => void;
        }): TokenClient;
      }
    }
  }
}
