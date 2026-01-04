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
  
  const previousSession = (allSessions || [])
    .filter(s => {
      const hasEntries = s.entries && s.entries.length > 0
      const isBeforeToday = s.date < todayDate
      return hasEntries && isBeforeToday
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  
  let lastTrainingDate: string | null = null
  
  if (previousSession?.date) {
    try {
      const dateParts = previousSession.date.split('-')
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0])
        const month = parseInt(dateParts[1]) - 1
        const day = parseInt(dateParts[2])
        const date = new Date(year, month, day)
        
        lastTrainingDate = date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
    } catch (error) {
      console.error('Error parsing date:', error, previousSession.date)
    }
  }
  
  return (
    <div className="flex items-center gap-3">
      <Calendar size={24} weight="bold" className="text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-foreground leading-tight truncate">{today}</div>
        <div className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
          {lastTrainingDate ? `Letztes: ${lastTrainingDate}` : 'Letztes: ---'}
          {completedCount > 0 && ` • ${completedCount} Übung${completedCount === 1 ? '' : 'en'}`}
        </div>
      </div>
    </div>
  )
}
