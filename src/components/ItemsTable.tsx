import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getImageUrl } from "@/lib/pocketbase";
import { Edit, Plus, Trash2, MapPin, Archive, ClipboardList, ChevronDown, ChevronRight, Box } from "lucide-react";
import { useState } from "react";
import { IconColumns3, IconSelectAll } from "@tabler/icons-react";

interface ItemsTableProps {
  items: any[];
  isLoading: boolean;
  searchTerm: string;
  onCreateItem: () => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (item: any) => void;
  onImageClick: (imageUrl: string) => void;
  onInventur: () => void;
}

interface KisteGroup {
  kisteId: string;
  kisteName: string;
  kisteData: any;
  items: any[];
}

function groupByKiste(items: any[]): KisteGroup[] {
  const map = new Map<string, KisteGroup>();
  const noKiste: any[] = [];

  for (const item of items) {
    if (!item.kiste) {
      noKiste.push(item);
    } else {
      if (!map.has(item.kiste)) {
        map.set(item.kiste, {
          kisteId: item.kiste,
          kisteName: item.expand?.kiste?.name || item.kiste,
          kisteData: item.expand?.kiste ?? null,
          items: [],
        });
      }
      map.get(item.kiste)!.items.push(item);
    }
  }

  const groups = Array.from(map.values()).sort((a, b) =>
    a.kisteName.localeCompare(b.kisteName, "de")
  );

  if (noKiste.length > 0) {
    groups.push({
      kisteId: "__none__",
      kisteName: "Ohne Kiste",
      kisteData: null,
      items: noKiste,
    });
  }

  return groups;
}

export function ItemsTable({
  items,
  isLoading,
  searchTerm,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onImageClick,
  onInventur,
}: ItemsTableProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (kisteId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(kisteId)) next.delete(kisteId);
      else next.add(kisteId);
      return next;
    });
  };

  const handlePopoverOpenChange = (itemId: string, isOpen: boolean) => {
    setOpenPopover(isOpen ? itemId : null);
  };

  const groups = groupByKiste(items);

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-4 pt-0 border-b flex gap-2'>
          <Button onClick={onCreateItem} className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Neu
          </Button>
          <Button variant='outline' onClick={onInventur} className='flex items-center gap-2 ml-auto'>
            <ClipboardList className='w-4 h-4' />
            Inventur
          </Button>
        </div>

        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bestand</TableHead>
                <TableHead>Bild</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Kiste</TableHead>
                <TableHead>Anmerkungen</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                  <TableCell><div className="w-8 h-8 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-32"></div></TableCell>
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
        ) : items.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-gray-500'>
              {searchTerm ? "Keine Gegenstände gefunden." : "Keine Gegenstände verfügbar."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bestand</TableHead>
                <TableHead>Bild</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Kiste</TableHead>
                <TableHead>Anmerkungen</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.kisteId);
                return (
                  <>
                    {/* Group header row */}
                    <TableRow
                      key={`group-${group.kisteId}`}
                      className="bg-gray-50 hover:bg-gray-100 cursor-pointer select-none"
                      onClick={() => toggleGroup(group.kisteId)}
                    >
                      <TableCell colSpan={7} className="py-2">
                        <div className="flex items-center gap-2">
                          {isCollapsed
                            ? <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                          }
                          <Box className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="font-semibold text-sm">{group.kisteName}</span>
                          {group.kisteData && (group.kisteData.regal > 0 || group.kisteData.stellplatz > 0) && (
                            <span className="text-xs text-gray-400">
                              Regal {group.kisteData.regal}, Stellplatz {group.kisteData.stellplatz}
                            </span>
                          )}
                          <Badge variant="outline" className="ml-auto text-xs font-normal">
                            {group.items.length} {group.items.length === 1 ? "Gegenstand" : "Gegenstände"}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Item rows */}
                    {!isCollapsed && group.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className='font-medium'>{item.name}</TableCell>
                        <TableCell>{item.bestand} Stk.</TableCell>
                        <TableCell>
                          {item.bild ? (
                            <img
                              src={getImageUrl("items", item.id, item.bild, true)}
                              onClick={() => onImageClick(getImageUrl("items", item.id, item.bild))}
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
                                <Badge key={index} variant='outline' className='text-xs'>{org}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.kiste && item.expand?.kiste ? (
                            <Popover
                              open={openPopover === item.id}
                              onOpenChange={(isOpen) => handlePopoverOpenChange(item.id, isOpen)}
                            >
                              <PopoverTrigger asChild>
                                <Badge variant='outline' className='text-xs cursor-pointer hover:bg-gray-100 transition-colors'>
                                  {item.expand.kiste.name}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className='w-35' align='start'>
                                <div className='space-y-2'>
                                  <div className='flex items-start gap-2'>
                                    <IconColumns3 className='w-4 h-4 text-gray-500 mt-0.5' />
                                    <p className='text-sm font-medium'>
                                      Regal: <span className='text-gray-600 font-normal'>{item.expand.kiste.regal}</span>
                                    </p>
                                  </div>
                                  <div className='flex items-start gap-2'>
                                    <IconSelectAll className='w-4 h-4 text-gray-500 mt-0.5' />
                                    <p className='text-sm font-medium'>
                                      Stellplatz: <span className='text-gray-600 font-normal'>{item.expand.kiste.stellplatz}</span>
                                    </p>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : item.kiste ? (
                            <Badge variant='outline' className='text-xs'>{item.kiste}</Badge>
                          ) : (
                            <span className='text-muted-foreground'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.Anmerkungen ? (
                            <span className='text-sm line-clamp-2 max-w-xs'>{item.Anmerkungen}</span>
                          ) : (
                            <span className='text-muted-foreground'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button variant='outline' size='icon-sm' onClick={() => onEditItem(item)} title='Bearbeiten'>
                              <Edit className='w-4 h-4' />
                            </Button>
                            <Button variant='destructive' size='icon-sm' onClick={() => onDeleteItem(item)} title='Löschen'>
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
