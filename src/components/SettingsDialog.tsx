import { useRef, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { AppSettings, Exercise } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, Upload, FileArrowDown, CheckCircle, Warning, FileXls } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { testSheetAccess, hasAccessToken } from '@/lib/googleSheets'
import * as XLSX from 'xlsx'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  const [, setExercises] = useKV<Exercise[]>('exercises', [])
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const adjustSets = (delta: number) => {
    setSettings((prev) => ({
      ...prev!,
      defaultSetsPerExercise: Math.max(1, Math.min(10, (prev?.defaultSetsPerExercise || 2) + delta))
    }))
  }
  
  const handleSheetIdChange = (value: string) => {
    setSettings((prev) => ({
      ...prev!,
      googleSheetId: value
    }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    if (!settings?.googleSheetId) {
      toast.error('Keine Spreadsheet-ID', {
        description: 'Bitte geben Sie zuerst eine Google Sheets ID ein'
      })
      return
    }

    if (!hasAccessToken()) {
      toast.error('Nicht angemeldet', {
        description: 'Bitte klicken Sie zuerst auf den Sync-Button, um sich anzumelden'
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const isAccessible = await testSheetAccess(settings.googleSheetId)
      
      if (isAccessible) {
        setTestResult('success')
        toast.success('Verbindung erfolgreich', {
          description: 'Das Spreadsheet wurde gefunden und ist zugänglich',
          icon: <CheckCircle size={20} weight="fill" />
        })
      } else {
        setTestResult('error')
        toast.error('Zugriff fehlgeschlagen', {
          description: 'Überprüfen Sie die ID und Ihre Berechtigungen'
        })
      }
    } catch (error) {
      setTestResult('error')
      toast.error('Verbindungsfehler', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler'
      })
    } finally {
      setIsTesting(false)
    }
  }
  
  const parseXLSX = (arrayBuffer: ArrayBuffer): { exercises: Exercise[], metadata: Partial<AppSettings> } => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('übung') || 
      name.toLowerCase().includes('exercise') ||
      name.toLowerCase().includes('muskel')
    ) || workbook.SheetNames[0]
    
    if (!sheetName) {
      throw new Error('Keine Arbeitsblätter in der Datei gefunden')
    }
    
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })
    
    if (data.length === 0) {
      throw new Error('Die Datei enthält keine Daten')
    }
    
    const exercises: Exercise[] = []
    const metadata: Partial<AppSettings> = {}
    let headerRowIndex = -1
    
    const metadataKeywords = [
      'trainingsziel', 'training goal', 'ziel',
      'rechtliche hinweise', 'legal notice', 'hinweise', 'rechtlich',
      'bei bedarf', 'copyright', '©',
    ]
    
    const isMetadataRow = (text: string): boolean => {
      const normalized = text.toLowerCase().trim()
      if (normalized.length === 0) return true
      
      return metadataKeywords.some(keyword => 
        normalized === keyword || 
        normalized.startsWith(keyword + ':') ||
        normalized.startsWith(keyword + ' ')
      )
    }
    
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i]
      if (!row) continue
      
      const firstCell = String(row[0] || '').toLowerCase().trim()
      const secondCell = String(row[1] || '').toLowerCase().trim()
      
      if (
        (firstCell.includes('nr') && secondCell.includes('übung')) ||
        (firstCell.includes('number') && secondCell.includes('exercise')) ||
        (firstCell === 'nr' && (secondCell === 'übungen' || secondCell === 'übung'))
      ) {
        headerRowIndex = i
        break
      }
      
      if (firstCell.includes('trainingsziel') || firstCell.includes('training goal')) {
        metadata.trainingGoal = String(row[1] || '').trim()
      } else if (firstCell.includes('rechtliche hinweise') || firstCell.includes('legal notice')) {
        metadata.legalNotice = String(row[1] || '').trim()
      } else if ((firstCell.includes('notiz') || firstCell.includes('note')) && !firstCell.includes('übung') && !secondCell.includes('übung')) {
        metadata.notes = String(row[1] || '').trim()
      }
    }
    
    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0
    
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const cellA = row[0]
      const cellB = row[1]
      const cellC = row[2]
      
      const cellAStr = cellA !== null && cellA !== undefined ? String(cellA).trim() : ''
      const cellBStr = cellB !== null && cellB !== undefined ? String(cellB).trim() : ''
      const cellCStr = cellC !== null && cellC !== undefined ? String(cellC).trim() : ''
      
      const isNumericId = !isNaN(Number(cellA)) && cellAStr !== ''
      const hasEmptyCellA = cellAStr === ''
      
      let exerciseName: string = ''
      let notes: string | undefined
      
      if (isNumericId) {
        exerciseName = cellBStr
        notes = cellCStr !== '' ? cellCStr : undefined
      } else if (hasEmptyCellA) {
        exerciseName = cellBStr
        notes = cellCStr !== '' ? cellCStr : undefined
      } else {
        exerciseName = cellAStr
        notes = cellBStr !== '' ? cellBStr : undefined
      }
      
      if (
        exerciseName && 
        exerciseName.length > 0 && 
        exerciseName !== 'undefined' &&
        exerciseName.toLowerCase() !== 'undefined' &&
        !isMetadataRow(exerciseName)
      ) {
        exercises.push({
          id: `exercise-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          name: exerciseName,
          notes: notes,
          order: exercises.length
        })
      }
    }
    
    return { exercises, metadata }
  }
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const { exercises: newExercises, metadata } = parseXLSX(arrayBuffer)
      
      if (newExercises.length === 0) {
        toast.error('Keine Übungen gefunden', {
          description: 'Die Datei enthält keine gültigen Übungen'
        })
        return
      }
      
      setExercises(() => newExercises)
      
      if (Object.keys(metadata).length > 0) {
        setSettings((prev) => ({
          ...prev!,
          ...metadata
        }))
      }
      
      const metadataInfo: string[] = []
      if (metadata.trainingGoal) metadataInfo.push('Trainingsziel')
      if (metadata.legalNotice) metadataInfo.push('Rechtliche Hinweise')
      if (metadata.notes) metadataInfo.push('Notizen')
      
      const description = metadataInfo.length > 0
        ? `${metadataInfo.join(', ')} wurden in den Einstellungen gespeichert`
        : 'Ihre Trainingsliste wurde erfolgreich aktualisiert'
      
      toast.success(`${newExercises.length} Übungen importiert`, {
        description,
        icon: <FileArrowDown size={20} weight="fill" />
      })
      
      onOpenChange(false)
    } catch (error) {
      toast.error('Import fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Ungültiges Dateiformat'
      })
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>
            Passen Sie Ihre Trainingseinstellungen an
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="default-sets">Standard-Sätze pro Übung</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSets(-1)}
                disabled={(settings?.defaultSetsPerExercise || 2) <= 1}
              >
                <Minus size={20} />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold font-mono text-primary">
                  {settings?.defaultSetsPerExercise || 2}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSets(1)}
                disabled={(settings?.defaultSetsPerExercise || 2) >= 10}
              >
                <Plus size={20} />
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label>Übungen importieren</Label>
            <div className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
              >
                <FileXls size={24} className="flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-semibold">Lokale XLSX-Datei hochladen</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Laden Sie eine Excel/Google Sheets XLSX-Datei hoch
                  </div>
                </div>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.ods"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          
          <Separator />
          
          {(settings?.trainingGoal || settings?.legalNotice || settings?.notes) && (
            <>
              <div className="space-y-3">
                <Label>Importierte Informationen</Label>
                <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-md">
                  {settings.trainingGoal && (
                    <div>
                      <div className="font-semibold text-foreground">Trainingsziel:</div>
                      <div className="text-muted-foreground mt-1">{settings.trainingGoal}</div>
                    </div>
                  )}
                  {settings.legalNotice && (
                    <div className="mt-3">
                      <div className="font-semibold text-foreground">Rechtliche Hinweise:</div>
                      <div className="text-muted-foreground mt-1">{settings.legalNotice}</div>
                    </div>
                  )}
                  {settings.notes && (
                    <div className="mt-3">
                      <div className="font-semibold text-foreground">Notizen:</div>
                      <div className="text-muted-foreground mt-1">{settings.notes}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="sheet-id">Google Sheets ID</Label>
            <div className="flex gap-2">
              <Input
                id="sheet-id"
                placeholder="1a2b3c4d5e6f7g8h9i0j..."
                value={settings?.googleSheetId || ''}
                onChange={(e) => handleSheetIdChange(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!settings?.googleSheetId || isTesting}
                className="flex-shrink-0"
              >
                {isTesting ? (
                  'Teste...'
                ) : testResult === 'success' ? (
                  <CheckCircle size={20} weight="fill" className="text-green-500" />
                ) : testResult === 'error' ? (
                  <Warning size={20} weight="fill" className="text-destructive" />
                ) : (
                  'Testen'
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Die ID finden Sie in der URL Ihres Google Sheets:<br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  https://docs.google.com/spreadsheets/d/<strong className="text-primary">IHRE_ID_HIER</strong>/edit
                </code>
              </p>
              <p className="pt-2">
                <strong>Mit Google Sheets ID können Sie:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>API Sync:</strong> Schnelle Synchronisierung über die Google Sheets API</li>
                <li><strong>XLSX Import:</strong> Kompletter Download als Excel-Datei</li>
              </ul>
              <p className="pt-2">
                <strong>Erforderliche Sheets in Ihrer Tabelle:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Übungen</strong>: Spalte A = Übungsname, Spalte B = Notizen (optional)</li>
                <li><strong>Trainings</strong>: Wird automatisch mit Trainingsdaten gefüllt</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
