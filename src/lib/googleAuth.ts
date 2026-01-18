// Google OAuth and Drive API integration

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

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
  accessToken: string
): Promise<ArrayBuffer> {
  // First, get file metadata to determine if it's a Google Sheets file or uploaded file
  const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`;

  const metadataResponse = await fetch(metadataUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metadataResponse.ok) {    if (metadataResponse.status === 404) {
      throw new Error(
        `Datei nicht gefunden (404). Stellen Sie sicher, dass:\n` +
        `1. Die Datei mit Ihrem Google-Konto geteilt ist\n` +
        `2. Sie sich mit dem richtigen Konto angemeldet haben\n` +
        `3. Die Datei-ID korrekt ist`
      );
    }    throw new Error(
      `Drive API Fehler: ${metadataResponse.status} ${metadataResponse.statusText}`
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
    return token;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem("google_auth_token");
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
