import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ItemMultiSelect } from "./ItemMultiSelect";
import {
  CalendarDays,
  MapPin,
  Package,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { IconTrash } from "@tabler/icons-react";
import SignatureCanvas from "react-signature-canvas";
import { sendNtfyNotification } from "@/lib/notifications";

interface EntnahmenCrudDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "return";
  entnahme?: any;
  onSuccess: () => void;
}

export function EntnahmenCrudDialog({
  isOpen,
  onClose,
  mode,
  entnahme,
  onSuccess,
}: EntnahmenCrudDialogProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const signatureRef = useRef<SignatureCanvas>(null);

  // Form data for create mode
  const [formData, setFormData] = useState({
    zweck: "",
    raus: "",
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
        setFormData({ zweck: "", raus: "", selectedItemIds: [] });
        fetchAvailableItems();
      } else if (mode === "return") {
        setCurrentStep(3);
        // Initialize all items as confirmed by default
        const allItemIds = entnahme?.items || [];
        setConfirmedItems(allItemIds);
        setItemProblems({});
        setReturnSignature(null);
        // Clear signature pad
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
        alert("Bitte wählen Sie ein Datum aus.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2 && mode === "create") {
      if (formData.selectedItemIds.length === 0) {
        alert("Bitte wählen Sie mindestens einen Gegenstand aus.");
        return;
      }
      // Create directly after step 2
      await handleCreate();
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Convert datetime-local format to ISO string
      const rausDate = new Date(formData.raus).toISOString();
      
      const data = {
        zweck: formData.zweck,
        raus: rausDate,
        items: formData.selectedItemIds,
        user: user.id,
      };

      console.log("Creating entnahme with data:", data);
      await pb.collection("entnahmen").create(data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating entnahme:", error);
      alert("Fehler beim Erstellen der Entnahme");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!entnahme) {
      alert("Keine Entnahme gefunden.");
      return;
    }

    // Check if all missing items have problem descriptions
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
      const formData = new FormData();
      formData.append("rein", new Date().toISOString());
      formData.append("rein_signatur", returnSignature);
      
      // Prepare problems data for missing items
      const problems = missingItems.map((itemId: string) => ({
        item: itemId,
        problem: itemProblems[itemId]
      }));
      
      if (problems.length > 0) {
        formData.append("problems", JSON.stringify(problems));
      }
      await pb.collection("entnahmen").update(entnahme.id, formData);

      const returnedBy = entnahme.expand?.user?.name || user?.email || "Unbekannt";
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
      
      // If item is being confirmed (checked), remove any problem description
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
            type='datetime-local'
            value={formData.raus}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, raus: e.target.value }))
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
                {/* Item Multi Select */}
        <div>
          <Label htmlFor='items'>Gegenstände auswählen</Label>
          <ItemMultiSelect
            value={formData.selectedItemIds}
            onChange={(values) =>
              setFormData((prev) => ({ ...prev, selectedItemIds: values }))
            }
            placeholder='Gegenstände suchen und auswählen...'
          />
        </div>

        {/* Selected Items with Location Info */}
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
    const items =
      mode === "create" ? getSelectedItemsData() : getReturnItemsData();

    return (
      <div className='space-y-6'>
        <div className='space-y-3 max-h-64 overflow-y-auto'>
          {items.map((item) => (
            <Card key={item.id} className='relative'>
              <CardContent className='px-4'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-4'>
                    {mode === "return" && (
                      <input
                        type='checkbox'
                        checked={confirmedItems.includes(item.id)}
                        onChange={() => toggleItemConfirmation(item.id)}
                        className='w-4 h-4'
                      />
                    )}

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
                  
                  {/* Problem input field for unchecked items in return mode */}
                  {mode === "return" && !confirmedItems.includes(item.id) && (
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

        {mode === "return" && (
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
        )}
      </div>
    );
  };

  const getStepTitle = () => {
    if (mode === "return") return "Gegenstände zurückgeben";

    switch (currentStep) {
      case 1:
        return "Neue Entnahme - Schritt 1/2";
      case 2:
        return "Neue Entnahme - Schritt 2/2";
      default:
        return "Neue Entnahme";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Progress indicator for create mode */}
          {mode === "create" && (
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
          {mode === "create" && currentStep === 1 && renderStep1()}
          {mode === "create" && currentStep === 2 && renderStep2()}
          {mode === "return" && renderStep3()}

          {/* Navigation buttons */}
          <div className='flex justify-between'>
            <div>
              {mode === "create" && currentStep > 1 && (
                <Button variant='outline' onClick={handleBack}>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Zurück
                </Button>
              )}
            </div>

            <div className='flex gap-2'>
              {mode === "create" && currentStep === 1 && (
                <Button onClick={handleNext}>
                  Weiter
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
              )}

              {mode === "create" && currentStep === 2 && (
                <Button onClick={handleNext} disabled={isLoading}>
                  {isLoading ? "Erstellen..." : "Entnahme erstellen"}
                </Button>
              )}

              {mode === "return" && (
                <Button onClick={handleReturn} disabled={isLoading}>
                  {isLoading ? "Speichern..." : "Rückgabe bestätigen"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
