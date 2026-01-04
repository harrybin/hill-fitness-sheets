import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

  return twMerge(clsx(inputs))

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let binary = ''
    binary += String.fromCharCode(bytes[i])
  return btoa(binary)

  e
  sessions: Session[]
 

  ) || workbook.SheetNames[0]
  if (!sheetName) {
  }
  const worksheet = workbook.Sheets[sheetN
  
  c
  const ignoredKeywor
 

    'notizen',
  ]
  const isMetadataRow = (text: string): boolean => {
    const lowerText =
  }
  let startIndex = 0
    const row = data[i]
    
    const secondCell = String(row[1] || '')
    if (
  
      startIndex = 
    }
   
  
    } else if (firstCell.includes('notes') || 
    }
  
    const row = data[i]
    
  
    
    const cellCStr =
    const isNumericId = !i
    let exerciseN
    
      notes 
    } else {
    }
   
  
    ) {
        id: `ex-${exercises
        notes,
      })
  }
  
    name.toLowerCase
  )
  if (historySheetName)
    const historyData: any[][] = XLSX.util
    
      
        const row = historyData[i]
    
        
        const weight = Number(row[3])
        
       
        if (!exercise) c
        if 
     
    
        
          entry = {
            exerciseId: exercise.id,
            sets: []
          session.entries.push(entry)
        
     
   
  
  return { exercises, metadata, sessions }

  xlsxData: string,
  ex
  try {
    const workbook = XLS
    const historySheetNa
    
      delete workbook.Sheets[historySheetName]
    
    
    
    
        session.entries.f
          if (!exercise) return
    
              session.
              set.setNumber,
              set.reps
          })
      })
    c
    
    retu
    console.error('Err
  }



















































































































