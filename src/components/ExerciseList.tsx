import { Exercise, Session } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Barbell } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ExerciseListProps {
  exercises: Exercise[]
  currentSession?: Session
  onSelectExercise: (exercise: Exercise) => void
}

export function ExerciseList({ exercises, currentSession, onSelectExercise }: ExerciseListProps) {
  const getExerciseStatus = (exerciseId: string) => {
    const entry = currentSession?.entries.find(e => e.exerciseId === exerciseId)
    if (!entry || entry.sets.length === 0) {
      return undefined
    }
    return entry
  }
  
  const validExercises = exercises.filter(ex => 
    ex.name && 
    ex.name.trim() !== '' && 
    ex.name !== 'undefined' &&
    ex.name.toLowerCase() !== 'undefined'
  )
  
  if (validExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Barbell size={64} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Keine Übungen</h2>
        <p className="text-muted-foreground mb-4 max-w-md text-sm">
          Importieren Sie Ihre Trainingsübungen über die Einstellungen.
        </p>
      </div>
    )
  }
  
  return (
    <div className="p-3 space-y-3">
      {validExercises.map((exercise) => {
        const entry = getExerciseStatus(exercise.id)
        const isCompleted = !!entry
        
        return (
          <Card
            key={exercise.id}
            onClick={() => onSelectExercise(exercise)}
            className={cn(
              "p-4 cursor-pointer transition-all active:scale-[0.98]",
              "hover:border-primary/50",
              isCompleted && "bg-card/50 border-primary/30"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg font-bold truncate">{exercise.name}</h3>
                  {isCompleted && (
                    <CheckCircle size={20} weight="fill" className="text-primary flex-shrink-0" />
                  )}
                </div>
                
                {exercise.notes && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{exercise.notes}</p>
                )}
                
                {entry && (
                  <div className="flex gap-4 text-sm">
                    {entry.sets.map((set, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          Satz {set.setNumber}
                        </Badge>
                        <span className="font-mono font-bold text-base">
                          {set.weight}kg × {set.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
