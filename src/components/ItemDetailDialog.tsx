import { useEffect, useRef, useState } from "react";
import { pb, getImageUrl } from "@/lib/pocketbase";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Minus, Plus } from "lucide-react";

const NO_KISTE = "__none__";

async function resizeImageTo720p(file: File): Promise<File> {
  const MAX_WIDTH = 1280;
  const MAX_HEIGHT = 720;
  const imageBitmap = await createImageBitmap(file);
  let { width, height } = imageBitmap;
  const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  if (scale === 1) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.8));
  if (!blob) return file;
  return new File([blob], file.name, { type: "image/jpeg" });
}

interface ItemDetailDialogProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedItem: any) => void;
}

export function ItemDetailDialog({
  item,
  isOpen,
  onClose,
  onSaved,
}: ItemDetailDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kisten, setKisten] = useState<any[]>([]);
  const [editBestand, setEditBestand] = useState("0");
  const [editKiste, setEditKiste] = useState(NO_KISTE);
  const [editAnmerkungen, setEditAnmerkungen] = useState("");
  const [newBild, setNewBild] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setEditBestand(item.bestand?.toString() ?? "0");
    setEditKiste(item.kiste || NO_KISTE);
    setEditAnmerkungen(item.Anmerkungen || "");
    setNewBild(null);
    setPreviewUrl(null);
    fetchKisten();
  }, [isOpen, item?.id]);

  const fetchKisten = async () => {
    try {
      pb.autoCancellation(false);
      const list = await pb.collection("kisten").getFullList({ sort: "name" });
      setKisten(list);
    } catch {/* ignore */}
  };

  const handleImageAreaClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImageTo720p(file);
    setNewBild(resized);
    setPreviewUrl(URL.createObjectURL(resized));
    e.target.value = "";
  };

  const adjustBestand = (delta: number) => {
    setEditBestand((v) => Math.max(0, (parseInt(v) || 0) + delta).toString());
  };

  const hasChanges =
    editBestand !== (item?.bestand?.toString() ?? "0") ||
    (editKiste === NO_KISTE ? "" : editKiste) !== (item?.kiste || "") ||
    editAnmerkungen !== (item?.Anmerkungen || "") ||
    newBild !== null;

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append("bestand", editBestand || "0");
      data.append("kiste", editKiste === NO_KISTE ? "" : editKiste);
      data.append("Anmerkungen", editAnmerkungen);
      if (newBild) data.append("bild", newBild);

      const updated = await pb.collection("items").update(item.id, data, {
        expand: "kiste",
      });
      onSaved(updated);
      onClose();
    } catch {
      alert("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const imageUrl =
    previewUrl ??
    (item?.bild ? getImageUrl(item.collectionId ?? "items", item.id, item.bild) : null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0 max-w-md overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Visually-hidden title for accessibility */}
        <DialogTitle className="sr-only">{item?.name}</DialogTitle>

        {/* ── Photo area ── */}
        <div
          className="relative w-full h-64 bg-gray-100 cursor-pointer shrink-0 overflow-hidden"
          onClick={handleImageAreaClick}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={item?.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* hover overlay */}
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Foto ersetzen</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-200 transition-colors">
              <Camera className="w-14 h-14" />
              <span className="text-sm font-medium">Foto hinzufügen</span>
            </div>
          )}
        </div>

        {/* Hidden file input — capture="environment" opens camera on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ── Content ── */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Name + badges */}
          <div>
            <h2 className="text-xl font-bold leading-tight">{item?.name}</h2>
            {item?.organisation?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.organisation.map((org: string) => (
                  <Badge key={org} variant="secondary">{org}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Bestand */}
          <div className="space-y-1.5">
            <Label>Bestand</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBestand(-1)}
                disabled={parseInt(editBestand) <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="0"
                value={editBestand}
                onChange={(e) => setEditBestand(e.target.value)}
                className="w-20 text-center"
              />
              <Button variant="outline" size="icon" onClick={() => adjustBestand(1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Kiste */}
          <div className="space-y-1.5">
            <Label>Kiste</Label>
            <Select
              value={editKiste}
              onValueChange={setEditKiste}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kiste auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_KISTE}>Keine Kiste</SelectItem>
                {kisten.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Anmerkungen */}
          <div className="space-y-1.5">
            <Label>Anmerkungen</Label>
            <Input
              value={editAnmerkungen}
              onChange={(e) => setEditAnmerkungen(e.target.value)}
              placeholder="Notizen zum Gegenstand"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-5 pt-2 shrink-0">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
