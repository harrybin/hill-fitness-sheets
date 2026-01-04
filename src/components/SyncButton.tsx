import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { ArrowsClockwise, CloudSlash, CheckCircle, GoogleLogo, FileXls } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AppSettings, Exercise, Session } from '@/lib/types'
import {
  initializeGoogleAPI,
  initializeTokenClient,
  requestAccessToken,
  hasAccessToken,
  fetchExercisesFromSheet,
  syncSessionsToSheet,
  downloadSheetAsXLSX,
  importExercisesFromXLSX,
} from '@/lib/googleSheets'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  const [settings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  const [, setExercises] = useKV<Exercise[]>('exercises', [])
  const [sessions] = useKV<Session[]>('sessions', [])
  const [exercises] = useKV<Exercise[]>('exercises', [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const initializeAPIs = async () => {
      try {
        await initializeGoogleAPI()
        initializeTokenClient(() => {
          setIsAuthenticated(hasAccessToken())
        })
        setIsInitialized(true)
        setIsAuthenticated(hasAccessToken())
      } catch (error) {
        console.error('Fehler bei der Initialisierung:', error)
      }
    }

    const timer = setTimeout(initializeAPIs, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleAuthenticate = async () => {
    if (!isInitialized) {
      toast.error('Google API wird geladen', {
        description: 'Bitte warten Sie einen Moment',
      })
      return
    }

    try {
      await requestAccessToken()
      setIsAuthenticated(true)
      toast.success('Erfolgreich angemeldet', {
        description: 'Sie können jetzt mit Google Sheets synchronisieren',
        icon: <GoogleLogo size={20} weight="fill" />
      })
    } catch (error) {
      toast.error('Anmeldung fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Bitte versuchen Sie es erneut'
      })
    }
  }

  const handleSync = async () => {
    if (!settings?.googleSheetId) {
      toast.error('Keine Spreadsheet-ID', {
        description: 'Bitte geben Sie in den Einstellungen eine Google Sheets ID ein'
      })
      return
    }

    if (!isAuthenticated) {
      await handleAuthenticate()
      return
    }

    setIsSyncing(true)

    try {
      const config = {
        spreadsheetId: settings.googleSheetId,
        exerciseRange: 'Übungen!A:B',
        dataRange: 'Trainings!A:Z'
      }

      const fetchedExercises = await fetchExercisesFromSheet(config)
      
      if (fetchedExercises.length > 0) {
        setExercises(() => fetchedExercises)
      }

      if (sessions && sessions.length > 0) {
        await syncSessionsToSheet(config, sessions, exercises || [])
      }

      toast.success('Synchronisierung erfolgreich', {
        description: `${fetchedExercises.length} Übungen geladen${sessions?.length ? `, ${sessions.length} Sessions gespeichert` : ''}`,
        icon: <CheckCircle size={20} weight="fill" />
      })
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Synchronisierung fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Bitte versuchen Sie es später erneut'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleXLSXImport = async () => {
    if (!settings?.googleSheetId) {
      toast.error('Keine Spreadsheet-ID', {
        description: 'Bitte geben Sie in den Einstellungen eine Google Sheets ID ein'
      })
      return
    }

    if (!isAuthenticated) {
      await handleAuthenticate()
      return
    }

    setIsSyncing(true)

    try {
      const arrayBuffer = await downloadSheetAsXLSX(settings.googleSheetId)
      const importedExercises = await importExercisesFromXLSX(arrayBuffer)

      if (importedExercises.length > 0) {
        setExercises(() => importedExercises)
        
        toast.success('XLSX Import erfolgreich', {
          description: `${importedExercises.length} Übungen aus Google Sheets importiert`,
          icon: <FileXls size={20} weight="fill" />
        })
      } else {
        toast.error('Keine Übungen gefunden', {
          description: 'Die Datei enthält keine gültigen Übungen'
        })
      }
    } catch (error) {
      console.error('XLSX import error:', error)
      toast.error('XLSX Import fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Bitte versuchen Sie es später erneut'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const buttonDisabled = isSyncing || !isOnline || !isInitialized

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isAuthenticated ? "outline" : "default"}
          size="icon"
          disabled={buttonDisabled}
          className="h-10 w-10 relative"
        >
          {!isOnline ? (
            <CloudSlash size={20} />
          ) : !isAuthenticated ? (
            <GoogleLogo size={20} weight="bold" />
          ) : (
            <ArrowsClockwise 
              size={20} 
              className={isSyncing ? 'animate-spin' : ''}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!isAuthenticated ? (
          <DropdownMenuItem onClick={handleAuthenticate}>
            <GoogleLogo size={16} className="mr-2" />
            Bei Google anmelden
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={handleSync}>
              <ArrowsClockwise size={16} className="mr-2" />
              API Sync (schnell)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleXLSXImport}>
              <FileXls size={16} className="mr-2" />
              XLSX Import (komplett)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
