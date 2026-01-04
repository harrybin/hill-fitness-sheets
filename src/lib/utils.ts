import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'
import { Exercise, Session } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function parseXLSX(arrayBuffer: ArrayBuffer): { 
  exercises: Exercise[], 
  sessions: Session[], 
  metadata: { trainingGoal?: string, legalNotice?: string, notes?: string } 
} {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('exercise') ||
    name.toLowerCase().includes('übung') ||
    name.toLowerCase().includes('training')
  ) || workbook.SheetNames[0]
  
  if (!sheetName) {
    throw new Error('No valid sheet found in the workbook')
  }
  
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })
  
  const exercises: Exercise[] = []
  const metadata: { trainingGoal?: string, legalNotice?: string, notes?: string } = {}
  
  const ignoredKeywords = [
    'trainingsziel', 'training goal',
    'rechtliche hinweise', 'legal notice',
    'bei bedarf', 'copyright', 'notiz', 'note'
  ]
  
  function isMetadataRow(text: string): boolean {
    const normalized = text.toLowerCase().trim()
    return ignoredKeywords.some(keyword => 
      normalized.includes(keyword) ||
      normalized.startsWith(keyword) ||
      normalized.startsWith(keyword + ' ')
    )
  }
  
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
    
    if (firstCell.includes('trainingsziel') || firstCell.includes('training goal')) {
      metadata.trainingGoal = String(row[1] || '').trim()
    } else if (firstCell.includes('rechtliche hinweise') || firstCell.includes('legal notice')) {
      metadata.legalNotice = String(row[1] || '').trim()
    } else if ((firstCell.includes('notiz') || firstCell.includes('note')) && !firstCell.includes('übung') && !secondCell.includes('übung')) {
      metadata.notes = String(row[1] || '').trim()
    }
  }
  
  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0
  
  for (let i = startIndex; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const cellA = row[0]
    const cellB = row[1]
    const cellC = row[2]
    
    const cellAStr = cellA !== null && cellA !== undefined ? String(cellA).trim() : ''
    const cellBStr = cellB !== null && cellB !== undefined ? String(cellB).trim() : ''
    const cellCStr = cellC !== null && cellC !== undefined ? String(cellC).trim() : ''
    
    const isNumericId = !isNaN(Number(cellA)) && cellAStr !== ''
    const hasEmptyCellA = cellAStr === ''
    
    let exerciseName: string = ''
    let notes: string | undefined
    
    if (isNumericId) {
      exerciseName = cellBStr
      notes = cellCStr !== '' ? cellCStr : undefined
    } else if (hasEmptyCellA) {
      exerciseName = cellBStr
      notes = cellCStr !== '' ? cellCStr : undefined
    } else {
      exerciseName = cellAStr
      notes = cellBStr !== '' ? cellBStr : undefined
    }
    
    if (
      exerciseName && 
      exerciseName.length > 0 && 
      exerciseName !== 'undefined' &&
      exerciseName.toLowerCase() !== 'undefined' &&
      !isMetadataRow(exerciseName)
    ) {
      exercises.push({
        id: `exercise-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: exerciseName,
        notes: notes,
        order: exercises.length
      })
    }
  }
  
  const historySheetName = workbook.SheetNames.find(name => 
    name === 'Training History' || 
    name.toLowerCase().includes('history') ||
    name.toLowerCase().includes('verlauf')
  )
  
  let sessions: Session[] = []
  
  if (historySheetName) {
    const historyWorksheet = workbook.Sheets[historySheetName]
    const historyData = XLSX.utils.sheet_to_json<any>(historyWorksheet, { header: 1 })
    
    if (historyData.length > 1) {
      const sessionsMap = new Map<string, Session>()
      
      for (let i = 1; i < historyData.length; i++) {
        const row = historyData[i]
        if (!row || row.length < 5) continue
        
        const date = String(row[0] || '').trim()
        const exerciseName = String(row[1] || '').trim()
        const setNumber = Number(row[2])
        const weight = Number(row[3])
        const reps = Number(row[4])
        
        if (!date || !exerciseName || isNaN(setNumber) || isNaN(weight) || isNaN(reps)) continue
        
        const exercise = exercises.find(e => e.name === exerciseName)
        if (!exercise) continue
        
        if (!sessionsMap.has(date)) {
          sessionsMap.set(date, { date, entries: [] })
        }
        
        const session = sessionsMap.get(date)!
        let entry = session.entries.find(e => e.exerciseId === exercise.id)
        
        if (!entry) {
          entry = {
            id: `${exercise.id}-${date}`,
            exerciseId: exercise.id,
            date: date,
            sets: []
          }
          session.entries.push(entry)
        }
        
        entry.sets.push({ setNumber, weight, reps })
      }
      
      sessions = Array.from(sessionsMap.values())
    }
  }
  
  return { exercises, sessions, metadata }
}

export function updateXLSXWithSessions(
  xlsxData: string,
  sessions: Session[],
  exercises: Exercise[]
): string {
  try {
    const arrayBuffer = base64ToArrayBuffer(xlsxData)
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const historySheetName = 'Training History'
    if (workbook.SheetNames.includes(historySheetName)) {
      delete workbook.Sheets[historySheetName]
      workbook.SheetNames = workbook.SheetNames.filter(name => name !== historySheetName)
    }
    
    const historyData: any[][] = [['Datum', 'Übung', 'Satz', 'Gewicht (kg)', 'Wiederholungen']]
    
    sessions
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach(session => {
        session.entries.forEach(entry => {
          const exercise = exercises.find(e => e.id === entry.exerciseId)
          const exerciseName = exercise?.name || 'Unbekannt'
          
          entry.sets.forEach(set => {
            historyData.push([
              session.date,
              exerciseName,
              set.setNumber,
              set.weight,
              set.reps
            ])
          })
        })
      })
    
    const historyWorksheet = XLSX.utils.aoa_to_sheet(historyData)
    XLSX.utils.book_append_sheet(workbook, historyWorksheet, historySheetName)
    
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return arrayBufferToBase64(wbout)
  } catch (error) {
    console.error('Failed to update XLSX:', error)
    return xlsxData
  }
}
