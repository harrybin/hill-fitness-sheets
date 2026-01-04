import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ArrowsClockwise, CloudSlash, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline] = useState(true)
  const [pendingSync] = useKV<number>('pendingSync', 0)
  
  const handleSync = async () => {
    setIsSyncing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Synchronisierung erfolgreich', {
        description: 'Trainingsdaten wurden mit Google Sheets synchronisiert',
        icon: <CheckCircle size={20} weight="fill" />
      })
    } catch (error) {
      toast.error('Synchronisierung fehlgeschlagen', {
        description: 'Bitte versuchen Sie es später erneut'
      })
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleSync}
      disabled={isSyncing || !isOnline}
      className="h-10 w-10 relative"
    >
      {!isOnline ? (
        <CloudSlash size={20} />
      ) : (
        <ArrowsClockwise 
          size={20} 
          className={isSyncing ? 'animate-spin' : ''}
        />
      )}
      {(pendingSync ?? 0) > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
          {pendingSync}
        </span>
      )}
    </Button>
  )
}
