import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Exercise, TrainingEntry, AppSettings, Session } from '@/lib/types'
import { ExerciseList } from '@/components/ExerciseList'
import { TrainingEntryView } from '@/components/TrainingEntryView'
import { SessionHeader } from '@/components/SessionHeader'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Toaster } from '@/components/ui/sonner'
import { Gear } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'

function App() {
  const [exercises, setExercises] = useKV<Exercise[]>('exercises', [])
  const [sessions, setSessions] = useKV<Session[]>('sessions', [])
  const [settings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (isInitialized || !settings) return
    
    if (settings.importedFile && (!exercises || exercises.length === 0)) {
      try {
        const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data)
        const { exercises: newExercises } = parseXLSX(arrayBuffer)
        setExercises(() => newExercises)
      } catch (error) {
        console.error('Auto-load failed:', error)
      }
    }
    
    setIsInitialized(true)
  }, [settings, isInitialized])
  
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
  
  const parseXLSX = (arrayBuffer: ArrayBuffer): { exercises: Exercise[] } => {
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
    
    const metadataKeywords = [
      'trainingsziel', 'training goal', 'ziel',
      'rechtliche hinweise', 'legal notice', 'hinweise', 'rechtlich',
      'bei bedarf', 'copyright', '©',
    ]
    
    const isMetadataRow = (text: string): boolean => {
      const normalized = text.toLowerCase().trim()
      if (normalized.length === 0) return true
      
      return metadataKeywords.some(keyword => 
        normalized === keyword || 
        normalized.startsWith(keyword + ':') ||
        normalized.startsWith(keyword + ' ')
      )
    }
    
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
    
    return { exercises }
  }
  
  const today = new Date().toISOString().split('T')[0]
  const currentSession = (sessions || []).find(s => s.date === today)
  
  useEffect(() => {
    if (selectedExercise && currentSession) {
      const updatedEntry = currentSession.entries.find(e => e.exerciseId === selectedExercise.id)
      if (!updatedEntry || updatedEntry.sets.length === 0) {
        setSelectedExercise(null)
      }
    }
  }, [currentSession, selectedExercise])
  
  const handleCompleteEntry = (entry: TrainingEntry) => {
    setSessions((prevSessions) => {
      const existingSessions = prevSessions || []
      const sessionIndex = existingSessions.findIndex(s => s.date === today)
      
      if (sessionIndex >= 0) {
        const updatedSessions = [...existingSessions]
        const entryIndex = updatedSessions[sessionIndex].entries.findIndex(
          e => e.exerciseId === entry.exerciseId
        )
        
        if (entryIndex >= 0) {
          updatedSessions[sessionIndex].entries[entryIndex] = entry
        } else {
          updatedSessions[sessionIndex].entries.push(entry)
        }
        
        return updatedSessions
      } else {
        return [...existingSessions, { date: today, entries: [entry] }]
      }
    })
    
    setSelectedExercise(null)
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-3">
          <SessionHeader session={currentSession} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="h-9 w-9"
          >
            <Gear size={20} />
          </Button>
        </div>
      </div>
      
      <div className="pb-20">
        {selectedExercise ? (
          <TrainingEntryView
            exercise={selectedExercise}
            currentSession={currentSession}
            defaultSets={settings?.defaultSetsPerExercise || 2}
            onComplete={handleCompleteEntry}
            onCancel={() => setSelectedExercise(null)}
          />
        ) : (
          <ExerciseList
            exercises={exercises || []}
            currentSession={currentSession}
            onSelectExercise={setSelectedExercise}
          />
        )}
      </div>
      
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  )
}

export default App
