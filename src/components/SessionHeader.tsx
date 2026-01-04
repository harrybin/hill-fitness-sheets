import { Session } from '@/lib/types'
import { Calendar } from '@phosphor-icons/react'

interface SessionHeaderProps {
  session?: Session
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const completedCount = session?.entries.length || 0
  
  return (
    <div className="flex items-center gap-3">
      <Calendar size={24} weight="bold" className="text-primary" />
      <div>
        <div className="text-sm font-semibold text-foreground leading-tight">{today}</div>
        <div className="text-xs text-muted-foreground leading-tight mt-0.5">
          {completedCount} {completedCount === 1 ? 'Übung' : 'Übungen'} absolviert
        </div>
      </div>
    </div>
  )
}
