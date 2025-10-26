import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GruppenFormData {
  name: string
  regal: string
  kiste: string
}

interface GruppenFormProps {
  formData: GruppenFormData
  onFormDataChange: (data: GruppenFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  mode: 'create' | 'edit'
}

export function GruppenForm({
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isSaving,
  mode
}: GruppenFormProps) {
  const handleInputChange = (field: keyof GruppenFormData, value: string) => {
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
          placeholder='Name der Gruppe'
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
        <Label htmlFor='kiste'>Kiste</Label>
        <Input
          id='kiste'
          type='number'
          value={formData.kiste}
          onChange={(e) => handleInputChange('kiste', e.target.value)}
          placeholder='Kiste Nummer'
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