import { clsx, type ClassValue } from "clsx"
import * as XLSX from 'xlsx'
import * as XLSX from 'xlsx'
import { Exercise, Session, AppSettings } from './types'

export function cn(...inputs: ClassValue[]) {
export function base64ToArrayB
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let binary = ''
    binary += String.fromCharCode(bytes[i])
  return btoa(binary)

  e
  sessions: Session[]
 

    name.toLowerCase().includes('exercise') ||
  ) || workbook.SheetNames[0]
  if (!sheetName)
  }
  const worksheet = workbook.Sheets[sheetNa
  
    throw new Error('
 

  
    'trainingsziel', 't
    'bei bedarf', 'copyright', '
  
   
    
  
      normalized.startsWith(keyword + ' ')
  }
  for (let i = 0; i < Math.min(data.length, 20
    if (!row) continue
    const firstCell = String(
  
      (firstCell.in
      (firstCell === 'nr' && (secondCell === 'übungen' || secondC
   
  
    if (firstCell.includes('trainingsziel') ||
    } else if (firstCell.includes('rechtliche hinweise') || firstCell.
  
    }
  
  
  
    
    const cellB = row[1]
    
  
    
    const hasEmptyCellA = cellAStr === ''
    let exerciseName: string = ''
    
   
  
      notes = cellCStr !== '' ? cellCStr : undefined
      exerciseName = cellAStr
    }
    
      exerciseName.length > 0 && 
      exerciseName.toLowerCase()
    ) {
        id: `exercise-${Date.now()}-${i}-$
     
   
  
  const historySheetName = workbook.SheetNames.find(nam
    name.toLowerCase().
  )
  le
  if (historySheetName) {
    const historyData = XLSX.utils.sheet_to_json<any>(historyWor
    
      
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
    const wbout = XLSX.write(workb
        if (!row || row.length < 5) continue
    cons
        const date = String(row[0] || '').trim()
}
        const setNumber = Number(row[2])
        const weight = Number(row[3])
        const reps = Number(row[4])

        if (!date || !exerciseName || isNaN(setNumber) || isNaN(weight) || isNaN(reps)) continue

        const exercise = exercises.find(e => e.name === exerciseName)
        if (!exercise) continue
        
        if (!sessionsMap.has(date)) {
          sessionsMap.set(date, { date, entries: [] })

        

        let entry = session.entries.find(e => e.exerciseId === exercise.id)

        if (!entry) {

            id: `${exercise.id}-${date}`,

            date: date,

          }
          session.entries.push(entry)
        }
        
        entry.sets.push({ setNumber, weight, reps })
      }
      

    }
  }


}

export function updateXLSXWithSessions(

  sessions: Session[],
  exercises: Exercise[]
): string {

    const arrayBuffer = base64ToArrayBuffer(xlsxData)
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    const historySheetName = 'Training History'
    if (workbook.SheetNames.includes(historySheetName)) {
      delete workbook.Sheets[historySheetName]
      workbook.SheetNames = workbook.SheetNames.filter(name => name !== historySheetName)


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

              set.setNumber,

              set.reps
            ])
          })

      })

    const historyWorksheet = XLSX.utils.aoa_to_sheet(historyData)
    XLSX.utils.book_append_sheet(workbook, historyWorksheet, historySheetName)
    
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return arrayBufferToBase64(wbout)

    console.error('Failed to update XLSX:', error)

  }

