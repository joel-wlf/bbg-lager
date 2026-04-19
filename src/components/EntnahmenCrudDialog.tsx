import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ItemMultiSelect } from "./ItemMultiSelect";
import {
  CalendarDays,
  MapPin,
  Package,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Truck,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { IconTrash } from "@tabler/icons-react";
import SignatureCanvas from "react-signature-canvas";
import { sendNtfyNotification } from "@/lib/notifications";

interface EntnahmenCrudDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "return" | "edit";
  entnahme?: any;
  onSuccess: () => void;
  preselectedItemIds?: string[];
}

export function EntnahmenCrudDialog({
  isOpen,
  onClose,
  mode,
  entnahme,
  onSuccess,
  preselectedItemIds,
}: EntnahmenCrudDialogProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [bookedItemIds, setBookedItemIds] = useState<Set<string>>(new Set());
  const [createdEntnahmeId, setCreatedEntnahmeId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  // Form data for create/edit mode
  const [formData, setFormData] = useState({
    zweck: "",
    raus: "",
    rein_erwartet: "",
    selectedItemIds: [] as string[],
  });

  // Return mode data
  const [returnSignature, setReturnSignature] = useState<File | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<string[]>([]);
  const [itemProblems, setItemProblems] = useState<{[itemId: string]: string}>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setCurrentStep(1);
        setFormData({
          zweck: "",
          raus: "",
          rein_erwartet: "",
          selectedItemIds: preselectedItemIds || [],
        });
        setBookedItemIds(new Set());
        setCreatedEntnahmeId(null);
        setSelectorOpen((preselectedItemIds?.length ?? 0) === 0);
        fetchAvailableItems();
      } else if (mode === "edit" && entnahme) {
        setCurrentStep(1);
        setFormData({
          zweck: entnahme.zweck || "",
          raus: entnahme.raus ? entnahme.raus.split("T")[0] : "",
          rein_erwartet: entnahme.rein_erwartet ? entnahme.rein_erwartet.split("T")[0] : "",
          selectedItemIds: entnahme.items || [],
        });
        setBookedItemIds(new Set());
        setCreatedEntnahmeId(null);
        setSelectorOpen(false); // edit: already has items, keep collapsed
        fetchAvailableItems();
      } else if (mode === "return") {
        setCurrentStep(3);
        const allItemIds = entnahme?.items || [];
        setConfirmedItems(allItemIds);
        setItemProblems({});
        setReturnSignature(null);
        setTimeout(() => {
          if (signatureRef.current) {
            signatureRef.current.clear();
          }
        }, 100);
      }
    }
  }, [isOpen, mode]);

  const fetchAvailableItems = async () => {
    try {
      const items = await pb.collection("items").getFullList({
        sort: "name",
        expand: "kiste",
      });
      setAvailableItems(items);
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
        // Skip current entnahme in edit mode
        if (mode === "edit" && entnahme && e.id === entnahme.id) continue;
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

  const getReturnItemsData = () => {
    if (!entnahme?.expand?.items) return [];
    return entnahme.expand.items;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
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
      if (mode === "edit") {
        await handleUpdate();
      } else {
        await handleCreate();
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = {
        zweck: formData.zweck,
        raus: formData.raus,
        rein_erwartet: formData.rein_erwartet,
        items: formData.selectedItemIds,
        user: user.id,
      };
      const created = await pb.collection("entnahmen").create(data);
      setCreatedEntnahmeId(created.id);
      setCurrentStep(4); // confirmation step
    } catch (error) {
      console.error("Error creating entnahme:", error);
      alert("Fehler beim Erstellen der Entnahme");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!entnahme) return;
    setIsLoading(true);
    try {
      const data = {
        zweck: formData.zweck,
        raus: formData.raus,
        rein_erwartet: formData.rein_erwartet,
        items: formData.selectedItemIds,
      };
      await pb.collection("entnahmen").update(entnahme.id, data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating entnahme:", error);
      alert("Fehler beim Bearbeiten der Entnahme");
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
      const itemNames = selectedItems.map((i) => i.name).join(", ");
      await sendNtfyNotification({
        title: "Neue Entnahme",
        tags: "package,outbox_tray",
        priority: "default",
        message: `Zweck: ${formData.zweck}\nVon: ${user?.name || user?.email || "Unbekannt"}\nGegenstände (${selectedItems.length}): ${itemNames}\n${selbst ? "Selbst abholen" : "Bereitstellen"}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating selbst_abholung:", error);
      alert("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!entnahme) {
      alert("Keine Entnahme gefunden.");
      return;
    }

    const missingItems = entnahme.items.filter((itemId: string) => !confirmedItems.includes(itemId));
    const missingItemsWithoutProblems = missingItems.filter((itemId: string) => !itemProblems[itemId]?.trim());

    if (missingItemsWithoutProblems.length > 0) {
      alert("Bitte beschreiben Sie das Problem für alle fehlenden Gegenstände.");
      return;
    }

    if (!returnSignature) {
      alert("Bitte erstellen Sie eine Rückgabe-Signatur.");
      return;
    }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("rein", new Date().toISOString());
      fd.append("rein_signatur", returnSignature);

      const problems = missingItems.map((itemId: string) => ({
        item: itemId,
        problem: itemProblems[itemId]
      }));

      if (problems.length > 0) {
        fd.append("problems", JSON.stringify(problems));
      }
      await pb.collection("entnahmen").update(entnahme.id, fd);

      const returnedBy = entnahme.expand?.user?.name || user?.name || user?.email || "Unbekannt";
      await sendNtfyNotification({
        title: "Rückgabe bestätigt",
        tags: "white_check_mark,package",
        priority: "default",
        message: `Entnahme: ${entnahme.zweck || "-"}\nRückgegeben von: ${returnedBy}\nZeitpunkt: ${new Date().toLocaleString("de-DE")}${
          problems.length > 0 ? `\nGemeldete Probleme: ${problems.length}` : ""
        }`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error returning entnahme:", error);
      alert("Fehler beim Zurückgeben der Entnahme");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setReturnSignature(null);
    }
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const canvas = signatureRef.current.getCanvas();
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `signature-${Date.now()}.png`, {
            type: 'image/png'
          });
          setReturnSignature(file);
        }
      }, 'image/png');
    }
  };

  const toggleItemConfirmation = (itemId: string) => {
    setConfirmedItems((prev) => {
      const newConfirmedItems = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];

      if (newConfirmedItems.includes(itemId)) {
        setItemProblems((prevProblems) => {
          const newProblems = { ...prevProblems };
          delete newProblems[itemId];
          return newProblems;
        });
      }

      return newConfirmedItems;
    });
  };

  const updateItemProblem = (itemId: string, problem: string) => {
    setItemProblems((prev) => ({
      ...prev,
      [itemId]: problem
    }));
  };

  const renderStep1 = () => (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <Label htmlFor='zweck'>Zweck der Entnahme</Label>
          <Input
            id='zweck'
            value={formData.zweck}
            minLength={3}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, zweck: e.target.value }))
            }
            placeholder='z.B. KJT 25, Kinderfreizeit...'
          />
        </div>

        <div>
          <Label htmlFor='raus'>Ausgabedatum</Label>
          <Input
            id='raus'
            type='date'
            value={formData.raus}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, raus: e.target.value }))
            }
          />
        </div>

        <div>
          <Label htmlFor='rein_erwartet'>Rückgabe erwartet</Label>
          <Input
            id='rein_erwartet'
            type='date'
            value={formData.rein_erwartet}
            min={formData.raus || undefined}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rein_erwartet: e.target.value }))
            }
          />
        </div>
      </div>
    </div>
  );

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedItemIds: prev.selectedItemIds.filter(id => id !== itemId)
    }));
  };

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
                onChange={(values) =>
                  setFormData((prev) => ({ ...prev, selectedItemIds: values }))
                }
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
            <div className='grid gap-3 max-h-96 overflow-y-auto'>
              {selectedItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className='px-4'>
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex items-start gap-4 flex-1'>
                          {item.bild && (
                            <img
                              src={getImageUrl("items", item.id, item.bild, true)}
                              alt={item.name}
                              className='w-16 h-16 object-cover rounded'
                            />
                          )}
                          <div className='flex-1 space-y-2'>
                            <h4 className='font-medium'>{item.name}</h4>
                            <div className='flex items-center gap-2 text-sm text-gray-600'>
                              <Package className='w-4 h-4' />
                              <span>Bestand: {item.bestand} Stück</span>
                            </div>
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
                      {item.expand?.kiste && (
                        <div className='flex items-center gap-2 text-sm'>
                          <MapPin className='w-4 h-4 text-gray-600' />
                          <Badge variant='outline'>
                            Kiste: {item.expand.kiste.name} - Regal{" "}
                            {item.expand.kiste.regal}, Stellplatz{" "}
                            {item.expand.kiste.stellplatz}
                          </Badge>
                        </div>
                      )}
                      {item.Anmerkungen && (
                        <p className='text-xs text-gray-500'>
                          {item.Anmerkungen}
                        </p>
                      )}
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

  const renderStep3 = () => {
    const items = getReturnItemsData();

    return (
      <div className='space-y-6'>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          Alle zurückgebrachten Gegenstände sind standardmäßig angehakt. <strong>Haken entfernen</strong> um ein Problem oder fehlenden Gegenstand zu melden.
        </div>
        <div className='space-y-3 max-h-64 overflow-y-auto'>
          {items.map((item: any) => (
            <Card key={item.id} className='relative'>
              <CardContent className='px-4'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-4'>
                    <input
                      type='checkbox'
                      checked={confirmedItems.includes(item.id)}
                      onChange={() => toggleItemConfirmation(item.id)}
                      className='w-4 h-4'
                    />
                    {item.bild && (
                      <img
                        src={getImageUrl("items", item.id, item.bild, true)}
                        alt={item.name}
                        className='w-12 h-12 object-cover rounded'
                      />
                    )}
                    <div className='flex-1'>
                      <h4 className='font-medium'>{item.name}</h4>
                      {item.expand?.kiste && (
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <MapPin className='w-3 h-3' />
                          <span>
                            {item.expand.kiste.name} - R{item.expand.kiste.regal}S
                            {item.expand.kiste.stellplatz}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!confirmedItems.includes(item.id) && (
                    <div className='ml-8'>
                      <Label htmlFor={`problem-${item.id}`} className='text-sm text-red-600'>
                        Problem beschreiben (z.B. kaputt, aufgebraucht, verloren):
                      </Label>
                      <Input
                        id={`problem-${item.id}`}
                        value={itemProblems[item.id] || ''}
                        onChange={(e) => updateItemProblem(item.id, e.target.value)}
                        placeholder='Beschreiben Sie das Problem...'
                        className='mt-1'
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Label>Rückgabe-Signatur *</Label>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                height: 200,
                className: 'signature-canvas bg-white border rounded w-full',
              }}
              backgroundColor="white"
              onEnd={saveSignature}
            />
            <div className="flex justify-between items-center mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Löschen
              </Button>
              {returnSignature && (
                <span className="text-sm text-green-600">
                  ✓ Signatur gespeichert
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
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

  const getStepTitle = () => {
    if (mode === "return") return "Gegenstände zurückgeben";
    if (mode === "edit") {
      return currentStep === 1 ? "Entnahme bearbeiten - Schritt 1/2" : "Entnahme bearbeiten - Schritt 2/2";
    }
    switch (currentStep) {
      case 1: return "Neue Entnahme - Schritt 1/2";
      case 2: return "Neue Entnahme - Schritt 2/2";
      case 4: return "Buchung bestätigen";
      default: return "Neue Entnahme";
    }
  };

  const isCreateOrEdit = mode === "create" || mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Progress indicator */}
          {isCreateOrEdit && currentStep <= 2 && (
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

          {/* Step content */}
          {isCreateOrEdit && currentStep === 1 && renderStep1()}
          {isCreateOrEdit && currentStep === 2 && renderStep2()}
          {mode === "return" && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation buttons */}
          {currentStep !== 4 && (
            <div className='flex justify-between'>
              <div>
                {isCreateOrEdit && currentStep > 1 && (
                  <Button variant='outline' onClick={handleBack}>
                    <ArrowLeft className='w-4 h-4 mr-2' />
                    Zurück
                  </Button>
                )}
              </div>

              <div className='flex gap-2'>
                {isCreateOrEdit && currentStep === 1 && (
                  <Button onClick={handleNext}>
                    Weiter
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </Button>
                )}

                {isCreateOrEdit && currentStep === 2 && (
                  <Button onClick={handleNext} disabled={isLoading}>
                    {isLoading
                      ? "Speichern..."
                      : mode === "edit"
                      ? "Speichern"
                      : "Entnahme erstellen"}
                  </Button>
                )}

                {mode === "return" && (
                  <Button onClick={handleReturn} disabled={isLoading}>
                    {isLoading ? "Speichern..." : "Rückgabe bestätigen"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
