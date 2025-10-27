import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface KistenFormData {
  name: string
  regal: string
  stellplatz: string
}

interface KistenFormProps {
  formData: KistenFormData
  onFormDataChange: (data: KistenFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  mode: 'create' | 'edit'
}

export function KistenForm({
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isSaving,
  mode
}: KistenFormProps) {
  const handleInputChange = (field: keyof KistenFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    })
  }

  return (
    <div className='space-y-4'>
      <div>
        <Label htmlFor='name'>Name *</Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder='Name der Kiste'
        />
      </div>

      <div>
        <Label htmlFor='regal'>Regal</Label>
        <Input
          id='regal'
          type='number'
          value={formData.regal}
          onChange={(e) => handleInputChange('regal', e.target.value)}
          placeholder='Regal Nummer'
          min='0'
        />
      </div>

      <div>
        <Label htmlFor='stellplatz'>Stellplatz</Label>
        <Input
          id='stellplatz'
          type='number'
          value={formData.stellplatz}
          onChange={(e) => handleInputChange('stellplatz', e.target.value)}
          placeholder='Stellplatz Nummer'
          min='0'
        />
      </div>

      <div className='flex justify-end gap-2 pt-4'>
        <Button 
          variant='outline' 
          onClick={onCancel}
          disabled={isSaving}
        >
          Abbrechen
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Wird gespeichert...' : mode === 'create' ? 'Hinzufügen' : 'Speichern'}
        </Button>
      </div>
    </div>
  )
}