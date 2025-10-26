import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ItemForm } from "./ItemForm"

interface ItemFormData {
  name: string
  bestand: string
  organisation: string[]
  Anmerkungen: string
  gruppe: string
  bild: File | null
}

interface ItemDialogsProps {
  // Item Dialog
  isItemDialogOpen: boolean
  setIsItemDialogOpen: (open: boolean) => void
  dialogMode: 'create' | 'edit'
  formData: ItemFormData
  onFormDataChange: (data: ItemFormData) => void
  onSave: () => void
  isSaving: boolean

  // Delete Dialog
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  currentItem: any
  onConfirmDelete: () => void
}

export function ItemDialogs({
  isItemDialogOpen,
  setIsItemDialogOpen,
  dialogMode,
  formData,
  onFormDataChange,
  onSave,
  isSaving,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  currentItem,
  onConfirmDelete
}: ItemDialogsProps) {
  return (
    <>
      {/* Create/Edit Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Neuen Gegenstand hinzufügen' : 'Gegenstand bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Geben Sie die Details für den neuen Gegenstand ein.'
                : 'Bearbeiten Sie die Details des Gegenstands.'
              }
            </DialogDescription>
          </DialogHeader>

          <ItemForm
            formData={formData}
            onFormDataChange={onFormDataChange}
            onSave={onSave}
            onCancel={() => setIsItemDialogOpen(false)}
            isSaving={isSaving}
            mode={dialogMode}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gegenstand löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie "{currentItem?.name}" löschen möchten? 
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