import { Session } from '@/lib/types'
import { Calendar } from '@phosphor-icons/react'

interface SessionHeaderProps {
  session?: Session
  allSessions?: Session[]
}

export function SessionHeader({ session, allSessions }: SessionHeaderProps) {
  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const completedCount = session?.entries.length || 0
  
  const todayDate = new Date().toISOString().split('T')[0]
  const previousSession = allSessions
    ?.filter(s => s.date < todayDate && s.entries.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  
  const lastTrainingDate = previousSession
    ? new Date(previousSession.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : null
  
  return (
    <div className="flex items-center gap-3">
      <Calendar size={24} weight="bold" className="text-primary" />
      <div>
        <div className="text-base font-semibold text-foreground leading-tight">{today}</div>
        <div className="text-xs text-muted-foreground leading-tight mt-0.5">
          {lastTrainingDate ? `Letztes Training: ${lastTrainingDate}` : 'Neuer Eintrag'}
          {completedCount > 0 && ` • ${completedCount} ${completedCount === 1 ? 'Übung' : 'Übungen'} absolviert`}
        </div>
      </div>
    </div>
  )
}
