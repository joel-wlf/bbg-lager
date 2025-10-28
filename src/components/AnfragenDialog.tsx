import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  Calendar,
  Package,
  User,
  MessageSquare,
  Plus,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { IconMessage } from "@tabler/icons-react";

interface AnfragenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  anfrage: any;
  onEntnahmeCreated: () => void;
}

export function AnfragenDialog({
  isOpen,
  onClose,
  anfrage,
  onEntnahmeCreated,
}: AnfragenDialogProps) {
  const { user } = useAuth();
  const [isCreatingEntnahme, setIsCreatingEntnahme] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateEntnahme = async () => {
    if (!user) {
      alert("Sie müssen angemeldet sein, um eine Entnahme zu erstellen.");
      return;
    }

    setIsCreatingEntnahme(true);
    try {
      // Create a new entnahme based on the anfrage
      const entnahmeData = {
        zweck: `Anfrage von ${anfrage.name}: ${anfrage.zweck}`,
        raus: anfrage.raus,
        items: anfrage.items,
        user: user.id,
        anmerkungen: `Erstellt aus öffentlicher Anfrage (ID: ${anfrage.id})`,
      };

      console.log("Creating entnahme with data:", entnahmeData);
      await pb.collection("entnahmen").create(entnahmeData);

      // Optionally, you could mark the anfrage as processed
      // await pb.collection("anfragen").update(anfrage.id, { status: "processed" });

      alert("Entnahme erfolgreich erstellt!");
      onEntnahmeCreated();
    } catch (error) {
      console.error("Error creating entnahme:", error);
      alert("Fehler beim Erstellen der Entnahme");
    } finally {
      setIsCreatingEntnahme(false);
    }
  };

  if (!anfrage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='w-5 h-5' />
            Anfrage Details
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Header Info */}
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className='flex flex-col items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <User className='w-5 h-5' />
                  {anfrage.name}
                </div>
                <Badge variant='outline'>
                  <Clock className='w-3 h-3 mr-1' />
                  {formatDate(anfrage.created)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-col items-start gap-4'>
                <div className='flex items-center gap-2'>
                  <IconMessage className='w-4 h-4 text-gray-600' />
                  <span className='text-sm flex flex-col'>
                    <strong>Zweck:</strong>
                    <p>{anfrage.zweck}</p>
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4 text-gray-600' />
                  <span className='text-sm flex flex-col'>
                    <strong>Benötigt ab:</strong>
                    <p> {formatDate(anfrage.raus)}</p>
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Package className='w-4 h-4 text-gray-600' />
                  <span className='text-sm flex flex-col'>
                    <strong>Gegenstände:</strong>
                    <p>{anfrage.items?.length || 0}</p>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Items List */}
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Angeforderte Gegenstände
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anfrage.expand?.items && anfrage.expand.items.length > 0 ? (
                <div className='grid gap-3'>
                  {anfrage.expand.items.map((item: any) => (
                    <div
                      key={item.id}
                      className='flex items-center gap-3 p-3 border rounded-lg'
                    >
                      {item.bild && (
                        <img
                          src={getImageUrl("items", item.id, item.bild, true)}
                          alt={item.name}
                          className='w-12 h-12 object-cover rounded'
                        />
                      )}
                      <div className='flex-1'>
                        <div className='font-medium'>{item.name}</div>
                        <div className='text-sm text-gray-500'>
                          Verfügbar: {item.bestand} Stk.
                        </div>
                        {item.organisation && item.organisation.length > 0 && (
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {item.organisation
                              .slice(0, 2)
                              .map((org: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {org}
                                </Badge>
                              ))}
                            {item.organisation.length > 2 && (
                              <Badge variant='outline' className='text-xs'>
                                +{item.organisation.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>
                  Keine Gegenstände gefunden
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='flex justify-between items-center pt-4 border-t'>
            <div className='text-sm text-gray-500'>
              Anfrage-ID: {anfrage.id}
            </div>

            <div className='flex gap-3'>
              <Button
                onClick={handleCreateEntnahme}
                disabled={isCreatingEntnahme}
                className='flex items-center gap-2'
              >
                {isCreatingEntnahme ? (
                  <>
                    <Clock className='w-4 h-4 animate-spin' />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Plus className='w-4 h-4' />
                    Entnahme erstellen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
