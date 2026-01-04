import { Session } from '@/lib/types'
import { Calendar } from '@phosphor-icons/react'

interface SessionHeaderProps {
  session?: Session
  allSessions: Session[]
}

export function SessionHeader({ session, allSessions }: SessionHeaderProps) {
  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const completedCount = session?.entries.length || 0
  
  const getLastTrainingDate = (): string | null => {
    const todayStr = new Date().toISOString().split('T')[0]
    const pastSessions = allSessions
      .filter(s => s.date < todayStr && s.entries.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
    
    if (pastSessions.length > 0) {
      const lastDate = new Date(pastSessions[0].date)
      return lastDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
    return null
  }
  
  const lastTrainingDate = getLastTrainingDate()
  
  return (
    <div className="flex items-center gap-3">
      <Calendar size={24} weight="bold" className="text-primary" />
      <div>
        <div className="text-base font-semibold text-foreground leading-tight">{today}</div>
        <div className="text-xs text-foreground/70 leading-tight mt-0.5">
          {completedCount} {completedCount === 1 ? 'Übung' : 'Übungen'} absolviert
          {lastTrainingDate && (
            <span className="ml-2">· Letztes Training: {lastTrainingDate}</span>
          )}
        </div>
      </div>
    </div>
  )
}
