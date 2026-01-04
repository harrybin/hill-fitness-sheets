import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Exercise, TrainingEntry, AppSettings, Session } from '@/lib/types'
import { ExerciseList } from '@/components/ExerciseList'
import { TrainingEntryView } from '@/components/TrainingEntryView'
import { SessionHeader } from '@/components/SessionHeader'
import { SettingsDialog } from '@/components/SettingsDialog'
import { SyncButton } from '@/components/SyncButton'
import { Toaster } from '@/components/ui/sonner'
import { Gear } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

function App() {
  const [exercises, setExercises] = useKV<Exercise[]>('exercises', [])
  const [sessions, setSessions] = useKV<Session[]>('sessions', [])
  const [settings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const validExercises = (exercises || []).filter(ex => 
    ex.name && 
    ex.name.trim() !== '' && 
    ex.name !== 'undefined' &&
    ex.name.toLowerCase() !== 'undefined'
  )
  
  if (validExercises.length !== (exercises || []).length) {
    setExercises(() => validExercises)
  }
  
  const today = new Date().toISOString().split('T')[0]
  const currentSession = (sessions || []).find(s => s.date === today)
  
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
        <div className="flex items-center justify-between p-4">
          <SessionHeader session={currentSession} />
          <div className="flex gap-2">
            <SyncButton />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-10 w-10"
            >
              <Gear size={20} />
            </Button>
          </div>
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
            exercises={validExercises || []}
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
