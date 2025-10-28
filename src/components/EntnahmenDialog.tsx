import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  CalendarDays,
  User,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";

interface EntnahmenDialogProps {
  entnahme: any;
  isOpen: boolean;
  onClose: () => void;
  onImageClick: (imageUrl: string) => void;
}

export function EntnahmenDialog({
  entnahme,
  isOpen,
  onClose,
  onImageClick,
}: EntnahmenDialogProps) {
  if (!entnahme) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (entnahme: any) => {
    if (entnahme.rein) {
      return (
        <Badge variant='default' className='bg-green-500'>
          Zurückgegeben
        </Badge>
      );
    } else {
      return <Badge variant='secondary'>Ausstehend</Badge>;
    }
  };

  const getItemImage = (item: any) => {
    if (item.bild) {
      return getImageUrl("items", item.id, item.bild);
    }
    return null;
  };

  const getReinSignaturImage = () => {
    if (entnahme.rein_signatur) {
      return getImageUrl("entnahmen", entnahme.id, entnahme.rein_signatur);
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex justify-between items-start'>
            <DialogTitle className='text-2xl'>{entnahme.zweck}</DialogTitle>
            {getStatusBadge(entnahme)}
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='w-5 h-5' />
                Benutzer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-3 gap-4'>
                <div className='col-span-1'>
                  <p className='text-sm font-medium'>Name</p>
                  <p className='text-sm text-gray-600'>
                    {entnahme.expand?.user?.name || "Unbekannt"}
                  </p>
                </div>
                <div className='col-span-2'>
                  <p className='text-sm font-medium'>E-Mail</p>
                  <p className='text-sm text-gray-600'>
                    {entnahme.expand?.user?.email || "Nicht verfügbar"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDays className='w-5 h-5' />
                Zeitraum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium'>Ausgegeben</p>
                  <p className='text-sm text-gray-600'>
                    {formatDate(entnahme.raus)}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Zurückgegeben</p>
                  <p className='text-sm text-gray-600'>
                    {entnahme.rein ? formatDate(entnahme.rein) : "Noch nicht"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Gegenstände ({entnahme.expand?.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-2'>
                {entnahme.expand?.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className='flex items-start gap-4 py-2 border-t'
                  >
                    <div className='flex flex-col gap-2'>
                      <div className='flex gap-4'>
                        {getItemImage(item) && (
                          <img
                            src={getItemImage(item)}
                            alt={item.name}
                            className='w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() => onImageClick(getItemImage(item))}
                          />
                        )}
                        <div className='flex-1 space-y-2'>
                          <h4 className='font-medium'>{item.name}</h4>
                          <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
                            <div>
                              <p className='font-medium'>Bestand</p>
                              <p>{item.bestand} Stück</p>
                            </div>
                            <div>
                              <p className='font-medium'>Organisation</p>
                              <p>
                                {item.organisation?.join(", ") ||
                                  "Nicht angegeben"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {item.expand?.kiste && (
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <MapPin className='w-4 h-4' />
                          <span>
                            Kiste: {item.expand.kiste.name}
                            (Regal {item.expand.kiste.regal}, Stellplatz{" "}
                            {item.expand.kiste.stellplatz})
                          </span>
                        </div>
                      )}
                      {item.Anmerkungen && (
                        <div>
                          <p className='font-medium text-sm'>Anmerkungen</p>
                          <p className='text-sm text-gray-600'>
                            {item.Anmerkungen}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Problems Section */}
          {entnahme.problems &&
            (() => {
              // Check if problems is already an array (from database)
              if (Array.isArray(entnahme.problems)) {
                return entnahme.problems.length > 0;
              }
              // If it's a string, try to parse it
              try {
                const problems = JSON.parse(entnahme.problems);
                return problems.length > 0;
              } catch {
                return false;
              }
            })() && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-red-600'>
                    <AlertTriangle className='w-5 h-5' />
                    Probleme bei der Rückgabe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {(() => {
                      let problems;
                      
                      // Check if problems is already an array (from database)
                      if (Array.isArray(entnahme.problems)) {
                        problems = entnahme.problems;
                      } else {
                        // If it's a string, try to parse it
                        try {
                          problems = JSON.parse(entnahme.problems);
                        } catch {
                          return (
                            <p className='text-red-600'>
                              Fehler beim Laden der Probleme
                            </p>
                          );
                        }
                      }
                      
                      return problems.map((problem: any, index: number) => {
                        // Find the item name from the expanded items
                        const problemItem = entnahme.expand?.items?.find(
                          (item: any) => item.id === problem.item
                        );
                        return (
                          <div
                            key={index}
                            className='p-3 bg-red-50 border border-red-200 rounded'
                          >
                            <div className='flex items-start gap-3'>
                              <AlertTriangle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
                              <div className='flex-1'>
                                <p className='font-medium text-red-800'>
                                  {problemItem?.name ||
                                    "Unbekannter Gegenstand"}
                                </p>
                                <p className='text-sm text-red-600 mt-1'>
                                  {problem.problem}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Return Signature */}
          {entnahme.rein_signatur && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='w-5 h-5' />
                  Rückgabe Signatur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={getReinSignaturImage()}
                  alt='Rückgabe Signatur'
                  className='max-w-full h-auto border rounded cursor-pointer hover:opacity-80 transition-opacity'
                  onClick={() => onImageClick(getReinSignaturImage())}
                />
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadaten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='font-medium'>Erstellt</p>
                  <p className='text-gray-600'>
                    {formatDate(entnahme.created)}
                  </p>
                </div>
                <div>
                  <p className='font-medium'>Zuletzt bearbeitet</p>
                  <p className='text-gray-600'>
                    {formatDate(entnahme.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
