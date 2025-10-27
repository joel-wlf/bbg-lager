import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { KistenForm } from "./KistenForm"

interface KistenFormData {
  name: string
  regal: string
  stellplatz: string
}

interface KistenDialogsProps {
  // Kiste Dialog
  isKisteDialogOpen: boolean
  setIsKisteDialogOpen: (open: boolean) => void
  dialogMode: 'create' | 'edit'
  formData: KistenFormData
  onFormDataChange: (data: KistenFormData) => void
  onSave: () => void
  isSaving: boolean

  // Delete Dialog
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  currentKiste: any
  onConfirmDelete: () => void
}

export function KistenDialogs({
  isKisteDialogOpen,
  setIsKisteDialogOpen,
  dialogMode,
  formData,
  onFormDataChange,
  onSave,
  isSaving,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  currentKiste,
  onConfirmDelete
}: KistenDialogsProps) {
  return (
    <>
      {/* Create/Edit Kiste Dialog */}
      <Dialog open={isKisteDialogOpen} onOpenChange={setIsKisteDialogOpen}>
        <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Neue Kiste hinzufügen' : 'Kiste bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Geben Sie die Details für die neue Kiste ein.'
                : 'Bearbeiten Sie die Details der Kiste.'
              }
            </DialogDescription>
          </DialogHeader>

          <KistenForm
            formData={formData}
            onFormDataChange={onFormDataChange}
            onSave={onSave}
            onCancel={() => setIsKisteDialogOpen(false)}
            isSaving={isSaving}
            mode={dialogMode}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kiste löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Kiste "{currentKiste?.name}" löschen möchten? 
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