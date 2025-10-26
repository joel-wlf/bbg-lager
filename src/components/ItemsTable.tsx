import { Badge } from "@/components/ui/badge"
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
import { getImageUrl } from "@/lib/pocketbase"
import { Edit, Plus, Trash2 } from "lucide-react"

interface ItemsTableProps {
  items: any[]
  isLoading: boolean
  searchTerm: string
  onCreateItem: () => void
  onEditItem: (item: any) => void
  onDeleteItem: (item: any) => void
  onImageClick: (imageUrl: string) => void
}

export function ItemsTable({
  items,
  isLoading,
  searchTerm,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onImageClick
}: ItemsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <p className='text-gray-500'>Lade Gegenstände...</p>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <p className='text-gray-500'>
            {searchTerm
              ? "Keine Gegenstände gefunden."
              : "Keine Gegenstände verfügbar."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-4 pt-0 border-b'>
          <Button onClick={onCreateItem} className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Neu
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Bestand</TableHead>
              <TableHead>Bild</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Gruppe</TableHead>
              <TableHead>Anmerkungen</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.name}</TableCell>
                <TableCell>{item.bestand} Stk.</TableCell>
                <TableCell>
                  {item.bild ? (
                    <img
                      src={getImageUrl("items", item.id, item.bild, true)}
                      onClick={() => {
                        onImageClick(getImageUrl("items", item.id, item.bild))
                      }}
                      alt={item.name}
                      className='w-8 h-8 object-cover rounded cursor-pointer'
                    />
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.organisation && item.organisation.length > 0 ? (
                    <div className='flex flex-wrap gap-1'>
                      {item.organisation.map((org: string, index: number) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {org}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.gruppe ? (
                    <div className='flex flex-wrap gap-1'>
                      <Badge variant='outline' className='text-xs'>
                        {item.expand?.gruppe?.name || item.gruppe}
                      </Badge>
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.Anmerkungen ? (
                    <span className='text-sm line-clamp-2 max-w-xs'>
                      {item.Anmerkungen}
                    </span>
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon-sm'
                      onClick={() => onEditItem(item)}
                      title='Bearbeiten'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='destructive'
                      size='icon-sm'
                      onClick={() => onDeleteItem(item)}
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