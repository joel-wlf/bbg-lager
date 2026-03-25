import { useState, useRef } from 'react';
import { pb, getImageUrl } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Check,
  X,
  Pencil,
  ChevronLeft,
  CheckCircle2,
  Package,
  Users,
  Baby,
  Layers,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

type Phase = 'area-select' | 'box-list' | 'swipe';
type Area = 'Jugend' | 'Kinder' | 'Beides';
type DialogStep = null | 'choice' | 'edit' | 'delete';

interface InventurItem {
  id: string;
  name: string;
  bestand: number;
  organisation: string[];
  Anmerkungen: string;
  bild: string;
  kiste: string;
  collectionId: string;
  collectionName: string;
}

interface InventurKiste {
  id: string;
  name: string;
  regal: number;
  stellplatz: number;
  items: InventurItem[];
}

function haptic(pattern: number | number[]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ---------------------------------------------------------------------------
// SwipeCard
// ---------------------------------------------------------------------------
function SwipeCard({
  item,
  onSwipeRight,
  onSwipeLeft,
  onEdit,
}: {
  item: InventurItem;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onEdit: () => void;
}) {
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyDirection, setFlyDirection] = useState<'left' | 'right' | null>(null);

  const THRESHOLD = 80;

  const triggerSwipe = (dir: 'left' | 'right') => {
    if (flyDirection) return;
    haptic(50);
    setIsAnimating(true);
    setFlyDirection(dir);
    setTimeout(() => {
      if (dir === 'right') onSwipeRight();
      else onSwipeLeft();
    }, 280);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (flyDirection) return;
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    setIsAnimating(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || flyDirection) return;
    setDragX(e.clientX - startXRef.current);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragX > THRESHOLD) triggerSwipe('right');
    else if (dragX < -THRESHOLD) triggerSwipe('left');
    else {
      setIsAnimating(true);
      setDragX(0);
    }
  };

  const getTransform = () => {
    if (flyDirection === 'right') return 'translateX(130vw) rotate(20deg)';
    if (flyDirection === 'left') return 'translateX(-130vw) rotate(-20deg)';
    return `translateX(${dragX}px) rotate(${dragX * 0.06}deg)`;
  };

  const greenOpacity = dragX > 20 ? Math.min((dragX - 20) / 80, 1) : 0;
  const redOpacity = dragX < -20 ? Math.min((-dragX - 20) / 80, 1) : 0;

  const imageUrl = item.bild
    ? getImageUrl(item.collectionId, item.id, item.bild)
    : null;

  return (
    <div
      className={`w-full max-w-sm touch-none select-none ${
        isAnimating ? 'transition-transform duration-300 ease-out' : ''
      }`}
      style={{
        transform: getTransform(),
        cursor: flyDirection ? 'default' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className='bg-white rounded-2xl shadow-xl overflow-hidden relative'>
        {/* Swipe overlays */}
        <div
          className='absolute inset-0 bg-green-500 rounded-2xl flex items-center justify-center z-10 pointer-events-none'
          style={{ opacity: greenOpacity }}
        >
          <div className='text-white font-bold text-2xl flex flex-col items-center gap-1'>
            <Check className='w-14 h-14' strokeWidth={3} />
            <span>VORHANDEN</span>
          </div>
        </div>
        <div
          className='absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-center z-10 pointer-events-none'
          style={{ opacity: redOpacity }}
        >
          <div className='text-white font-bold text-2xl flex flex-col items-center gap-1'>
            <X className='w-14 h-14' strokeWidth={3} />
            <span>FEHLT</span>
          </div>
        </div>

        {/* Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className='w-full h-56 object-cover'
            draggable={false}
          />
        ) : (
          <div className='w-full h-56 bg-gray-100 flex items-center justify-center'>
            <Package className='w-20 h-20 text-gray-300' />
          </div>
        )}

        {/* Info */}
        <div className='p-4 space-y-2'>
          <h2 className='text-xl font-bold leading-tight'>{item.name}</h2>
          <div className='flex flex-wrap gap-1.5'>
            <Badge variant='outline'>Bestand: {item.bestand}</Badge>
            {item.organisation?.map((org) => (
              <Badge key={org} variant='secondary'>
                {org}
              </Badge>
            ))}
          </div>
          {item.Anmerkungen && (
            <p className='text-sm text-gray-500 line-clamp-2'>{item.Anmerkungen}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className='px-4 pb-4 flex gap-2'>
          <Button
            variant='outline'
            className='flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
            onClick={(e) => {
              e.stopPropagation();
              triggerSwipe('left');
            }}
          >
            <X className='w-4 h-4 mr-1' />
            Fehlt
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            className='flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700'
            onClick={(e) => {
              e.stopPropagation();
              triggerSwipe('right');
            }}
          >
            <Check className='w-4 h-4 mr-1' />
            Vorhanden
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Inventur() {
  const [phase, setPhase] = useState<Phase>('area-select');
  const [selectedArea, setSelectedArea] = useState<Area>('Jugend');
  const [kisten, setKisten] = useState<InventurKiste[]>([]);
  const [completedKistenIds, setCompletedKistenIds] = useState<Set<string>>(new Set());
  const [selectedKiste, setSelectedKiste] = useState<InventurKiste | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog state
  const [dialogStep, setDialogStep] = useState<DialogStep>(null);
  const [dialogItem, setDialogItem] = useState<InventurItem | null>(null);
  const [editBestand, setEditBestand] = useState('');
  const [editAnmerkungen, setEditAnmerkungen] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Whether closing the dialog should advance to next item
  const advanceOnCloseRef = useRef(false);

  // --------------------------------------------------
  const fetchData = async (area: Area) => {
    setIsLoading(true);
    try {
      pb.autoCancellation(false);
      let filter = '';
      if (area === 'Jugend') filter = 'organisation ~ "Jugend"';
      else if (area === 'Kinder') filter = 'organisation ~ "Kinder"';

      const items = await pb.collection('items').getFullList({
        filter,
        sort: 'name',
        expand: 'kiste',
      });

      const kistenMap = new Map<string, InventurKiste>();
      for (const item of items) {
        if (!item.kiste) continue;
        if (!kistenMap.has(item.kiste)) {
          const k = item.expand?.kiste;
          kistenMap.set(item.kiste, {
            id: item.kiste,
            name: k?.name || 'Unbekannte Kiste',
            regal: k?.regal || 0,
            stellplatz: k?.stellplatz || 0,
            items: [],
          });
        }
        kistenMap.get(item.kiste)!.items.push(item as InventurItem);
      }

      setKisten(
        Array.from(kistenMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'de')
        )
      );
    } catch (err) {
      console.error('Error fetching inventur data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAreaSelect = (area: Area) => {
    haptic(30);
    setSelectedArea(area);
    setCompletedKistenIds(new Set());
    fetchData(area);
    setPhase('box-list');
  };

  const handleKisteSelect = (kiste: InventurKiste) => {
    haptic(30);
    setSelectedKiste(kiste);
    setCurrentItemIndex(0);
    setPhase('swipe');
  };

  // Advance to next item; if last item, mark kiste as complete
  const advanceItem = (kiste = selectedKiste, index = currentItemIndex) => {
    if (!kiste) return;
    const next = index + 1;
    if (next >= kiste.items.length) {
      haptic([40, 30, 80]);
      setCompletedKistenIds((prev) => new Set([...prev, kiste.id]));
    }
    setCurrentItemIndex(next);
  };

  // Open dialog after swipe-left (card already flew away → always advance on close)
  const openChoiceDialog = (item: InventurItem) => {
    advanceOnCloseRef.current = true;
    setDialogItem(item);
    setEditBestand(item.bestand.toString());
    setEditAnmerkungen(item.Anmerkungen || '');
    setDialogStep('choice');
  };

  // Open edit dialog directly (pencil button → stay on card)
  const openEditDialog = (item: InventurItem) => {
    advanceOnCloseRef.current = false;
    setDialogItem(item);
    setEditBestand(item.bestand.toString());
    setEditAnmerkungen(item.Anmerkungen || '');
    setDialogStep('edit');
  };

  const closeDialog = () => {
    const shouldAdvance = advanceOnCloseRef.current;
    setDialogStep(null);
    setDialogItem(null);
    if (shouldAdvance) advanceItem();
  };

  const handleSaveEdit = async () => {
    if (!dialogItem) return;
    setIsSaving(true);
    try {
      const newBestand = parseInt(editBestand) || 0;
      await pb.collection('items').update(dialogItem.id, {
        bestand: newBestand,
        Anmerkungen: editAnmerkungen,
      });

      // Sync local state
      if (selectedKiste) {
        const updatedItems = selectedKiste.items.map((i) =>
          i.id === dialogItem.id
            ? { ...i, bestand: newBestand, Anmerkungen: editAnmerkungen }
            : i
        );
        const updatedKiste = { ...selectedKiste, items: updatedItems };
        setSelectedKiste(updatedKiste);
        setKisten((prev) =>
          prev.map((k) => (k.id === selectedKiste.id ? updatedKiste : k))
        );
      }

      closeDialog();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!dialogItem || !selectedKiste) return;
    setIsSaving(true);
    try {
      await pb.collection('items').delete(dialogItem.id);

      // Remove item from local state; keep currentItemIndex as-is (next item slides in)
      const updatedItems = selectedKiste.items.filter((i) => i.id !== dialogItem.id);
      const updatedKiste = { ...selectedKiste, items: updatedItems };
      setSelectedKiste(updatedKiste);
      setKisten((prev) =>
        prev.map((k) => (k.id === selectedKiste.id ? updatedKiste : k))
      );

      // If index now points past the end, the completion screen will show
      // We just close without calling advanceItem (index stays the same, array shrank)
      advanceOnCloseRef.current = false;
      // But we still need to check if we hit the end
      if (currentItemIndex >= updatedItems.length) {
        haptic([40, 30, 80]);
        setCompletedKistenIds((prev) => new Set([...prev, selectedKiste.id]));
      }
      setDialogStep(null);
      setDialogItem(null);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen');
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------
  // Phase: area-select
  // --------------------------------------------------
  if (phase === 'area-select') {
    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-md mx-auto pt-8 space-y-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold'>Inventurmodus</h1>
            <p className='text-gray-500 mt-1'>
              Für welchen Bereich soll die Inventur durchgeführt werden?
            </p>
          </div>

          <div className='space-y-3'>
            {(
              [
                { area: 'Jugend' as Area, Icon: Users, desc: 'Nur Jugend-Gegenstände' },
                { area: 'Kinder' as Area, Icon: Baby, desc: 'Nur Kinder-Gegenstände' },
                {
                  area: 'Beides' as Area,
                  Icon: Layers,
                  desc: 'Alle Gegenstände (Jugend & Kinder)',
                },
              ] as const
            ).map(({ area, Icon, desc }) => (
              <button
                key={area}
                onClick={() => handleAreaSelect(area)}
                className='w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left flex items-center gap-4 shadow-sm active:scale-[0.98]'
              >
                <div className='p-3 bg-gray-100 rounded-xl'>
                  <Icon className='w-6 h-6' />
                </div>
                <div>
                  <div className='font-semibold'>{area}</div>
                  <div className='text-sm text-gray-500'>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Phase: box-list
  // --------------------------------------------------
  if (phase === 'box-list') {
    const doneCount = kisten.filter((k) => completedKistenIds.has(k.id)).length;
    const allDone = kisten.length > 0 && doneCount === kisten.length;

    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-md mx-auto space-y-4'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => { haptic(20); setPhase('area-select'); }}
            >
              <ChevronLeft className='w-5 h-5' />
            </Button>
            <div>
              <h1 className='text-xl font-bold'>Inventur – {selectedArea}</h1>
              <p className='text-sm text-gray-500'>
                {doneCount} / {kisten.length} Kisten abgeschlossen
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className='text-center py-12 text-gray-400'>Lade Kisten...</div>
          ) : kisten.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              Keine Kisten mit Gegenständen gefunden.
            </div>
          ) : (
            <div className='space-y-2'>
              {kisten.map((kiste) => {
                const done = completedKistenIds.has(kiste.id);
                const hasLocation = kiste.regal > 0 || kiste.stellplatz > 0;
                return (
                  <button
                    key={kiste.id}
                    onClick={() => handleKisteSelect(kiste)}
                    className={`w-full p-4 bg-white border-2 rounded-xl text-left flex items-center gap-3 shadow-sm transition-all active:scale-[0.98] ${
                      done
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className='w-6 h-6 text-green-500 shrink-0' />
                    ) : (
                      <div className='w-6 h-6 rounded-full border-2 border-gray-300 shrink-0' />
                    )}
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium truncate'>{kiste.name}</div>
                      <div className='text-xs text-gray-500'>
                        {hasLocation &&
                          `Regal ${kiste.regal}, Stellplatz ${kiste.stellplatz} · `}
                        {kiste.items.length}{' '}
                        {kiste.items.length === 1 ? 'Gegenstand' : 'Gegenstände'}
                      </div>
                    </div>
                    {done && (
                      <Badge className='bg-green-100 text-green-700 border border-green-200 shrink-0'>
                        Fertig
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {allDone && (
            <div className='bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1'>
              <CheckCircle2 className='w-8 h-8 text-green-500 mx-auto' />
              <p className='font-semibold text-green-700'>Inventur abgeschlossen!</p>
              <p className='text-sm text-green-600'>Alle Kisten wurden überprüft.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Phase: swipe
  // --------------------------------------------------
  if (!selectedKiste) return null;

  const isComplete = currentItemIndex >= selectedKiste.items.length;
  const progress = (currentItemIndex / selectedKiste.items.length) * 100;

  if (isComplete) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
        <div className='max-w-sm w-full text-center space-y-6'>
          <div className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
            <CheckCircle2 className='w-14 h-14 text-green-500' />
          </div>
          <div>
            <h2 className='text-2xl font-bold'>Kiste abgeschlossen!</h2>
            <p className='text-gray-500 mt-1'>
              {selectedKiste.name} wurde vollständig inventarisiert.
            </p>
          </div>
          <Button
            className='w-full'
            size='lg'
            onClick={() => { haptic(20); setPhase('box-list'); }}
          >
            Zur Kistenliste
          </Button>
        </div>
      </div>
    );
  }

  const currentItem = selectedKiste.items[currentItemIndex];

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Header */}
      <div className='p-4 pb-2 flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => { haptic(20); setPhase('box-list'); }}
        >
          <ChevronLeft className='w-5 h-5' />
        </Button>
        <div className='flex-1 min-w-0'>
          <div className='font-semibold truncate'>{selectedKiste.name}</div>
          <div className='text-xs text-gray-500'>
            {currentItemIndex + 1} / {selectedKiste.items.length} Gegenstände
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className='px-4 pb-2'>
        <div className='h-1.5 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-blue-500 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Hints */}
      <div className='flex justify-between px-6 pb-3 text-xs text-gray-400 select-none'>
        <span>← Fehlt</span>
        <span>Vorhanden →</span>
      </div>

      {/* Card */}
      <div className='flex-1 flex items-start justify-center px-4 overflow-hidden'>
        <SwipeCard
          key={currentItem.id}
          item={currentItem}
          onSwipeRight={() => advanceItem()}
          onSwipeLeft={() => openChoiceDialog(currentItem)}
          onEdit={() => openEditDialog(currentItem)}
        />
      </div>

      {/* ---- Dialogs ---- */}

      {/* Choice: Menge anpassen vs. Löschen */}
      <Dialog open={dialogStep === 'choice'}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Was möchtest du tun?</DialogTitle>
            <DialogDescription>
              <span className='font-medium text-foreground'>{dialogItem?.name}</span> fehlt
              oder hat ein Problem.
            </DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-3 py-2'>
            <button
              onClick={() => setDialogStep('edit')}
              className='flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all'
            >
              <SlidersHorizontal className='w-7 h-7 text-blue-600' />
              <span className='text-sm font-medium'>Menge anpassen</span>
            </button>
            <button
              onClick={() => setDialogStep('delete')}
              className='flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all'
            >
              <Trash2 className='w-7 h-7 text-red-600' />
              <span className='text-sm font-medium text-red-600'>Löschen</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant='outline' className='w-full' onClick={closeDialog}>
              Überspringen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit: Menge / Anmerkungen */}
      <Dialog open={dialogStep === 'edit'}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{dialogItem?.name} bearbeiten</DialogTitle>
            <DialogDescription>Bestand und Anmerkungen anpassen.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div>
              <Label htmlFor='inv-bestand'>Bestand</Label>
              <Input
                id='inv-bestand'
                type='number'
                min='0'
                value={editBestand}
                onChange={(e) => setEditBestand(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='inv-anm'>Anmerkungen</Label>
              <Input
                id='inv-anm'
                value={editAnmerkungen}
                onChange={(e) => setEditAnmerkungen(e.target.value)}
                placeholder='Notizen zum Gegenstand'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={closeDialog}
              disabled={isSaving}
            >
              {advanceOnCloseRef.current ? 'Überspringen' : 'Abbrechen'}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={dialogStep === 'delete'}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Gegenstand löschen</DialogTitle>
            <DialogDescription>
              Soll{' '}
              <span className='font-medium text-foreground'>"{dialogItem?.name}"</span>{' '}
              dauerhaft gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialogStep('choice')}
              disabled={isSaving}
            >
              Zurück
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteItem}
              disabled={isSaving}
            >
              {isSaving ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
