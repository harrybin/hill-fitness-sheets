import { useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { AppSettings, Exercise, Session } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, FileArrowDown, FileXls, ArrowsClockwise, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  const [, setExercises] = useKV<Exercise[]>('exercises', [])
  const [, setSessions] = useKV<Session[]>('sessions', [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const adjustSets = (delta: number) => {
    setSettings((prev) => ({
      ...prev!,
      defaultSetsPerExercise: Math.max(1, Math.min(10, (prev?.defaultSetsPerExercise || 2) + delta))
    }))
  }
  
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
  
  const exportStoredFile = () => {
    if (!settings?.importedFile) {
      toast.error('Keine Datei', {
        description: 'Bitte zuerst eine XLSX-Datei importieren'
      })
      return
    }
    
    try {
      const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data)
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = settings.importedFile.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Exportiert', {
        description: `${settings.importedFile.name}`,
        icon: <DownloadSimple size={20} weight="fill" />
      })
    } catch (error) {
      toast.error('Export fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Fehler beim Export'
      })
    }
  }
  
  const resyncFromStoredFile = () => {
    if (!settings?.importedFile) {
      toast.error('Keine Datei', {
        description: 'Bitte zuerst eine XLSX-Datei importieren'
      })
      return
    }
    
    try {
      const arrayBuffer = base64ToArrayBuffer(settings.importedFile.data)
      const { exercises: newExercises, metadata } = parseXLSX(arrayBuffer)
      
      setExercises(() => newExercises)
      
      setSettings((prev) => ({
        ...prev!,
        ...metadata
      }))
      
      toast.success('Neu synchronisiert', {
        description: `${newExercises.length} Übungen geladen`,
        icon: <ArrowsClockwise size={20} weight="fill" />
      })
    } catch (error) {
      toast.error('Sync fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Fehler beim Laden'
      })
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
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const { exercises: newExercises, metadata } = parseXLSX(arrayBuffer)
      
      if (newExercises.length === 0) {
        toast.error('Keine Übungen', {
          description: 'Datei enthält keine gültigen Übungen'
        })
        return
      }
      
      setExercises(() => newExercises)
      setSessions(() => [])
      
      const fileData = arrayBufferToBase64(arrayBuffer)
      
      setSettings((prev) => ({
        ...prev!,
        ...metadata,
        importedFile: {
          name: file.name,
          data: fileData,
          lastModified: file.lastModified,
          size: file.size
        }
      }))
      
      const metadataInfo: string[] = []
      if (metadata.trainingGoal) metadataInfo.push('Trainingsziel')
      if (metadata.legalNotice) metadataInfo.push('Hinweise')
      if (metadata.notes) metadataInfo.push('Notizen')
      
      const description = metadataInfo.length > 0
        ? `${metadataInfo.join(', ')} gespeichert`
        : 'Trainingsliste aktualisiert'
      
      toast.success(`${newExercises.length} Übungen importiert`, {
        description,
        icon: <FileArrowDown size={20} weight="fill" />
      })
      
      onOpenChange(false)
    } catch (error) {
      toast.error('Import fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Ungültiges Format'
      })
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Einstellungen</DialogTitle>
          <DialogDescription className="text-xs">
            Trainingseinstellungen
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-2">
            <Label htmlFor="default-sets" className="text-sm">Standard-Sätze</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSets(-1)}
                disabled={(settings?.defaultSetsPerExercise || 2) <= 1}
                className="h-10 w-10"
              >
                <Minus size={18} />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold font-mono text-primary">
                  {settings?.defaultSetsPerExercise || 2}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSets(1)}
                disabled={(settings?.defaultSetsPerExercise || 2) >= 10}
                className="h-10 w-10"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm">Übungen</Label>
            <div className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-2.5"
              >
                <FileXls size={20} className="flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-sm">XLSX hochladen</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    Excel/Google Sheets Datei
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
              
              {settings?.importedFile && (
                <div className="bg-muted/50 p-2.5 rounded-md space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {settings.importedFile.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {new Date(settings.importedFile.lastModified).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })} • {(settings.importedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={resyncFromStoredFile}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs h-8"
                    >
                      <ArrowsClockwise size={14} />
                      Sync
                    </Button>
                    <Button
                      onClick={exportStoredFile}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs h-8"
                    >
                      <DownloadSimple size={14} />
                      Export
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {(settings?.trainingGoal || settings?.legalNotice || settings?.notes) && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm">Informationen</Label>
                <div className="space-y-2 text-sm bg-muted/50 p-2.5 rounded-md max-h-32 overflow-y-auto">
                  {settings.trainingGoal && (
                    <div>
                      <div className="font-semibold text-foreground text-xs">Ziel:</div>
                      <div className="text-muted-foreground text-xs mt-0.5 leading-tight break-words">{settings.trainingGoal}</div>
                    </div>
                  )}
                  {settings.legalNotice && (
                    <div className="mt-2">
                      <div className="font-semibold text-foreground text-xs">Hinweise:</div>
                      <div className="text-muted-foreground text-xs mt-0.5 leading-tight break-words">{settings.legalNotice}</div>
                    </div>
                  )}
                  {settings.notes && (
                    <div className="mt-2">
                      <div className="font-semibold text-foreground text-xs">Notizen:</div>
                      <div className="text-muted-foreground text-xs mt-0.5 leading-tight break-words">{settings.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
