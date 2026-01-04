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
    
    if (secondCell === 'ubungen' || secondCell === 'exercises' || secondCell === 'übungen') {
      startIndex = i + 1
      break
    }
    
    const cellBStr = String(row[1] || '').trim()
    
    if (cellBStr && isMetadataRow(cellBStr)) {
      const value = String(row[2] || '').trim()
      const lowerCellB = cellBStr.toLowerCase()
      
      if (lowerCellB.includes('trainingsziel') || lowerCellB.includes('training goal')) {
        metadata.trainingGoal = value
      } else if (lowerCellB.includes('rechtliche') || lowerCellB.includes('legal')) {
        metadata.legalNotice = value
      } else if (lowerCellB.includes('hinweise') || lowerCellB.includes('notiz') || lowerCellB.includes('notes')) {
        if (!metadata.legalNotice) {
          metadata.notes = value
        }
      }
    }
  }
  
  for (let i = startIndex; i < data.length; i++) {
    const row = data[i]
    
    if (!row || row.length === 0) continue
    
    const cellBStr = String(row[1] || '').trim()
    
    if (!cellBStr || cellBStr === '') continue
    
    if (isMetadataRow(cellBStr)) continue
    
    const exerciseName = cellBStr
    const notes = String(row[2] || '').trim()
    
    exercises.push({
      id: `exercise-${i}`,
      name: exerciseName,
      notes: notes || undefined,
      order: exercises.length
    })
  }
  
  console.log(`Parsed ${exercises.length} exercises from sheet "${sheetName}"`)
  
  const sessions: Session[] = []
  
  const historySheetName = workbook.SheetNames.find(name =>
    name.toLowerCase().includes('history') ||
    name.toLowerCase().includes('historie')
  )
  
  const parseExcelDate = (value: any): string | null => {
    if (!value) return null
    
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed
      }
      
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('.')
        return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
      
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('/')
        const month = parts[0].padStart(2, '0')
        const day = parts[1].padStart(2, '0')
        return `${parts[2]}-${month}-${day}`
      }
    }
    
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30)
      const date = new Date(excelEpoch.getTime() + value * 86400000)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    } catch (e) {
      return null
    }
    
    return null
  }
  
  if (historySheetName) {
    try {
      const historyData: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[historySheetName], { header: 1 })
      
      console.log(`Parsing ${historyData.length - 1} history rows from sheet "${historySheetName}"`)
      
      for (let i = 1; i < historyData.length; i++) {
        const row = historyData[i]
        if (!row || row.length < 4) continue
        
        const dateStr = parseExcelDate(row[0])
        if (!dateStr) {
          console.warn(`Row ${i}: Invalid date format:`, row[0])
          continue
        }
        
        const exerciseName = String(row[1] || '').trim()
        const weight = parseFloat(String(row[2] || '0'))
        const reps = parseInt(String(row[3] || '0'))
        const setNumber = parseInt(String(row[4] || '1'))
        
        if (!exerciseName || isNaN(weight) || isNaN(reps)) {
          console.warn(`Row ${i}: Invalid data:`, { exerciseName, weight, reps })
          continue
        }
        
        const exercise = exercises.find(ex => 
          ex.name.toLowerCase() === exerciseName.toLowerCase()
        )
        
        if (!exercise) {
          console.warn(`Row ${i}: Exercise "${exerciseName}" not found in exercise list`)
          continue
        }
        
        let session = sessions.find(s => s.date === dateStr)
        if (!session) {
          session = { date: dateStr, entries: [] }
          sessions.push(session)
        }
        
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
        
        entry.sets.push({
          setNumber: setNumber || entry.sets.length + 1,
          weight,
          reps
        })
      }
      
      console.log(`Successfully imported ${sessions.length} sessions with history data`)
      if (sessions.length > 0) {
        console.log('Session dates:', sessions.map(s => s.date).sort())
        const totalEntries = sessions.reduce((sum, s) => sum + s.entries.length, 0)
        const totalSets = sessions.reduce((sum, s) => 
          sum + s.entries.reduce((eSum, e) => eSum + e.sets.length, 0), 0
        )
        console.log(`Total entries: ${totalEntries}, Total sets: ${totalSets}`)
      }
    } catch (error) {
      console.error('Error parsing history:', error)
    }
  } else {
    console.warn('No history sheet found in workbook. Available sheets:', workbook.SheetNames)
  }
  
  return { exercises, metadata, sessions }
}

export function updateXLSXWithSessions(
  base64Data: string,
  sessions: Session[],
  exercises: Exercise[]
): string {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data)
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const historySheetName = 'History'
    if (workbook.SheetNames.includes(historySheetName)) {
      delete workbook.Sheets[historySheetName]
      workbook.SheetNames = workbook.SheetNames.filter(name => name !== historySheetName)
    }
    
    const historyData: any[][] = [
      ['Date', 'Exercise', 'Weight', 'Reps', 'Set']
    ]
    
    const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
    
    sortedSessions.forEach(session => {
      session.entries.forEach(entry => {
        const exercise = exercises.find(ex => ex.id === entry.exerciseId)
        if (!exercise) return
        
        const sortedSets = [...entry.sets].sort((a, b) => a.setNumber - b.setNumber)
        
        sortedSets.forEach(set => {
          historyData.push([
            session.date,
            exercise.name,
            set.weight,
            set.reps,
            set.setNumber
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
    return base64Data
  }
}
