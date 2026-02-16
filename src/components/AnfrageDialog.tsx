import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ItemMultiSelect } from "./ItemMultiSelect";
import {
  CalendarDays,
  Package,
  User,
  MessageSquare,
} from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { sendNtfyNotification } from "@/lib/notifications";

interface AnfrageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AnfrageDialog({
  isOpen,
  onClose,
  onSuccess,
}: AnfrageDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    zweck: "",
    raus: "",
    selectedItemIds: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({ name: "", zweck: "", raus: "", selectedItemIds: [] });
      fetchAvailableItems();
    }
  }, [isOpen]);

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

  const handleNext = async () => {
    if (currentStep === 1) {
      if (formData.name.trim().length < 3) {
        alert("Der Name muss mindestens 3 Zeichen lang sein.");
        return;
      }
      if (formData.zweck.trim().length < 3) {
        alert("Der Zweck muss mindestens 3 Zeichen lang sein.");
        return;
      }
      if (!formData.raus) {
        alert("Bitte wählen Sie ein Datum aus.");
        return;
      }
      
      // Check if date is after current day
      const selectedDate = new Date(formData.raus);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        alert("Das Datum muss nach dem heutigen Tag liegen.");
        return;
      }
      
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.selectedItemIds.length === 0) {
        alert("Bitte wählen Sie mindestens einen Gegenstand aus.");
        return;
      }
      // Create request after step 2
      await handleCreate();
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      // Convert datetime-local format to ISO string
      const rausDate = new Date(formData.raus).toISOString();
      
      const data = {
        name: formData.name,
        zweck: formData.zweck,
        raus: rausDate,
        items: formData.selectedItemIds,
      };

      console.log("Creating anfrage with data:", data);
      await pb.collection("anfragen").create(data);

      await sendNtfyNotification({
        title: "Neue Anfrage eingegangen",
        tags: "inbox,package",
        priority: "high",
        message: `Name: ${data.name}\nZweck: ${data.zweck}\nBenötigt ab: ${new Date(
          rausDate
        ).toLocaleString("de-DE")}\nAnzahl Gegenstände: ${data.items.length}`,
      });
      
      alert("Ihre Anfrage wurde erfolgreich erstellt!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating anfrage:", error);
      alert("Fehler beim Erstellen der Anfrage");
    } finally {
      setIsLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T09:00`;
  };

  const renderStep1 = () => (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 mb-4'>
        <User className='w-5 h-5' />
        <h3 className='font-semibold'>Schritt 1: Persönliche Daten</h3>
      </div>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='name'>Name *</Label>
          <Input
            id='name'
            type='text'
            placeholder='Ihr vollständiger Name'
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
          <p className='text-xs text-gray-500 mt-1'>Mindestens 3 Zeichen</p>
        </div>

        <div>
          <Label htmlFor='zweck'>Zweck der Anfrage *</Label>
          <Input
            id='zweck'
            type='text'
            placeholder='Wofür benötigen Sie die Gegenstände?'
            value={formData.zweck}
            onChange={(e) =>
              setFormData({ ...formData, zweck: e.target.value })
            }
            required
          />
          <p className='text-xs text-gray-500 mt-1'>Mindestens 3 Zeichen</p>
        </div>

        <div>
          <Label htmlFor='raus'>Benötigt ab *</Label>
          <Input
            id='raus'
            type='datetime-local'
            value={formData.raus}
            min={getTomorrowDate()}
            onChange={(e) =>
              setFormData({ ...formData, raus: e.target.value })
            }
            required
          />
          <p className='text-xs text-gray-500 mt-1'>Muss nach dem heutigen Tag liegen</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 mb-4'>
        <Package className='w-5 h-5' />
        <h3 className='font-semibold'>Schritt 2: Gegenstände auswählen</h3>
      </div>

      <ItemMultiSelect
        value={formData.selectedItemIds}
        onChange={(selectedIds) =>
          setFormData({ ...formData, selectedItemIds: selectedIds })
        }
        placeholder="Gegenstände auswählen..."
      />

      {formData.selectedItemIds.length > 0 && (
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className='text-sm flex items-center gap-2'>
              <Package className='w-4 h-4' />
              Ausgewählte Gegenstände ({formData.selectedItemIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3'>
              {getSelectedItemsData().map((item) => (
                <div
                  key={item.id}
                  className='flex items-center gap-3 p-2 border rounded'
                >
                  {item.bild && (
                    <img
                      src={getImageUrl("items", item.id, item.bild, true)}
                      alt={item.name}
                      className='w-8 h-8 object-cover rounded'
                    />
                  )}
                  <div className='flex-1'>
                    <div className='font-medium'>{item.name}</div>
                    <div className='text-sm text-gray-500'>
                      Bestand: {item.bestand} Stk.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='w-5 h-5' />
            Gegenstände anfragen
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Progress indicator */}
          <div className='flex items-center gap-2'>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 ${
                currentStep >= 2 ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation buttons */}
          <div className='flex justify-between pt-4'>
            <Button
              variant='outline'
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
            >
              {currentStep === 1 ? "Abbrechen" : "Zurück"}
            </Button>
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading
                ? "Wird erstellt..."
                : currentStep === 1
                ? "Weiter"
                : "Anfrage erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
