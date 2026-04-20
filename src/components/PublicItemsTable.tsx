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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getImageUrl } from "@/lib/pocketbase";
import { Button } from "./ui/button";
import { useState } from "react";
import { ChevronDown, ChevronRight, Box, ShoppingCart, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicCheckoutDialog } from "./PublicCheckoutDialog";

type BookingPeriod = { raus: string; rein_erwartet: string };

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const ORGANISATION_OPTIONS = ["Jugend", "Kinder"];

interface PublicItemsTableProps {
  items: any[];
  isLoading: boolean;
  searchTerm: string;
  organisationFilter: string | null;
  onOrganisationFilterChange: (filter: string | null) => void;
  onImageClick: (imageUrl: string) => void;
  futureBookings?: Map<string, BookingPeriod[]>;
  onBookingCreated?: () => void;
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
  organisationFilter,
  onOrganisationFilterChange,
  onImageClick,
  futureBookings,
  onBookingCreated,
}: PublicItemsTableProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const toggleGroup = (kisteId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(kisteId)) next.delete(kisteId);
      else next.add(kisteId);
      return next;
    });
  };

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const groups = groupByKiste(items);

  return (
    <>
      <Card>
        <div className="px-4 py-2 bg-blue-50 border-b text-xs text-blue-700 flex items-center gap-2">
          <span>Gegenstände anklicken zum Auswählen — dann unten auf <strong>Zur Buchung</strong> klicken.</span>
        </div>
        <div className="p-4 pt-0 border-b flex items-center justify-between gap-2">
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
        <CardContent className='p-0'>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
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
                    <TableCell><div className="w-4 h-4 bg-gray-200 rounded"></div></TableCell>
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
                  <TableHead className="w-8"></TableHead>
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
                        <TableCell colSpan={6} className="py-2">
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
                        <TableRow
                          key={item.id}
                          className={cn(
                            "cursor-pointer",
                            selectedItemIds.includes(item.id) && "bg-blue-50"
                          )}
                          onClick={() => toggleItem(item.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedItemIds.includes(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className='font-medium'>
                            <div className="flex items-center gap-1">
                              <span>{item.name}</span>
                              {futureBookings?.has(item.id) && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-orange-500 hover:text-orange-600 shrink-0"
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-56 p-3" align="start">
                                    <p className="text-sm font-medium mb-2">Bereits gebucht in:</p>
                                    <ul className="space-y-1">
                                      {futureBookings.get(item.id)!.map((p, i) => (
                                        <li key={i} className="text-xs text-gray-600">
                                          {formatDate(p.raus)} – {formatDate(p.rein_erwartet)}
                                        </li>
                                      ))}
                                    </ul>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.bestand} Stk.</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
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

      {/* Sticky cart bar */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-white border shadow-lg rounded-xl px-4 py-3 flex items-center gap-4 max-w-sm w-full">
            <div className="flex-1">
              <p className="font-medium text-sm">{selectedItemIds.length} Gegenstand{selectedItemIds.length !== 1 ? "e" : ""} ausgewählt</p>
            </div>
            <Button size="sm" onClick={() => setIsCheckoutOpen(true)} className="flex items-center gap-1.5 shrink-0">
              <ShoppingCart className="w-4 h-4" />
              Zur Buchung
            </Button>
          </div>
        </div>
      )}

      <PublicCheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        preselectedItemIds={selectedItemIds}
        onSuccess={() => {
          setSelectedItemIds([]);
          setIsCheckoutOpen(false);
          onBookingCreated?.();
        }}
      />
    </>
  );
}
