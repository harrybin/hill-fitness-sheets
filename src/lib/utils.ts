import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Exercise, Session }
export function cn(...inputs: ClassValue[])

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  }
}
export function arrayBufferToBase64(buffer: Array
  let binary = ''
   
  return btoa(binary)


  metadata: { trainingGoal?: string, legalNotice?: string, notes?:
  const workbook = XLSX.read(arrayBuff
  const sheetName
    name.toLowerCase().includes('übung') |
  ) || workbook.SheetNames[0]
  i
  }
 

  const metadata: { trainingGoal?: string, legalNotice?
  const ignoredKeywords =
    'rechtliche hinweis
  ]
  f
    return ignoredKeywords.some(keyword => 
  
    )
  
  
    const row = data[i]
    
  
    if (
      (firstCell.includes('number') && secondCell.includes(
   
  
    
      metadata.trainingGoal = String(row[1] || '').trim()
  
      metadata.notes = String(row[
  }
  
  for (let i = startIndex; 
    if (!row || row.length === 0) con
    const cellA = row[0]
    const cellC = row[2]
   
  
    const isNumericId = !isNaN(Number(cellA)) && 
    
    let notes: string | undefined
    if (isNumericId) {
      notes = cellCStr !== '' ? cellCSt
      exerciseName = cellBStr
    }
   
  
      exerciseName && 
  
      !isMetadataRow(exerciseName)
      exercises.push({
        name: exercise
    
    }
  
    
    name
  
  
    const historyWorksheet = workbook.Sheets[historySheetName]
    
      const sessionsMap 
      for (
     
    
        const setNumber = Number(row[2])
        const reps = Number(row[4])
        if (!date || !exerciseName || isNaN(setNumber) || isNaN(weight) || isNaN(reps)) continue
        const exercise = exercises.find(e => e.name === 
        
          sessionsMap.set(date, { date, entries: [
     
   
  
            id: `${exercise.id}-${date}`,
  
          }
        }
        entry.sets.push({ setNumber, weigh
    
    }
  
}
expo
  sessions: Session[],
): string {
    const arrayBuffer = base64ToArrayBuffer(xlsxData)
    
    if (workbook.SheetNames.includes(historySheetName)) {
      workbook.SheetNames = workbook.Shee
    
    
      .sort((a, b) => b.date.loca
    
          const exerci
          entry.sets.forEach(
              session.date,
              set.setNumber,
              set.reps
          })
      })
    const historyWorksheet = 
    
    r
    
  }






















































































































