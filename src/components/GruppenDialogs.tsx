import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GruppenForm } from "./GruppenForm"

interface GruppenFormData {
  name: string
  regal: string
  kiste: string
}

interface GruppenDialogsProps {
  // Gruppe Dialog
  isGruppeDialogOpen: boolean
  setIsGruppeDialogOpen: (open: boolean) => void
  dialogMode: 'create' | 'edit'
  formData: GruppenFormData
  onFormDataChange: (data: GruppenFormData) => void
  onSave: () => void
  isSaving: boolean

  // Delete Dialog
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  currentGruppe: any
  onConfirmDelete: () => void
}

export function GruppenDialogs({
  isGruppeDialogOpen,
  setIsGruppeDialogOpen,
  dialogMode,
  formData,
  onFormDataChange,
  onSave,
  isSaving,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  currentGruppe,
  onConfirmDelete
}: GruppenDialogsProps) {
  return (
    <>
      {/* Create/Edit Gruppe Dialog */}
      <Dialog open={isGruppeDialogOpen} onOpenChange={setIsGruppeDialogOpen}>
        <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Neue Gruppe hinzufügen' : 'Gruppe bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Geben Sie die Details für die neue Gruppe ein.'
                : 'Bearbeiten Sie die Details der Gruppe.'
              }
            </DialogDescription>
          </DialogHeader>

          <GruppenForm
            formData={formData}
            onFormDataChange={onFormDataChange}
            onSave={onSave}
            onCancel={() => setIsGruppeDialogOpen(false)}
            isSaving={isSaving}
            mode={dialogMode}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gruppe löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Gruppe "{currentGruppe?.name}" löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end gap-2 pt-4'>
            <Button 
              variant='outline' 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button 
              variant='destructive' 
              onClick={onConfirmDelete}
              disabled={isSaving}
            >
              {isSaving ? 'Wird gelöscht...' : 'Löschen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}