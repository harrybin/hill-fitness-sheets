import { useState } from 'react'
import { Session } from '@/lib/types'
import { Calendar } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SessionHeaderProps {
  session?: Session
  allSessions?: Session[]
}

export function SessionHeader({ session, allSessions }: SessionHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  
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
  
  const formatDate = (dateString: string): string => {
    try {
      const dateParts = dateString.split('-')
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0])
        const month = parseInt(dateParts[1]) - 1
        const day = parseInt(dateParts[2])
        const date = new Date(year, month, day)
        
        return date.toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
    }
    return dateString
  }
  
  const sessionsWithEntries = (allSessions || [])
    .filter(s => s.entries && s.entries.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
  
  return (
    <div className="flex items-center gap-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0 h-auto w-auto p-0 hover:bg-transparent">
            <Calendar size={24} weight="bold" className="text-primary" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bisherige Trainingseinheiten</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {sessionsWithEntries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Keine Trainingseinheiten vorhanden
              </div>
            ) : (
              <div className="space-y-2">
                {sessionsWithEntries.map((s) => (
                  <div
                    key={s.date}
                    className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">
                          {formatDate(s.date)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.entries.length} Übung{s.entries.length === 1 ? '' : 'en'} abgeschlossen
                        </div>
                      </div>
                      <div className="text-lg font-mono font-bold text-primary">
                        {s.entries.reduce((total, entry) => total + entry.sets.length, 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
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
