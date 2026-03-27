import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Plus, Trash2 } from "lucide-react"

const ORGANISATION_OPTIONS = ["Jugend", "Kinder"]

interface KistenTableProps {
  kisten: any[]
  isLoading: boolean
  searchTerm: string
  organisationFilter: string | null
  kistenOrgs: Map<string, string[]>
  kistenItemCounts: Map<string, number>
  onOrganisationFilterChange: (filter: string | null) => void
  onCreateKiste: () => void
  onEditKiste: (kiste: any) => void
  onDeleteKiste: (kiste: any) => void
}

export function KistenTable({
  kisten,
  isLoading,
  searchTerm,
  organisationFilter,
  kistenOrgs,
  kistenItemCounts,
  onOrganisationFilterChange,
  onCreateKiste,
  onEditKiste,
  onDeleteKiste
}: KistenTableProps) {
  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-4 pt-0 border-b flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Button onClick={onCreateKiste} size='sm' className='flex items-center gap-1.5'>
              <Plus className='w-4 h-4' />
              Neu
            </Button>
            <div className='flex items-center gap-1'>
              {ORGANISATION_OPTIONS.map((org) => (
                <Button
                  key={org}
                  variant='outline'
                  size='sm'
                  onClick={() => onOrganisationFilterChange(organisationFilter === org ? null : org)}
                  className={cn(
                    'text-xs',
                    organisationFilter === org && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {org}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Regal</TableHead>
                <TableHead>Stellplatz</TableHead>
                <TableHead>Gegenstände</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-12"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : kisten.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-gray-500'>
              {searchTerm || organisationFilter
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
                <TableHead>Gegenstände</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kisten.map((kiste) => {
                const orgs = kistenOrgs.get(kiste.id) ?? []
                const count = kistenItemCounts.get(kiste.id) ?? 0
                return (
                  <TableRow key={kiste.id}>
                    <TableCell className='font-medium'>{kiste.name}</TableCell>
                    <TableCell>{kiste.regal}</TableCell>
                    <TableCell>{kiste.stellplatz}</TableCell>
                    <TableCell>
                      <span className='text-sm'>{count}</span>
                    </TableCell>
                    <TableCell>
                      {orgs.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {orgs.map((org) => (
                            <Badge key={org} variant='outline' className='text-xs'>{org}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>-</span>
                      )}
                    </TableCell>
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
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
