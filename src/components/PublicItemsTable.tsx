import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getImageUrl } from "@/lib/pocketbase";
import { Button } from "./ui/button";
import { AnfrageDialog } from "./AnfrageDialog";
import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronRight, Box } from "lucide-react";

interface PublicItemsTableProps {
  items: any[];
  isLoading: boolean;
  searchTerm: string;
  onImageClick: (imageUrl: string) => void;
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

export function PublicItemsTable({
  items,
  isLoading,
  searchTerm,
  onImageClick,
}: PublicItemsTableProps) {
  const [isAnfrageDialogOpen, setIsAnfrageDialogOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (kisteId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(kisteId)) next.delete(kisteId);
      else next.add(kisteId);
      return next;
    });
  };

  const groups = groupByKiste(items);

  return (
    <>
      <Card>
        <div className="p-4 pt-0 border-b">
          <Button
            className='w-full flex items-center gap-2'
            size="lg"
            onClick={() => setIsAnfrageDialogOpen(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Gegenstände anfragen
          </Button>
        </div>
        <CardContent className='p-0'>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Bestand</TableHead>
                  <TableHead>Bild</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Anmerkungen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="w-8 h-8 bg-gray-200 rounded"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-32"></div></TableCell>
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
                  <TableHead>Anmerkungen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.kisteId);
                  return (
                    <>
                      {/* Group header */}
                      <TableRow
                        key={`group-${group.kisteId}`}
                        className="bg-gray-50 hover:bg-gray-100 cursor-pointer select-none"
                        onClick={() => toggleGroup(group.kisteId)}
                      >
                        <TableCell colSpan={5} className="py-2">
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
                            {item.Anmerkungen ? (
                              <span className='text-sm line-clamp-2 max-w-xs'>{item.Anmerkungen}</span>
                            ) : (
                              <span className='text-muted-foreground'>-</span>
                            )}
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

      <AnfrageDialog
        isOpen={isAnfrageDialogOpen}
        onClose={() => setIsAnfrageDialogOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
}
