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

interface KistenTableProps {
  kisten: any[]
  isLoading: boolean
  searchTerm: string
  onCreateKiste: () => void
  onEditKiste: (kiste: any) => void
  onDeleteKiste: (kiste: any) => void
}

export function KistenTable({
  kisten,
  isLoading,
  searchTerm,
  onCreateKiste,
  onEditKiste,
  onDeleteKiste
}: KistenTableProps) {
  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-4 pt-0 border-b'>
          <Button onClick={onCreateKiste} className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Neu
          </Button>
        </div>
        
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-gray-500'>Lade Kisten...</p>
          </div>
        ) : kisten.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-gray-500'>
              {searchTerm
                ? "Keine Kisten gefunden."
                : "Keine Kisten verfügbar."}
            </p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Regal</TableHead>
              <TableHead>Stellplatz</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kisten.map((kiste) => (
              <TableRow key={kiste.id}>
                <TableCell className='font-medium'>{kiste.name}</TableCell>
                <TableCell>{kiste.regal}</TableCell>
                <TableCell>{kiste.stellplatz}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon-sm'
                      onClick={() => onEditKiste(kiste)}
                      title='Bearbeiten'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='destructive'
                      size='icon-sm'
                      onClick={() => onDeleteKiste(kiste)}
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
        )}
      </CardContent>
    </Card>
  )
}