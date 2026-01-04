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
import { parseXLSX, base64ToArrayBuffer, updateXLSXWithSessions } from '@/lib/utils'

function App() {
  const [exercises, setExercises] = useKV<Exercise[]>('exercises', [])
  const [sessions, setSessions] = useKV<Session[]>('sessions', [])
  const [settings, setSettings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (isInitialized || !settings) return
    
    if (settings.importedFile && (!exercises || exercises.length === 0)) {
      try {
        console.log('Auto-loading exercises and sessions from stored file...')
        const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data)
        const { exercises: newExercises, sessions: loadedSessions } = parseXLSX(arrayBuffer)
        console.log(`Auto-loaded ${newExercises.length} exercises and ${loadedSessions?.length || 0} sessions`)
        setExercises(() => newExercises)
        if (loadedSessions && loadedSessions.length > 0) {
          setSessions(() => loadedSessions)
        }
      } catch (error) {
        console.error('Auto-load failed:', error)
      }
    } else if (settings.importedFile && sessions && sessions.length > 0 && exercises && exercises.length > 0) {
      console.log('Syncing sessions back to XLSX...')
      const newData = updateXLSXWithSessions(settings.importedFile.data, sessions, exercises)
      if (newData !== settings.importedFile.data) {
        console.log('XLSX data updated with current sessions')
        setSettings((prev) => {
          if (!prev?.importedFile) return prev!
          return {
            ...prev,
            importedFile: {
              ...prev.importedFile,
              data: newData,
              lastModified: Date.now()
            }
          }
        })
      }
    }
    
    setIsInitialized(true)
  }, [settings, isInitialized])
  
  const today = new Date().toISOString().split('T')[0]
  const currentSession = (sessions || []).find(s => s.date === today)
  
  const syncSessionsToXLSX = (updatedSessions: Session[]) => {
    if (!settings?.importedFile || !exercises) return
    
    const newData = updateXLSXWithSessions(settings.importedFile.data, updatedSessions, exercises)
    if (newData !== settings.importedFile.data) {
      setSettings((prev) => {
        if (!prev?.importedFile) return prev!
        return {
          ...prev,
          importedFile: {
            ...prev.importedFile,
            data: newData,
            lastModified: Date.now()
          }
        }
      })
    }
  }
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  const handleCompleteEntry = (entry: TrainingEntry) => {
    setSessions((prevSessions) => {
      const existingSessions = prevSessions || []
      const sessionIndex = existingSessions.findIndex(s => s.date === today)
      
      let updatedSessions: Session[]
      
      if (sessionIndex >= 0) {
        updatedSessions = [...existingSessions]
        const entryIndex = updatedSessions[sessionIndex].entries.findIndex(
          e => e.exerciseId === entry.exerciseId
        )
        
        if (entryIndex >= 0) {
          updatedSessions[sessionIndex].entries[entryIndex] = entry
        } else {
          updatedSessions[sessionIndex].entries.push(entry)
        }
      } else {
        updatedSessions = [...existingSessions, { date: today, entries: [entry] }]
      }
      
      syncSessionsToXLSX(updatedSessions)
      return updatedSessions
    })
    
    setSelectedExercise(null)
  }
  
  const handleUpdateEntry = (entry: TrainingEntry) => {
    setSessions((prevSessions) => {
      const existingSessions = prevSessions || []
      const sessionIndex = existingSessions.findIndex(s => s.date === today)
      
      let updatedSessions: Session[]
      
      if (sessionIndex >= 0) {
        updatedSessions = [...existingSessions]
        
        if (entry.sets.length === 0) {
          updatedSessions[sessionIndex].entries = updatedSessions[sessionIndex].entries.filter(
            e => e.exerciseId !== entry.exerciseId
          )
          
          if (updatedSessions[sessionIndex].entries.length === 0) {
            updatedSessions = existingSessions.filter(s => s.date !== today)
          }
        } else {
          const entryIndex = updatedSessions[sessionIndex].entries.findIndex(
            e => e.exerciseId === entry.exerciseId
          )
          
          if (entryIndex >= 0) {
            updatedSessions[sessionIndex].entries[entryIndex] = entry
          }
        }
      } else {
        updatedSessions = existingSessions
      }
      
      syncSessionsToXLSX(updatedSessions)
      return updatedSessions
    })
  }
  
  const handleCancelEntry = () => {
    setSelectedExercise(null)
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-6">
      <Toaster />
      
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center justify-between p-3">
            <SessionHeader session={currentSession} allSessions={sessions || []} />
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
              allSessions={sessions || []}
              defaultSets={settings?.defaultSetsPerExercise || 2}
              onComplete={handleCompleteEntry}
              onUpdate={handleUpdateEntry}
              onCancel={handleCancelEntry}
            />
          ) : (
            <ExerciseList
              exercises={exercises || []}
              currentSession={currentSession}
              allSessions={sessions || []}
              onSelectExercise={setSelectedExercise}
            />
          )}
        </div>
      </div>
      
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  )
}

export default App
