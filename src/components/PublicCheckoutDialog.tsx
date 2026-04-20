import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ItemMultiSelect } from "./ItemMultiSelect";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Package,
  CheckCircle2,
  Truck,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { IconTrash } from "@tabler/icons-react";
import { sendNtfyNotification } from "@/lib/notifications";

interface PublicCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItemIds: string[];
  onSuccess: () => void;
}

export function PublicCheckoutDialog({
  isOpen,
  onClose,
  preselectedItemIds,
  onSuccess,
}: PublicCheckoutDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [bookedItemIds, setBookedItemIds] = useState<Set<string>>(new Set());
  const [createdEntnahmeId, setCreatedEntnahmeId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    zweck: "",
    raus: "",
    rein_erwartet: "",
    selectedItemIds: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: "",
        zweck: "",
        raus: "",
        rein_erwartet: "",
        selectedItemIds: preselectedItemIds,
      });
      setBookedItemIds(new Set());
      setCreatedEntnahmeId(null);
      setSelectorOpen(preselectedItemIds.length === 0);
      fetchAvailableItems();
    }
  }, [isOpen]);

  // Sync preselectedItemIds when they change while dialog is open
  useEffect(() => {
    if (isOpen && currentStep === 1) {
      setFormData((prev) => ({ ...prev, selectedItemIds: preselectedItemIds }));
    }
  }, [preselectedItemIds]);

  // Reactive conflict detection when dates change (like admin EntnahmenCrudDialog)
  useEffect(() => {
    if (!formData.raus || !formData.rein_erwartet || formData.rein_erwartet < formData.raus) {
      setBookedItemIds(new Set());
      setItemConflicts(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        pb.autoCancellation(false);
        const result = await pb.collection("entnahmen").getFullList({
          filter: `rein = "" && raus <= "${formData.rein_erwartet}" && rein_erwartet >= "${formData.raus}"`,
          fields: "id,items,raus,rein_erwartet",
        });
        if (cancelled) return;
        const ids = new Set<string>();
        const conflicts = new Map<string, BookingPeriod[]>();
        for (const e of result) {
          for (const itemId of e.items || []) {
            ids.add(itemId);
            if (!conflicts.has(itemId)) conflicts.set(itemId, []);
            conflicts.get(itemId)!.push({ raus: e.raus, rein_erwartet: e.rein_erwartet });
          }
        }
        setBookedItemIds(ids);
        setItemConflicts(conflicts);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [formData.raus, formData.rein_erwartet]);

  const fetchAvailableItems = async () => {
    try {
      pb.autoCancellation(false);
      const items = await pb.collection("items").getFullList({
        sort: "name",
        expand: "kiste",
      });
      setAvailableItems(items as any[]);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchBookedItemIds = async (raus: string, rein_erwartet: string) => {
    if (!raus || !rein_erwartet) return;
    try {
      pb.autoCancellation(false);
      const result = await pb.collection("entnahmen").getFullList({
        filter: `rein = "" && raus <= "${rein_erwartet}" && rein_erwartet >= "${raus}"`,
        fields: "id,items",
      });
      const ids = new Set<string>();
      for (const e of result) {
        for (const itemId of e.items || []) ids.add(itemId);
      }
      setBookedItemIds(ids);
    } catch (error) {
      console.error("Error fetching booked items:", error);
    }
  };

  const getSelectedItemsData = () => {
    return availableItems.filter((item) =>
      formData.selectedItemIds.includes(item.id)
    );
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        alert("Bitte geben Sie Ihren Namen ein.");
        return;
      }
      if (formData.zweck.trim().length < 3) {
        alert("Der Zweck muss mindestens 3 Zeichen lang sein.");
        return;
      }
      if (!formData.raus) {
        alert("Bitte wählen Sie ein Ausgabedatum aus.");
        return;
      }
      if (!formData.rein_erwartet) {
        alert("Bitte wählen Sie ein erwartetes Rückgabedatum aus.");
        return;
      }
      if (formData.rein_erwartet < formData.raus) {
        alert("Das Rückgabedatum muss nach dem Ausgabedatum liegen.");
        return;
      }
      await fetchBookedItemIds(formData.raus, formData.rein_erwartet);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.selectedItemIds.length === 0) {
        alert("Bitte wählen Sie mindestens einen Gegenstand aus.");
        return;
      }
      await handleCreate();
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const data = {
        zweck: formData.zweck,
        raus: formData.raus,
        rein_erwartet: formData.rein_erwartet,
        items: formData.selectedItemIds,
        name: formData.name,
        user: "",
      };
      const created = await pb.collection("entnahmen").create(data);
      setCreatedEntnahmeId(created.id);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error creating entnahme:", error);
      alert("Fehler beim Erstellen der Buchung");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelbstAbholung = async (selbst: boolean) => {
    if (!createdEntnahmeId) return;
    setIsLoading(true);
    try {
      await pb.collection("entnahmen").update(createdEntnahmeId, { selbst_abholung: selbst });

      const selectedItems = getSelectedItemsData();
      const itemNames = selectedItems.map((i: any) => i.name).join(", ");
      await sendNtfyNotification({
        title: "Neue Entnahme (öffentlich)",
        tags: "package,outbox_tray",
        priority: "default",
        message: `Zweck: ${formData.zweck}\nVon: ${formData.name}\nGegenstände (${selectedItems.length}): ${itemNames}\n${selbst ? "Selbst abholen" : "Bereitstellen"}`,
      });

      setCurrentStep(4);
    } catch (error) {
      console.error("Error updating selbst_abholung:", error);
      alert("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedItemIds: prev.selectedItemIds.filter((id) => id !== itemId),
    }));
  };

  const renderStep1 = () => (
    <div className='space-y-4'>
      <div>
        <Label htmlFor='name'>Ihr Name</Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder='Vor- und Nachname'
        />
      </div>
      <div>
        <Label htmlFor='zweck'>Zweck der Entnahme</Label>
        <Input
          id='zweck'
          value={formData.zweck}
          minLength={3}
          onChange={(e) => setFormData((prev) => ({ ...prev, zweck: e.target.value }))}
          placeholder='z.B. KJT 25, Kinderfreizeit...'
        />
      </div>
      <div>
        <Label htmlFor='raus'>Ausgabedatum</Label>
        <Input
          id='raus'
          type='date'
          value={formData.raus}
          onChange={(e) => setFormData((prev) => ({ ...prev, raus: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor='rein_erwartet'>Rückgabe erwartet</Label>
        <Input
          id='rein_erwartet'
          type='date'
          value={formData.rein_erwartet}
          min={formData.raus || undefined}
          onChange={(e) => setFormData((prev) => ({ ...prev, rein_erwartet: e.target.value }))}
        />
      </div>
      {formData.raus && formData.rein_erwartet && conflictingCartItems.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg space-y-1">
          <div className="flex items-center gap-2 text-orange-700 font-medium text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {conflictingCartItems.length} ausgewählte{conflictingCartItems.length !== 1 ? " Gegenstände sind" : "r Gegenstand ist"} im gewählten Zeitraum bereits gebucht
          </div>
          <ul className="space-y-0.5 mt-1">
            {conflictingCartItems.map(({ item, periods }) => (
              <li key={item.id} className="text-xs text-orange-700">
                <span className="font-medium">{item.name}</span>
                {periods.map((p: BookingPeriod, i: number) => (
                  <span key={i} className="ml-1">({formatDate(p.raus)} – {formatDate(p.rein_erwartet)})</span>
                ))}
              </li>
            ))}
          </ul>
          <p className="text-xs text-orange-600">Diese Gegenstände kannst du im nächsten Schritt entfernen.</p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    const selectedItems = getSelectedItemsData();

    return (
      <div className='space-y-4'>
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium mb-1"
            onClick={() => setSelectorOpen((o) => !o)}
          >
            {selectorOpen
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />}
            Gegenstände hinzufügen / ändern
          </button>
          {selectorOpen && (
            <>
              {bookedItemIds.size > 0 && (
                <p className="text-xs text-orange-600 mb-1">
                  Ausgegraute Gegenstände sind im gewählten Zeitraum bereits gebucht.
                </p>
              )}
              <ItemMultiSelect
                value={formData.selectedItemIds}
                onChange={(values) => setFormData((prev) => ({ ...prev, selectedItemIds: values }))}
                placeholder='Gegenstände suchen und auswählen...'
                disabledItemIds={bookedItemIds}
              />
            </>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className='space-y-3'>
            <h4 className='font-medium'>
              Ausgewählte Gegenstände ({selectedItems.length}):
            </h4>
            <div className='grid gap-3 max-h-64 overflow-y-auto'>
              {selectedItems.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className='px-4 py-3'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-start gap-3 flex-1'>
                        {item.bild && (
                          <img
                            src={getImageUrl("items", item.id, item.bild, true)}
                            alt={item.name}
                            className='w-12 h-12 object-cover rounded'
                          />
                        )}
                        <div className='flex-1 space-y-1'>
                          <h4 className='font-medium text-sm'>{item.name}</h4>
                          <div className='flex items-center gap-2 text-xs text-gray-600'>
                            <Package className='w-3 h-3' />
                            <span>{item.bestand} Stück</span>
                          </div>
                          {item.expand?.kiste && (
                            <div className='flex items-center gap-2 text-xs'>
                              <MapPin className='w-3 h-3 text-gray-600' />
                              <Badge variant='outline' className='text-xs'>
                                {item.expand.kiste.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRemoveItem(item.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <IconTrash className='w-4 h-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className='space-y-6 text-center'>
      <div className='flex flex-col items-center gap-3'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
          <CheckCircle2 className='w-10 h-10 text-green-600' />
        </div>
        <h3 className='text-xl font-semibold'>Buchung erfolgreich!</h3>
        <p className='text-gray-600 text-sm'>
          Wie werden die Gegenstände bereitgestellt?
        </p>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <Button
          variant='outline'
          className='h-auto py-4 flex flex-col gap-2'
          onClick={() => handleSelbstAbholung(true)}
          disabled={isLoading}
        >
          <User className='w-8 h-8' />
          <span className='text-sm font-medium'>Ich hole selber ab</span>
        </Button>
        <Button
          variant='outline'
          className='h-auto py-4 flex flex-col gap-2'
          onClick={() => handleSelbstAbholung(false)}
          disabled={isLoading}
        >
          <Truck className='w-8 h-8' />
          <span className='text-sm font-medium'>Bitte bereitstellen</span>
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Bitte bei der Rückgabe die Lagerverwaltung informieren.
      </p>
    </div>
  );

  const renderStep4 = () => {
    const selectedItems = getSelectedItemsData();
    return (
      <div className='space-y-4'>
        <div className='flex flex-col items-center gap-2 text-center'>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
            <CheckCircle2 className='w-7 h-7 text-green-600' />
          </div>
          <h3 className='text-lg font-semibold'>Buchung abgeschlossen!</h3>
          <p className='text-sm text-gray-600'>Hier findest du deine Gegenstände:</p>
        </div>

        <div className='space-y-2 max-h-80 overflow-y-auto'>
          {selectedItems.map((item: any) => (
            <Card key={item.id}>
              <CardContent className='px-4 py-3'>
                <div className='flex items-center gap-3'>
                  {item.bild && (
                    <img
                      src={getImageUrl("items", item.id, item.bild, true)}
                      alt={item.name}
                      className='w-10 h-10 object-cover rounded shrink-0'
                    />
                  )}
                  <div className='flex-1'>
                    <p className='font-medium text-sm'>{item.name}</p>
                    {item.expand?.kiste ? (
                      <div className='flex items-center gap-1 text-xs text-gray-600 mt-0.5'>
                        <MapPin className='w-3 h-3 shrink-0' />
                        <span className='font-medium'>{item.expand.kiste.name}</span>
                        {(item.expand.kiste.regal > 0 || item.expand.kiste.stellplatz > 0) && (
                          <span className='text-gray-400'>
                            · Regal {item.expand.kiste.regal}, Stellplatz {item.expand.kiste.stellplatz}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className='text-xs text-gray-400 mt-0.5'>Kein Lagerort angegeben</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className='text-xs text-gray-500 text-center'>
          Bitte bei der Rückgabe die Lagerverwaltung informieren.
        </p>

        <Button className='w-full' onClick={onSuccess}>
          Fertig
        </Button>
      </div>
    );
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Buchung - Schritt 1/2";
      case 2: return "Buchung - Schritt 2/2";
      case 3: return "Buchung bestätigen";
      case 4: return "Lagerorte";
      default: return "Buchung";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Progress */}
          {currentStep <= 2 && (
            <div className='flex items-center justify-center space-x-4'>
              {[1, 2].map((step) => (
                <div key={step} className='flex items-center'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 2 && (
                    <ArrowRight
                      className={`w-4 h-4 ml-3 ${
                        step < currentStep ? "text-blue-500" : "text-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {currentStep < 3 && (
            <div className='flex justify-between'>
              <div>
                {currentStep > 1 && (
                  <Button variant='outline' onClick={handleBack}>
                    <ArrowLeft className='w-4 h-4 mr-2' />
                    Zurück
                  </Button>
                )}
              </div>
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading
                  ? "Erstellen..."
                  : currentStep === 1
                  ? <>Weiter <ArrowRight className='w-4 h-4 ml-2' /></>
                  : "Buchung abschicken"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
