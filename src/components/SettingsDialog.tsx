import { useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { AppSettings, Exercise } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, Upload, FileArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useKV<AppSettings>('settings', { defaultSetsPerExercise: 2 })
  const [, setExercises] = useKV<Exercise[]>('exercises', [])
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
  }
  
  const parseCSV = (text: string): Exercise[] => {
    const lines = text.trim().split('\n')
    if (lines.length === 0) {
      throw new Error('CSV-Datei ist leer')
    }
    
    const exercises: Exercise[] = []
    
    lines.forEach((line, index) => {
      if (!line.trim()) return
      
      const parts = line.split(/[,;\t]/).map(p => p.trim())
      
      if (parts.length === 0 || !parts[0]) return
      
      const exerciseName = parts[0].replace(/^["']|["']$/g, '')
      
      exercises.push({
        id: `exercise-${Date.now()}-${index}`,
        name: exerciseName,
        notes: parts[1] && parts[1] !== '' ? parts[1].replace(/^["']|["']$/g, '') : undefined,
        order: index
      })
    })
    
    return exercises
  }
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const newExercises = parseCSV(text)
      
      if (newExercises.length === 0) {
        toast.error('Keine Übungen gefunden', {
          description: 'Die Datei enthält keine gültigen Übungen'
        })
        return
      }
      
      setExercises(() => newExercises)
      
      toast.success(`${newExercises.length} Übungen importiert`, {
        description: 'Ihre Trainingsliste wurde erfolgreich aktualisiert',
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
                <Upload size={24} className="flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-semibold">CSV/Spreadsheet hochladen</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Laden Sie eine CSV-Datei mit Ihren Übungen hoch
                  </div>
                </div>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Format: Eine Übung pro Zeile, getrennt durch Komma oder Tab.<br />
                Beispiel: "Bankdrücken, Brust" oder einfach "Bankdrücken"
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label htmlFor="sheet-id">Google Sheets ID</Label>
            <Input
              id="sheet-id"
              placeholder="Spreadsheet ID eingeben..."
              value={settings?.googleSheetId || ''}
              onChange={(e) => handleSheetIdChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Die ID finden Sie in der URL Ihres Google Sheets
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
