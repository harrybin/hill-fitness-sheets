import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Exercise, TrainingEntry, Session, TrainingSet, PreviousTraining } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Plus, Minus, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface TrainingEntryViewProps {
  exercise: Exercise
  currentSession?: Session
  defaultSets: number
  onComplete: (entry: TrainingEntry) => void
  onCancel: () => void
}

export function TrainingEntryView({
  exercise,
  currentSession,
  defaultSets,
  onComplete,
  onCancel
}: TrainingEntryViewProps) {
  const [sessions] = useKV<Session[]>('sessions', [])
  
  const existingEntry = currentSession?.entries.find(e => e.exerciseId === exercise.id)
  
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [sets, setSets] = useState<TrainingSet[]>([])
  
  const getPreviousTraining = (): PreviousTraining | null => {
    if (!sessions || sessions.length === 0) return null
    
    const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
    
    for (const session of sortedSessions) {
      const entry = session.entries.find(e => e.exerciseId === exercise.id)
      if (entry && entry.sets.length > 0) {
        const firstSet = entry.sets[0]
        return {
          exerciseId: exercise.id,
          lastWeight: firstSet.weight,
          lastReps: firstSet.reps,
          date: session.date
        }
      }
    }
    
    return null
  }
  
  const previousTraining = getPreviousTraining()
  
  const [currentWeight, setCurrentWeight] = useState(previousTraining?.lastWeight || 10)
  const [currentReps, setCurrentReps] = useState(previousTraining?.lastReps || 10)
  
  useEffect(() => {
    if (existingEntry) {
      setSets(existingEntry.sets)
      setCurrentSetIndex(existingEntry.sets.length)
    }
  }, [existingEntry])
  
  const totalSets = defaultSets
  const isLastSet = currentSetIndex >= totalSets - 1
  
  const handleConfirmSet = () => {
    const newSet: TrainingSet = {
      setNumber: currentSetIndex + 1,
      weight: currentWeight,
      reps: currentReps
    }
    
    const updatedSets = [...sets, newSet]
    setSets(updatedSets)
    
    if (isLastSet) {
      const entry: TrainingEntry = {
        id: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        date: new Date().toISOString().split('T')[0],
        sets: updatedSets
      }
      onComplete(entry)
    } else {
      setCurrentSetIndex(currentSetIndex + 1)
    }
  }
  
  const adjustWeight = (delta: number) => {
    setCurrentWeight(Math.max(0, currentWeight + delta))
  }
  
  const adjustReps = (delta: number) => {
    setCurrentReps(Math.max(0, currentReps + delta))
  }
  
  const progressPercentage = ((currentSetIndex) / totalSets) * 100
  
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="mb-2 h-12 px-4"
          >
            <ArrowLeft size={24} className="mr-2" />
            Zurück
          </Button>
          
          <div className="mb-2">
            <h1 className="text-2xl font-bold mb-0.5">{exercise.name}</h1>
            {exercise.notes && (
              <p className="text-sm text-muted-foreground">{exercise.notes}</p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Satz {currentSetIndex + 1} von {totalSets}
              </span>
              {previousTraining && (
                <span className="text-muted-foreground">
                  Letztes Mal: {previousTraining.lastWeight}kg × {previousTraining.lastReps}
                </span>
              )}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>
      
      <div className="p-3 space-y-3 pb-32">
        {sets.map((set, idx) => (
          <Card key={idx} className="p-3 bg-card/50 border-primary/30">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-mono">
                Satz {set.setNumber}
              </Badge>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-2xl">
                  {set.weight}kg
                </span>
                <span className="text-muted-foreground">×</span>
                <span className="font-mono font-bold text-2xl">
                  {set.reps}
                </span>
              </div>
            </div>
          </Card>
        ))}
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-2 block">
              GEWICHT (KG)
            </label>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => adjustWeight(-2.5)}
                className="h-14 w-14 rounded-full p-0"
              >
                <Minus size={24} weight="bold" />
              </Button>
              
              <div className="flex-1 max-w-[200px]">
                <div className="text-center font-mono font-bold text-5xl text-primary">
                  {currentWeight}
                </div>
                <div className="text-center text-sm text-muted-foreground mt-0.5">
                  kg
                </div>
              </div>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => adjustWeight(2.5)}
                className="h-14 w-14 rounded-full p-0"
              >
                <Plus size={24} weight="bold" />
              </Button>
            </div>
            
            <div className="flex gap-2 justify-center mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => adjustWeight(-5)}
                className="h-8 px-3"
              >
                -5kg
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => adjustWeight(5)}
                className="h-8 px-3"
              >
                +5kg
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-2 block">
              WIEDERHOLUNGEN
            </label>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => adjustReps(-1)}
                className="h-14 w-14 rounded-full p-0"
              >
                <Minus size={24} weight="bold" />
              </Button>
              
              <div className="flex-1 max-w-[200px]">
                <div className="text-center font-mono font-bold text-5xl text-primary">
                  {currentReps}
                </div>
                <div className="text-center text-sm text-muted-foreground mt-0.5">
                  Wiederholungen
                </div>
              </div>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => adjustReps(1)}
                className="h-14 w-14 rounded-full p-0"
              >
                <Plus size={24} weight="bold" />
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[-3, -2, 2, 3].map((delta) => (
                <Button
                  key={delta}
                  variant="secondary"
                  size="sm"
                  onClick={() => adjustReps(delta)}
                  className={cn(
                    "h-8 px-3",
                    delta > 0 && "col-start-2"
                  )}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border">
        <Button
          size="lg"
          className="w-full h-12 text-lg font-bold"
          onClick={handleConfirmSet}
        >
          <Check size={24} weight="bold" className="mr-2" />
          {isLastSet ? 'Übung abschließen' : `Satz ${currentSetIndex + 1} bestätigen`}
        </Button>
      </div>
    </div>
  )
}
