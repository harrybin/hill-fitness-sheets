/// <reference path="./google-api.d.ts" />

import { Exercise, Session } from './types'
import * as XLSX from 'xlsx'

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

export async function downloadSheetAsXLSX(spreadsheetId: string): Promise<ArrayBuffer> {
  if (!accessToken) {
    throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.')
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.arrayBuffer()
  } catch (error) {
    console.error('Fehler beim Herunterladen der XLSX-Datei:', error)
    throw new Error('Fehler beim Herunterladen der Google Sheets Datei')
  }
}

export async function importExercisesFromXLSX(arrayBuffer: ArrayBuffer): Promise<Exercise[]> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('übung') || 
      name.toLowerCase().includes('exercise') ||
      name.toLowerCase().includes('muskel')
    ) || workbook.SheetNames[0]
    
    if (!sheetName) {
      throw new Error('Keine Arbeitsblätter in der Datei gefunden')
    }
    
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })
    
    if (data.length === 0) {
      throw new Error('Die Datei enthält keine Daten')
    }
    
    const exercises: Exercise[] = []
    let headerRowIndex = -1
    
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i]
      if (!row) continue
      
      const firstCell = String(row[0] || '').toLowerCase().trim()
      const secondCell = String(row[1] || '').toLowerCase().trim()
      
      if (
        (firstCell.includes('nr') && secondCell.includes('übung')) ||
        (firstCell.includes('number') && secondCell.includes('exercise')) ||
        (firstCell === 'nr' && (secondCell === 'übungen' || secondCell === 'übung'))
      ) {
        headerRowIndex = i
        break
      }
    }
    
    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0
    
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i]
      if (!row) continue
      
      const cellA = row[0]
      const cellB = row[1]
      const cellC = row[2]
      
      if (!cellB || String(cellB).trim() === '') continue
      
      const isNumericId = !isNaN(Number(cellA)) || String(cellA).trim() === ''
      
      let exerciseName: string
      let notes: string | undefined
      
      if (isNumericId) {
        exerciseName = String(cellB).trim()
        notes = cellC ? String(cellC).trim() : undefined
      } else {
        exerciseName = String(cellA).trim()
        notes = cellB ? String(cellB).trim() : undefined
      }
      
      if (exerciseName && exerciseName.length > 0) {
        exercises.push({
          id: `exercise-${Date.now()}-${i}`,
          name: exerciseName,
          notes: notes,
          order: exercises.length
        })
      }
    }
    
    return exercises
  } catch (error) {
    console.error('Fehler beim Parsen der XLSX-Datei:', error)
    throw new Error('Fehler beim Lesen der Excel-Datei')
  }
}
