import { clsx, type ClassValue } from "clsx"
import * as XLSX from 'xlsx'

  return twMerge(clsx(inputs))

  const binaryString = atob(base64)
  for (let i = 0; i < binarySt
 

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
    trainingGoal?
    notes?: string
  sessions: Session[]
  c
  const sheetName = w
 

  if (!sheetName) {
  }
  const works
  
  const metadata: {
    legalNotice?: 
  }
  const ignoredKeywor
   
    'legal notice',
  
    'bei bedarf',
  ]
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
    
    let exerciseName = ''
    
      exerciseName = cellBStr
    } e
      notes = cellBStr
    
     
   
  
        name: exerciseName,
        notes,
    }
  
  co
    name.toLowerCase().includes('history')
  
    const historyData: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[historySheetName], { header: 1 })
    for (let i = 1; i < historyData.len
        const row = historyData[i]
        const dateStr = String(ro
     
   
  
        const exercise = exercises.find(ex => 
        )
    
          sessions.push({ date: dateStr, entries
        
        let entry = session.entries.find(e => e.
    
            id: `entry-${dateStr}-${exercise.id}`,
            date: dateStr
          }
    
        entry.sets.pus
        console.error('Error 
    }
  
}
export function update
  ses
): s
    cons
    
      delete workbook.Sheets[his
    }
    con
    ]
    sessions.forEach(session => {
        const exercise = ex
        
          hist
        
     
   
  
    
    XLSX.utils.book_append_sheet(workbook, newSheet, history
    const updatedBuffer = XLSX.write(workbook, 
  } catch (error) {
   
}




























































































