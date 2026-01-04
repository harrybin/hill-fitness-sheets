/// <reference path="./google-api.d.ts" />

import { Exercise, Session } from './types'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let accessToken: string | null = null

export interface SheetConfig {
  spreadsheetId: string
  exerciseRange?: string
  dataRange?: string
}

export function initializeGoogleAPI() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window.gapi === 'undefined') {
      reject(new Error('Google API nicht geladen'))
      return
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
}

export function initializeTokenClient(callback: (response: google.accounts.oauth2.TokenResponse) => void) {
  if (typeof window.google === 'undefined' || !window.google.accounts?.oauth2) {
    throw new Error('Google Identity Services nicht geladen')
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.access_token) {
        accessToken = response.access_token
      }
      callback(response)
    },
  })
}

export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token Client nicht initialisiert'))
      return
    }

    if (accessToken) {
      resolve(accessToken)
      return
    }

    const originalCallback = tokenClient.callback
    tokenClient.callback = (response) => {
      if (originalCallback) {
        originalCallback(response)
      }
      
      if (response.error) {
        reject(new Error(response.error))
      } else if (response.access_token) {
        accessToken = response.access_token
        resolve(response.access_token)
      } else {
        reject(new Error('Kein Access Token erhalten'))
      }
    }

    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function revokeAccessToken() {
  if (accessToken && typeof window.google !== 'undefined' && window.google.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null
    })
  }
}

export function hasAccessToken(): boolean {
  return !!accessToken
}

export async function fetchExercisesFromSheet(config: SheetConfig): Promise<Exercise[]> {
  if (!accessToken) {
    throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.')
  }

  const range = config.exerciseRange || 'Sheet1!A:B'

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: range,
    })

    const rows = response.result.values || []
    
    if (rows.length === 0) {
      return []
    }

    const exercises: Exercise[] = []
    let startIndex = 0

    if (rows[0] && (
      rows[0][0]?.toLowerCase().includes('übung') ||
      rows[0][0]?.toLowerCase().includes('exercise') ||
      rows[0][0]?.toLowerCase().includes('name')
    )) {
      startIndex = 1
    }

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row[0] || row[0].trim() === '') continue

      const exerciseName = row[0].trim()
      const notes = row[1]?.trim() || undefined

      exercises.push({
        id: `exercise-${Date.now()}-${i}`,
        name: exerciseName,
        notes: notes,
        order: i - startIndex,
      })
    }

    return exercises
  } catch (error) {
    console.error('Fehler beim Abrufen der Übungen:', error)
    throw new Error('Fehler beim Laden der Übungen aus Google Sheets')
  }
}

export async function syncSessionsToSheet(
  config: SheetConfig,
  sessions: Session[],
  exercises: Exercise[]
): Promise<void> {
  if (!accessToken) {
    throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.')
  }

  const dataRange = config.dataRange || 'Trainings!A:Z'

  try {
    const headers = ['Datum', 'Übung']
    const maxSets = Math.max(
      ...sessions.flatMap(s => s.entries.map(e => e.sets.length)),
      2
    )

    for (let i = 1; i <= maxSets; i++) {
      headers.push(`Satz ${i} Gewicht (kg)`)
      headers.push(`Satz ${i} Wiederholungen`)
    }

    const rows: any[][] = [headers]

    sessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(session => {
        session.entries.forEach(entry => {
          const exercise = exercises.find(ex => ex.id === entry.exerciseId)
          if (!exercise) return

          const row: any[] = [
            session.date,
            exercise.name,
          ]

          entry.sets
            .sort((a, b) => a.setNumber - b.setNumber)
            .forEach(set => {
              row.push(set.weight)
              row.push(set.reps)
            })

          while (row.length < headers.length) {
            row.push('')
          }

          rows.push(row)
        })
      })

    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: config.spreadsheetId,
      range: dataRange,
    })

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: dataRange,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    })
  } catch (error) {
    console.error('Fehler beim Synchronisieren der Sessions:', error)
    throw new Error('Fehler beim Speichern der Trainingsdaten in Google Sheets')
  }
}

export async function testSheetAccess(spreadsheetId: string): Promise<boolean> {
  if (!accessToken) {
    throw new Error('Nicht authentifiziert')
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    })
    return !!response.result.spreadsheetId
  } catch (error) {
    console.error('Fehler beim Zugriff auf Sheet:', error)
    return false
  }
}
