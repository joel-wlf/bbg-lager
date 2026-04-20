import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ItemMultiSelect } from "./ItemMultiSelect";
import {
  MapPin,
  Package,
  RotateCcw,
  CheckCircle2,
  Truck,
  User,
  AlertTriangle,
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

type BookingPeriod = { raus: string; rein_erwartet: string };

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
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
  const [isLoading, setIsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [bookedItemIds, setBookedItemIds] = useState<Set<string>>(new Set());
  const [itemConflicts, setItemConflicts] = useState<Map<string, BookingPeriod[]>>(new Map());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [createdEntnahmeId, setCreatedEntnahmeId] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState({
    zweck: "",
    raus: "",
    rein_erwartet: "",
    selectedItemIds: [] as string[],
  });

  // Return mode
  const [returnSignature, setReturnSignature] = useState<File | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<string[]>([]);
  const [itemProblems, setItemProblems] = useState<{ [itemId: string]: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setShowConfirmation(false);
    setShowLocations(false);
    setCreatedEntnahmeId(null);
    setBookedItemIds(new Set());
    setItemConflicts(new Map());

    if (mode === "create") {
      setFormData({ zweck: "", raus: "", rein_erwartet: "", selectedItemIds: preselectedItemIds || [] });
      fetchAvailableItems();
    } else if (mode === "edit" && entnahme) {
      setFormData({
        zweck: entnahme.zweck || "",
        raus: entnahme.raus ? entnahme.raus.split("T")[0] : "",
        rein_erwartet: entnahme.rein_erwartet ? entnahme.rein_erwartet.split("T")[0] : "",
        selectedItemIds: entnahme.items || [],
      });
      fetchAvailableItems();
    } else if (mode === "return") {
      setConfirmedItems(entnahme?.items || []);
      setItemProblems({});
      setReturnSignature(null);
      setTimeout(() => signatureRef.current?.clear(), 100);
    }
  }, [isOpen, mode]);

  // Fetch booked items reactively when both dates are filled
  useEffect(() => {
    if (mode === "return" || !formData.raus || !formData.rein_erwartet) {
      setBookedItemIds(new Set());
      setItemConflicts(new Map());
      return;
    }
    if (formData.rein_erwartet < formData.raus) return;

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
          if (mode === "edit" && entnahme && e.id === entnahme.id) continue;
          for (const id of e.items || []) {
            ids.add(id);
            if (!conflicts.has(id)) conflicts.set(id, []);
            conflicts.get(id)!.push({ raus: e.raus, rein_erwartet: e.rein_erwartet });
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
      const items = await pb.collection("items").getFullList({ sort: "name", expand: "kiste" });
      setAvailableItems(items);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const getSelectedItemsData = () =>
    availableItems.filter((item) => formData.selectedItemIds.includes(item.id));

  // Items currently in cart that conflict with existing bookings
  const conflictingCartItems = formData.selectedItemIds
    .filter((id) => bookedItemIds.has(id))
    .map((id) => ({
      item: availableItems.find((i) => i.id === id),
      periods: itemConflicts.get(id) || [],
    }))
    .filter((c) => c.item);

  const handleSubmit = async () => {
    if (formData.zweck.trim().length < 3) { alert("Zweck muss mindestens 3 Zeichen lang sein."); return; }
    if (!formData.raus) { alert("Bitte Ausgabedatum wählen."); return; }
    if (!formData.rein_erwartet) { alert("Bitte Rückgabedatum wählen."); return; }
    if (formData.rein_erwartet < formData.raus) { alert("Rückgabedatum muss nach dem Ausgabedatum liegen."); return; }
    if (formData.selectedItemIds.length === 0) { alert("Bitte mindestens einen Gegenstand wählen."); return; }
    if (conflictingCartItems.length > 0) { alert("Bitte entferne alle bereits gebuchten Gegenstände aus der Auswahl."); return; }

    setIsLoading(true);
    try {
      if (mode === "edit") {
        await pb.collection("entnahmen").update(entnahme.id, {
          zweck: formData.zweck,
          raus: formData.raus,
          rein_erwartet: formData.rein_erwartet,
          items: formData.selectedItemIds,
        });
        onSuccess();
        onClose();
      } else {
        const created = await pb.collection("entnahmen").create({
          zweck: formData.zweck,
          raus: formData.raus,
          rein_erwartet: formData.rein_erwartet,
          items: formData.selectedItemIds,
          user: user!.id,
        });
        setCreatedEntnahmeId(created.id);

        // Send notification at creation time – Abholart is updated separately
        const selectedItems = getSelectedItemsData();
        await sendNtfyNotification({
          title: "Neue Entnahme",
          tags: "package,outbox_tray",
          priority: "default",
          message: `Zweck: ${formData.zweck}\nVon: ${user?.name || user?.email || "Unbekannt"}\nGegenstände (${selectedItems.length}): ${selectedItems.map((i) => i.name).join(", ")}`,
        });

        setShowConfirmation(true);
      }
    } catch (error) {
      console.error(error);
      alert("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelbstAbholung = async (selbst: boolean) => {
    if (!createdEntnahmeId) return;
    setIsLoading(true);
    try {
      await pb.collection("entnahmen").update(createdEntnahmeId, { selbst_abholung: selbst });
      onSuccess();
      setShowConfirmation(false);
      setShowLocations(true);
    } catch {
      alert("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!entnahme) return;
    const missingItems = entnahme.items.filter((id: string) => !confirmedItems.includes(id));
    const withoutDesc = missingItems.filter((id: string) => !itemProblems[id]?.trim());
    if (withoutDesc.length > 0) { alert("Bitte Problem für alle abgehakten Gegenstände beschreiben."); return; }
    if (!returnSignature) { alert("Bitte Rückgabe-Signatur erstellen."); return; }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("rein", new Date().toISOString());
      fd.append("rein_signatur", returnSignature);
      const problems = missingItems.map((id: string) => ({ item: id, problem: itemProblems[id] }));
      if (problems.length > 0) fd.append("problems", JSON.stringify(problems));
      await pb.collection("entnahmen").update(entnahme.id, fd);

      await sendNtfyNotification({
        title: "Rückgabe bestätigt",
        tags: "white_check_mark,package",
        priority: "default",
        message: `Entnahme: ${entnahme.zweck || "-"}\nRückgegeben von: ${entnahme.expand?.user?.name || user?.name || "Unbekannt"}\nZeitpunkt: ${new Date().toLocaleString("de-DE")}${problems.length > 0 ? `\nProbleme: ${problems.length}` : ""}`,
      });
      onSuccess();
      onClose();
    } catch {
      alert("Fehler beim Zurückgeben");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      signatureRef.current.getCanvas().toBlob((blob) => {
        if (blob) setReturnSignature(new File([blob], `sig-${Date.now()}.png`, { type: "image/png" }));
      }, "image/png");
    }
  };

  const toggleItemConfirmation = (itemId: string) => {
    setConfirmedItems((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      if (next.includes(itemId)) setItemProblems((p) => { const n = { ...p }; delete n[itemId]; return n; });
      return next;
    });
  };

  // ── Confirmation screen (after create) ──────────────────────────────────────
  if (showConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <div className="space-y-6 text-center pt-2">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Buchung erfolgreich!</h3>
              <p className="text-gray-600 text-sm">Wie werden die Gegenstände bereitgestellt?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleSelbstAbholung(true)} disabled={isLoading}>
                <User className="w-8 h-8" />
                <span className="text-sm font-medium">Ich hole selber ab</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleSelbstAbholung(false)} disabled={isLoading}>
                <Truck className="w-8 h-8" />
                <span className="text-sm font-medium">Bitte bereitstellen</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500">Bitte bei der Rückgabe die Lagerverwaltung informieren.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Locations screen (after selbst_abholung selected) ───────────────────────
  if (showLocations) {
    const selectedItems = getSelectedItemsData();
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Buchung abgeschlossen!</h3>
              <p className="text-sm text-gray-600">Hier findest du deine Gegenstände:</p>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedItems.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.bild && (
                        <img src={getImageUrl("items", item.id, item.bild, true)} alt={item.name} className="w-10 h-10 object-cover rounded shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.expand?.kiste ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="font-medium">{item.expand.kiste.name}</span>
                            {(item.expand.kiste.regal > 0 || item.expand.kiste.stellplatz > 0) && (
                              <span className="text-gray-400">
                                · Regal {item.expand.kiste.regal}, Stellplatz {item.expand.kiste.stellplatz}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">Kein Lagerort angegeben</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="w-full" onClick={onClose}>Fertig</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Return mode ──────────────────────────────────────────────────────────────
  if (mode === "return") {
    const items = entnahme?.expand?.items || [];
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Gegenstände zurückgeben</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              Alle zurückgebrachten Gegenstände sind standardmäßig angehakt. <strong>Haken entfernen</strong> um ein Problem oder fehlenden Gegenstand zu melden.
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="px-4 py-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={confirmedItems.includes(item.id)} onChange={() => toggleItemConfirmation(item.id)} className="w-4 h-4" />
                      {item.bild && <img src={getImageUrl("items", item.id, item.bild, true)} alt={item.name} className="w-10 h-10 object-cover rounded" />}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.expand?.kiste && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{item.expand.kiste.name} R{item.expand.kiste.regal}S{item.expand.kiste.stellplatz}
                          </p>
                        )}
                      </div>
                    </div>
                    {!confirmedItems.includes(item.id) && (
                      <div className="ml-7">
                        <Label className="text-xs text-red-600">Problem beschreiben:</Label>
                        <Input value={itemProblems[item.id] || ""} onChange={(e) => setItemProblems((p) => ({ ...p, [item.id]: e.target.value }))} placeholder="z.B. kaputt, verloren..." className="mt-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Label>Rückgabe-Signatur *</Label>
              <div className="border rounded-lg p-3 bg-gray-50 mt-1">
                <SignatureCanvas ref={signatureRef} canvasProps={{ height: 160, className: "bg-white border rounded w-full" }} backgroundColor="white" onEnd={saveSignature} />
                <div className="flex justify-between items-center mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { signatureRef.current?.clear(); setReturnSignature(null); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Löschen
                  </Button>
                  {returnSignature && <span className="text-xs text-green-600">✓ Signatur gespeichert</span>}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleReturn} disabled={isLoading}>{isLoading ? "Speichern..." : "Rückgabe bestätigen"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Create / Edit mode (single form) ────────────────────────────────────────
  const selectedItems = getSelectedItemsData();
  const title = mode === "edit" ? "Entnahme bearbeiten" : "Neue Entnahme";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Zweck */}
          <div>
            <Label htmlFor="zweck">Zweck</Label>
            <Input id="zweck" value={formData.zweck} onChange={(e) => setFormData((p) => ({ ...p, zweck: e.target.value }))} placeholder="z.B. KJT 25, Kinderfreizeit..." />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="raus">Ausgabedatum</Label>
              <Input id="raus" type="date" value={formData.raus} onChange={(e) => setFormData((p) => ({ ...p, raus: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="rein_erwartet">Rückgabe erwartet</Label>
              <Input id="rein_erwartet" type="date" value={formData.rein_erwartet} min={formData.raus || undefined} onChange={(e) => setFormData((p) => ({ ...p, rein_erwartet: e.target.value }))} />
            </div>
          </div>

          {/* Item selector */}
          <div>
            <Label>Gegenstände</Label>
            {bookedItemIds.size > 0 && (
              <p className="text-xs text-orange-600 mt-1">Ausgegraute Gegenstände sind im gewählten Zeitraum bereits gebucht.</p>
            )}
            <div className="mt-1">
              <ItemMultiSelect
                value={formData.selectedItemIds}
                onChange={(values) => setFormData((p) => ({ ...p, selectedItemIds: values }))}
                placeholder="Gegenstände suchen..."
                disabledItemIds={bookedItemIds}
              />
            </div>
          </div>

          {/* Conflict warning */}
          {conflictingCartItems.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Folgende Gegenstände sind im gewählten Zeitraum bereits gebucht:
              </div>
              <ul className="space-y-1">
                {conflictingCartItems.map(({ item, periods }) => (
                  <li key={item.id} className="text-sm text-red-700">
                    <span className="font-medium">{item.name}</span>
                    {periods.map((p, i) => (
                      <span key={i} className="text-red-600 ml-1">
                        ({formatDate(p.raus)} – {formatDate(p.rein_erwartet)})
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600">Bitte entferne diese Gegenstände aus der Auswahl, um fortzufahren.</p>
            </div>
          )}

          {/* Selected item cards */}
          {selectedItems.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {item.bild && <img src={getImageUrl("items", item.id, item.bild, true)} alt={item.name} className="w-10 h-10 object-cover rounded shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Package className="w-3 h-3" />{item.bestand} Stk.</span>
                          {item.expand?.kiste && (
                            <Badge variant="outline" className="text-xs font-normal">
                              <MapPin className="w-3 h-3 mr-1" />{item.expand.kiste.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => setFormData((p) => ({ ...p, selectedItemIds: p.selectedItemIds.filter((id) => id !== item.id) }))} className="text-red-500 hover:text-red-600 shrink-0">
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={isLoading || conflictingCartItems.length > 0}>
              {isLoading ? "Speichern..." : mode === "edit" ? "Speichern" : "Entnahme erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
