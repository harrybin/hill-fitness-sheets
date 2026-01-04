declare namespace gapi {
  namespace client {
    function init(args: {
      apiKey: string
      discoveryDocs: string[]
    }): Promise<void>

    namespace sheets {
      namespace spreadsheets {
        function get(args: {
          spreadsheetId: string
        }): Promise<{
          result: {
            spreadsheetId: string
            properties?: any
            sheets?: any[]
          }
        }>

        namespace values {
          function get(args: {
            spreadsheetId: string
            range: string
          }): Promise<{
            result: {
              range: string
              majorDimension?: string
              values?: any[][]
            }
          }>

          function update(args: {
            spreadsheetId: string
            range: string
            valueInputOption: string
            resource: {
              values: any[][]
            }
          }): Promise<{
            result: {
              updatedCells?: number
              updatedColumns?: number
              updatedRows?: number
            }
          }>

          function clear(args: {
            spreadsheetId: string
            range: string
          }): Promise<{
            result: {
              clearedRange?: string
            }
          }>
        }
      }
    }
  }

  function load(api: string, callback: () => void): void
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token?: string
        error?: string
        expires_in?: number
        token_type?: string
        scope?: string
      }

      interface TokenClient {
        callback: (response: TokenResponse) => void
        requestAccessToken: (options?: { prompt?: string }) => void
      }

      function initTokenClient(config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
      }): TokenClient

      function revoke(token: string, callback: () => void): void
    }
  }
}

interface Window {
  gapi: typeof gapi
  google: typeof google
}
