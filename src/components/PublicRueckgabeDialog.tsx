import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { MapPin, RotateCcw } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { sendNtfyNotification } from "@/lib/notifications";

interface PublicRueckgabeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entnahme: any;
  anfrageId: string;
  onSuccess: () => void;
}

export function PublicRueckgabeDialog({
  isOpen,
  onClose,
  entnahme,
  anfrageId,
  onSuccess,
}: PublicRueckgabeDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<string[]>([]);
  const [itemProblems, setItemProblems] = useState<{ [itemId: string]: string }>({});
  const [returnSignature, setReturnSignature] = useState<File | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (isOpen && entnahme) {
      setCurrentStep(1);
      setConfirmedItems(entnahme.items || []);
      setItemProblems({});
      setReturnSignature(null);
      setTimeout(() => {
        if (signatureRef.current) {
          signatureRef.current.clear();
        }
      }, 100);
    }
  }, [isOpen, entnahme]);

  const getReturnItemsData = () => {
    if (!entnahme?.expand?.items) return [];
    return entnahme.expand.items;
  };

  const toggleItemConfirmation = (itemId: string) => {
    setConfirmedItems((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];

      if (next.includes(itemId)) {
        setItemProblems((prevProblems) => {
          const updated = { ...prevProblems };
          delete updated[itemId];
          return updated;
        });
      }

      return next;
    });
  };

  const updateItemProblem = (itemId: string, problem: string) => {
    setItemProblems((prev) => ({ ...prev, [itemId]: problem }));
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
            type: "image/png",
          });
          setReturnSignature(file);
        }
      }, "image/png");
    }
  };

  const handleNextStep = () => {
    const missingItems = (entnahme?.items || []).filter(
      (itemId: string) => !confirmedItems.includes(itemId)
    );
    const missingWithoutProblems = missingItems.filter(
      (itemId: string) => !itemProblems[itemId]?.trim()
    );

    if (missingWithoutProblems.length > 0) {
      alert("Bitte beschreiben Sie das Problem für alle nicht zurückgegebenen Gegenstände.");
      return;
    }

    setCurrentStep(2);
  };

  const handleConfirm = async () => {
    if (!returnSignature) {
      alert("Bitte erstellen Sie eine Unterschrift.");
      return;
    }

    setIsLoading(true);
    try {
      const missingItems = (entnahme?.items || []).filter(
        (itemId: string) => !confirmedItems.includes(itemId)
      );
      const problems = missingItems.map((itemId: string) => ({
        item: itemId,
        problem: itemProblems[itemId],
      }));

      const formData = new FormData();
      formData.append("rein", new Date().toISOString());
      formData.append("rein_signatur", returnSignature);
      if (problems.length > 0) {
        formData.append("problems", JSON.stringify(problems));
      }

      await pb.collection("entnahmen").update(entnahme.id, formData);
      await pb.collection("anfragen").update(anfrageId, {
        status: "zurückgegeben",
      });

      await sendNtfyNotification({
        title: "Rückgabe bestätigt (öffentlich)",
        tags: "white_check_mark,package",
        priority: "default",
        message: `Entnahme: ${entnahme.zweck || "-"}\nZeitpunkt: ${new Date().toLocaleString("de-DE")}${
          problems.length > 0 ? `\nGemeldete Probleme: ${problems.length}` : ""
        }`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error confirming return:", error);
      alert("Fehler bei der Rückgabe. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const items = getReturnItemsData();

  const renderStep1 = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Bitte bestätigen Sie, welche Gegenstände zurückgegeben werden. Nicht vorhandene Gegenstände bitte deaktivieren und ein Problem beschreiben.
      </p>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map((item: any) => (
          <Card key={item.id} className="relative">
            <CardContent className="px-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={confirmedItems.includes(item.id)}
                    onChange={() => toggleItemConfirmation(item.id)}
                    className="w-4 h-4"
                  />
                  {item.bild && (
                    <img
                      src={getImageUrl("items", item.id, item.bild, true)}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    {item.expand?.kiste && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {item.expand.kiste.name} - R{item.expand.kiste.regal}S
                          {item.expand.kiste.stellplatz}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!confirmedItems.includes(item.id) && (
                  <div className="ml-8">
                    <Label htmlFor={`problem-${item.id}`} className="text-sm text-red-600">
                      Problem beschreiben (z.B. kaputt, aufgebraucht, verloren):
                    </Label>
                    <Input
                      id={`problem-${item.id}`}
                      value={itemProblems[item.id] || ""}
                      onChange={(e) => updateItemProblem(item.id, e.target.value)}
                      placeholder="Beschreiben Sie das Problem..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Bitte unterschreiben Sie zur Bestätigung der Rückgabe.
      </p>
      <Label>Unterschrift *</Label>
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            height: 200,
            className: "signature-canvas bg-white border rounded w-full",
          }}
          backgroundColor="white"
          onEnd={saveSignature}
        />
        <div className="flex justify-between items-center mt-2">
          <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Löschen
          </Button>
          {returnSignature && (
            <span className="text-sm text-green-600">✓ Unterschrift gespeichert</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rückgabe bestätigen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          <div className="flex justify-between">
            {currentStep === 2 ? (
              <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                Zurück
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
            )}

            {currentStep === 1 && (
              <Button onClick={handleNextStep}>Weiter zur Unterschrift</Button>
            )}
            {currentStep === 2 && (
              <Button onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? "Wird gespeichert..." : "Rückgabe bestätigen"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
