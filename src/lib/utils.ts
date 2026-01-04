import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'
import { Exercise, Session } from '@/lib/types'

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
  metadata: {
    trainingGoal?: string
    legalNotice?: string
    notes?: string
  }
  sessions: Session[]
} {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('übungen') || 
    name.toLowerCase().includes('ubungen') ||
    name.toLowerCase().includes('exercise')
  ) || workbook.SheetNames[0]
  
  if (!sheetName) {
    throw new Error('Keine Übungsblatt gefunden')
  }
  
  const worksheet = workbook.Sheets[sheetName]
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  const exercises: Exercise[] = []
  const metadata: {
    trainingGoal?: string
    legalNotice?: string
    notes?: string
  } = {}
  
  const ignoredKeywords = [
    'trainingsziel',
    'training goal',
    'rechtliche hinweise',
    'legal notice',
    'hinweise',
    'notizen',
    'notes',
    'bei bedarf',
    'copyright'
  ]
  
  const isMetadataRow = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim()
    return ignoredKeywords.some(keyword => lowerText.includes(keyword))
  }
  
  let startIndex = 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    
    const secondCell = String(row[1] || '').toLowerCase().trim()
    if (
      secondCell.includes('übung') || 
      secondCell.includes('ubung') ||
      secondCell.includes('exercise')
    ) {
      startIndex = i + 1
      break
    }
  }
  
  for (let i = 0; i < startIndex; i++) {
    const row = data[i]
    const firstCell = String(row[0] || '').trim()
    const secondCell = String(row[1] || '').trim()
    
    if (firstCell.toLowerCase().includes('trainingsziel') || firstCell.toLowerCase().includes('training goal')) {
      metadata.trainingGoal = secondCell
    } else if (firstCell.toLowerCase().includes('rechtliche hinweise') || firstCell.toLowerCase().includes('legal notice')) {
      metadata.legalNotice = secondCell
    } else if (firstCell.includes('notes') || firstCell.toLowerCase().includes('notizen')) {
      metadata.notes = secondCell
    }
  }
  
  for (let i = startIndex; i < data.length; i++) {
    const row = data[i]
    
    const cellAStr = String(row[0] || '').trim()
    const cellBStr = String(row[1] || '').trim()
    const cellCStr = String(row[2] || '').trim()
    
    const isNumericId = !isNaN(Number(cellAStr)) && cellAStr !== ''
    let exerciseName = ''
    let notes = ''
    
    if (isNumericId) {
      exerciseName = cellBStr
      notes = cellCStr
    } else {
      exerciseName = cellAStr
      notes = cellBStr
    }
    
    if (
      exerciseName && 
      exerciseName.length > 0 &&
      !isMetadataRow(exerciseName)
    ) {
      exercises.push({
        id: `ex-${exercises.length + 1}`,
        name: exerciseName,
        order: exercises.length,
        notes,
      })
    }
  }
  
  const sessions: Session[] = []
  const historySheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('historie') || 
    name.toLowerCase().includes('history')
  )
  
  if (historySheetName) {
    const historyData: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[historySheetName], { header: 1 })
    
    for (let i = 1; i < historyData.length; i++) {
      try {
        const row = historyData[i]
        
        const dateStr = String(row[0] || '').trim()
        const exerciseName = String(row[1] || '').trim()
        const setNumber = Number(row[2])
        const weight = Number(row[3])
        const reps = Number(row[4])
        
        if (!dateStr || !exerciseName || isNaN(setNumber) || isNaN(weight) || isNaN(reps)) continue
        
        const exercise = exercises.find(ex => 
          ex.name.toLowerCase() === exerciseName.toLowerCase()
        )
        if (!exercise) continue
        
        if (!sessions.find(s => s.date === dateStr)) {
          sessions.push({ date: dateStr, entries: [] })
        }
        
        const session = sessions.find(s => s.date === dateStr)!
        let entry = session.entries.find(e => e.exerciseId === exercise.id)
        
        if (!entry) {
          entry = {
            id: `entry-${dateStr}-${exercise.id}`,
            exerciseId: exercise.id,
            date: dateStr,
            sets: []
          }
          session.entries.push(entry)
        }
        
        entry.sets.push({ setNumber, weight, reps })
      } catch (error) {
        console.error('Error parsing history row:', error)
      }
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
    const workbook = XLSX.read(base64ToArrayBuffer(xlsxData), { type: 'array' })
    const historySheetName = 'Historie'
    
    if (workbook.Sheets[historySheetName]) {
      delete workbook.Sheets[historySheetName]
      workbook.SheetNames = workbook.SheetNames.filter(name => name !== historySheetName)
    }
    
    const historyData: any[][] = [
      ['Datum', 'Übung', 'Satz', 'Gewicht', 'Wiederholungen']
    ]
    
    sessions.forEach(session => {
      session.entries.forEach(entry => {
        const exercise = exercises.find(ex => ex.id === entry.exerciseId)
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
    
    const newSheet = XLSX.utils.aoa_to_sheet(historyData)
    XLSX.utils.book_append_sheet(workbook, newSheet, historySheetName)
    
    const updatedBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    return arrayBufferToBase64(updatedBuffer)
  } catch (error) {
    console.error('Error updating XLSX:', error)
    return xlsxData
  }
}
