import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import { pb } from "@/lib/pocketbase"

interface ItemFormData {
  name: string
  bestand: string
  organisation: string[]
  Anmerkungen: string
  gruppe: string
  bild: File | null
}

interface ItemFormProps {
  formData: ItemFormData
  onFormDataChange: (data: ItemFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  mode: 'create' | 'edit'
}

interface Gruppe {
  id: string
  name: string
}

const ORGANISATION_OPTIONS = ['Jugend', 'Kinder']

export function ItemForm({
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isSaving,
  mode
}: ItemFormProps) {
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [isLoadingGruppen, setIsLoadingGruppen] = useState(false)

  useEffect(() => {
    fetchGruppen()
  }, [])

  const fetchGruppen = async () => {
    setIsLoadingGruppen(true)
    try {
      const resultList = await pb.collection('gruppen').getFullList({
        sort: 'name'
      })
      setGruppen(resultList.map(item => ({ id: item.id, name: item.name })))
    } catch (error) {
      console.error('Error fetching gruppen:', error)
    } finally {
      setIsLoadingGruppen(false)
    }
  }

  const handleInputChange = (field: keyof ItemFormData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleInputChange('bild', file)
  }

  const gruppenOptions = gruppen.map(gruppe => ({
    value: gruppe.id,
    label: gruppe.name
  }))

  return (
    <div className='space-y-4'>
      <div>
        <Label htmlFor='name'>Name *</Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder='Name des Gegenstands'
        />
      </div>

      <div>
        <Label htmlFor='bestand'>Bestand</Label>
        <Input
          id='bestand'
          type='number'
          value={formData.bestand}
          onChange={(e) => handleInputChange('bestand', e.target.value)}
          placeholder='Anzahl'
          min='0'
        />
      </div>

      <div>
        <Label htmlFor='organisation'>Organisation</Label>
        <MultiSelect
          options={ORGANISATION_OPTIONS}
          selected={formData.organisation}
          onChange={(selected) => handleInputChange('organisation', selected)}
          placeholder='Organisation auswählen...'
        />
      </div>

      <div>
        <Label htmlFor='gruppe'>Gruppe</Label>
        {isLoadingGruppen ? (
          <div className="text-sm text-muted-foreground">Lade Gruppen...</div>
        ) : (
          <Select
            options={gruppenOptions}
            value={formData.gruppe}
            onChange={(value) => handleInputChange('gruppe', value)}
            placeholder='Gruppe auswählen...'
          />
        )}
      </div>

      <div>
        <Label htmlFor='anmerkungen'>Anmerkungen</Label>
        <Input
          id='anmerkungen'
          value={formData.Anmerkungen}
          onChange={(e) => handleInputChange('Anmerkungen', e.target.value)}
          placeholder='Zusätzliche Informationen'
        />
      </div>

      <div>
        <Label htmlFor='bild'>Bild</Label>
        <Input
          id='bild'
          type='file'
          accept='image/*'
          onChange={handleFileChange}
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