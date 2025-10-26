import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Plus, Trash2 } from "lucide-react"

interface GruppenTableProps {
  gruppen: any[]
  isLoading: boolean
  searchTerm: string
  onCreateGruppe: () => void
  onEditGruppe: (gruppe: any) => void
  onDeleteGruppe: (gruppe: any) => void
}

export function GruppenTable({
  gruppen,
  isLoading,
  searchTerm,
  onCreateGruppe,
  onEditGruppe,
  onDeleteGruppe
}: GruppenTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <p className='text-gray-500'>Lade Gruppen...</p>
        </CardContent>
      </Card>
    )
  }

  if (gruppen.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <p className='text-gray-500'>
            {searchTerm
              ? "Keine Gruppen gefunden."
              : "Keine Gruppen verfügbar."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-4 pt-0 border-b'>
          <Button onClick={onCreateGruppe} className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Neu
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Regal</TableHead>
              <TableHead>Kiste</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gruppen.map((gruppe) => (
              <TableRow key={gruppe.id}>
                <TableCell className='font-medium'>{gruppe.name}</TableCell>
                <TableCell>{gruppe.regal}</TableCell>
                <TableCell>{gruppe.kiste}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon-sm'
                      onClick={() => onEditGruppe(gruppe)}
                      title='Bearbeiten'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='destructive'
                      size='icon-sm'
                      onClick={() => onDeleteGruppe(gruppe)}
                      title='Löschen'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}