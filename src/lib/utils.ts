import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'
import { Exercise, Session, TrainingSet } from '@/lib/types'

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
  exercises: Exercise[]
  metadata: { trainingGoal?: string, legalNotice?: string, notes?: string }
  sessions: Session[]
} {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('übung') || 
    name.toLowerCase().includes('exercise')
  ) || workbook.SheetNames[0]
  
  if (!sheetName) {
    throw new Error('Keine gültige Übungsliste gefunden')
  }
  
  const worksheet = workbook.Sheets[sheetName]
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  const exercises: Exercise[] = []
  const metadata: { trainingGoal?: string, legalNotice?: string, notes?: string } = {}
  
  const ignoredKeywords = [
    'trainingsziel',
    'rechtliche hinweise',
    'bei bedarf',
    'copyright',
    'notes',
    'notizen',
    'hinweise'
  ]
  
  const isMetadataRow = (text: string): boolean => {
    if (!text) return false
    const lowerText = text.toLowerCase().trim()
    return ignoredKeywords.some(keyword => lowerText.includes(keyword))
  }
  
  let startIndex = 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const firstCell = String(row[0] || '').toLowerCase()
    const secondCell = String(row[1] || '').toLowerCase()
    
    if (
      (firstCell.includes('number') && secondCell.includes('exercise')) ||
      (firstCell.includes('nummer') && secondCell.includes('übung'))
    ) {
      startIndex = i + 1
      break
    }
    
    if (firstCell.includes('trainingsziel')) {
      metadata.trainingGoal = String(row[1] || '').trim()
    } else if (firstCell.includes('rechtliche hinweise') || firstCell.includes('hinweise')) {
      metadata.legalNotice = String(row[1] || '').trim()
    } else if (firstCell.includes('notes') || firstCell.includes('notizen')) {
      metadata.notes = String(row[1] || '').trim()
    }
  }
  
  for (let i = startIndex; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const cellA = row[0]
    const cellB = row[1]
    const cellC = row[2]
    
    const cellBStr = String(cellB || '').trim()
    const cellCStr = String(cellC || '').trim()
    
    const isNumericId = !isNaN(Number(cellA)) && Number(cellA) > 0
    
    let exerciseName = ''
    let notes: string | undefined
    
    if (isNumericId) {
      notes = cellCStr !== '' ? cellCStr : undefined
      exerciseName = cellBStr
    } else {
      exerciseName = String(cellA || '').trim()
    }
    
    if (
      exerciseName && 
      exerciseName !== '' && 
      !isMetadataRow(exerciseName)
    ) {
      exercises.push({
        id: `ex-${exercises.length + 1}`,
        name: exerciseName,
        notes,
        order: exercises.length
      })
    }
  }
  
  let sessions: Session[] = []
  const historySheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('history') || 
    name.toLowerCase().includes('historie')
  )
  
  if (historySheetName) {
    const historyWorksheet = workbook.Sheets[historySheetName]
    const historyData: any[][] = XLSX.utils.sheet_to_json(historyWorksheet, { header: 1 })
    
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
            date,
            sets: []
          }
          session.entries.push(entry)
        }
        
        entry.sets.push({ setNumber, weight, reps })
      }
      
      sessions = Array.from(sessionsMap.values())
    }
  }
  
  return { exercises, metadata, sessions }
}

export function updateXLSXWithSessions(
  xlsxData: string,
  sessions: Session[],
  exercises: Exercise[]
): string {
  try {
    const arrayBuffer = base64ToArrayBuffer(xlsxData)
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const historySheetName = 'History'
    
    if (workbook.SheetNames.includes(historySheetName)) {
      workbook.SheetNames = workbook.SheetNames.filter(name => name !== historySheetName)
      delete workbook.Sheets[historySheetName]
    }
    
    const historyData: any[][] = [
      ['Date', 'Exercise', 'Set', 'Weight', 'Reps']
    ]
    
    sessions
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach(session => {
        session.entries.forEach(entry => {
          const exercise = exercises.find(e => e.id === entry.exerciseId)
          if (!exercise) return
          
          entry.sets.forEach(set => {
            historyData.push([
              session.date,
              exercise.name,
              set.setNumber,
              set.weight,
              set.reps
            ])
          })
        })
      })
    
    const historyWorksheet = XLSX.utils.aoa_to_sheet(historyData)
    XLSX.utils.book_append_sheet(workbook, historyWorksheet, historySheetName)
    
    const newArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    return arrayBufferToBase64(newArrayBuffer as ArrayBuffer)
  } catch (error) {
    console.error('Error updating XLSX:', error)
    return xlsxData
  }
}
