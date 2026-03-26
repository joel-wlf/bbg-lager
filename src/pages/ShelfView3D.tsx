import { useEffect, useState } from "react";
import { pb, getImageUrl } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Box, Package, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Shelf layout: 4 floors (Etagen), 8 columns (2 sections of 4)
const ETAGEN = 4;
const TOTAL_COLS = 8;

// stellplatz → etage index (0 = bottom)
function getEtage(stellplatz: number): number {
  return Math.floor(stellplatz / 10);
}

// stellplatz → column index (0–7)
function getCol(stellplatz: number): number {
  return (stellplatz % 10) - 1;
}

// etage + col → stellplatz number (matches image numbering)
function toStellplatz(etage: number, col: number): number {
  return etage * 10 + (col + 1);
}

function isValidStellplatz(stellplatz: number): boolean {
  const etage = getEtage(stellplatz);
  const col = getCol(stellplatz);
  return etage >= 0 && etage < ETAGEN && col >= 0 && col < TOTAL_COLS;
}

interface ItemData {
  id: string;
  name: string;
  bestand: number;
  organisation: string[];
  Anmerkungen: string;
  bild: string;
  collectionId: string;
  collectionName: string;
}

interface KisteData {
  id: string;
  name: string;
  regal: number;
  stellplatz: number;
  items: ItemData[];
}

type ViewState = "overview" | "shelf" | "kiste";

// Build a 4×8 grid of kisten for a given shelf's kisten array
function buildShelfGrid(kisten: KisteData[]): (KisteData | null)[][] {
  const grid: (KisteData | null)[][] = Array.from({ length: ETAGEN }, () =>
    Array(TOTAL_COLS).fill(null)
  );
  for (const k of kisten) {
    if (k.stellplatz > 0 && isValidStellplatz(k.stellplatz)) {
      const etage = getEtage(k.stellplatz);
      const col = getCol(k.stellplatz);
      grid[etage][col] = k;
    }
  }
  return grid;
}

// Mini shelf preview for overview cards: renders a small visual
function MiniShelfPreview({ kisten }: { kisten: KisteData[] }) {
  const grid = buildShelfGrid(kisten);
  return (
    <div
      className="w-full rounded border-2 border-gray-700 overflow-hidden"
      style={{
        transform: "perspective(300px) rotateX(12deg)",
        transformOrigin: "bottom center",
      }}
    >
      {[ETAGEN - 1, ETAGEN - 2, 1, 0].map((etage) => (
        <div
          key={etage}
          className={`flex ${etage > 0 ? "border-b border-gray-500" : ""}`}
        >
          {/* Left section */}
          <div className="flex flex-1 border-r-2 border-gray-600">
            {[0, 1, 2, 3].map((col) => {
              const occupied = grid[etage][col] !== null;
              return (
                <div
                  key={col}
                  className={`flex-1 h-4 ${occupied ? "bg-blue-400" : "bg-amber-50"} ${col < 3 ? "border-r border-dashed border-gray-300" : ""}`}
                />
              );
            })}
          </div>
          {/* Right section */}
          <div className="flex flex-1">
            {[4, 5, 6, 7].map((col) => {
              const occupied = grid[etage][col] !== null;
              return (
                <div
                  key={col}
                  className={`flex-1 h-4 ${occupied ? "bg-blue-400" : "bg-amber-50"} ${col < 7 ? "border-r border-dashed border-gray-300" : ""}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShelfView3D() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("overview");
  const [allKisten, setAllKisten] = useState<KisteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegal, setSelectedRegal] = useState<number | null>(null);
  const [selectedKiste, setSelectedKiste] = useState<KisteData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      pb.autoCancellation(false);

      const [kistenResult, itemsResult] = await Promise.all([
        pb.collection("kisten").getFullList({ sort: "regal,stellplatz" }),
        pb.collection("items").getFullList({ sort: "name" }),
      ]);

      // Map kiste id → KisteData
      const kisteMap = new Map<string, KisteData>();
      for (const k of kistenResult) {
        kisteMap.set(k.id, {
          id: k.id,
          name: k.name,
          regal: k.regal ?? 0,
          stellplatz: k.stellplatz ?? 0,
          items: [],
        });
      }

      // Attach items to kisten
      for (const item of itemsResult) {
        if (item.kiste && kisteMap.has(item.kiste)) {
          kisteMap.get(item.kiste)!.items.push({
            id: item.id,
            name: item.name,
            bestand: item.bestand ?? 0,
            organisation: item.organisation ?? [],
            Anmerkungen: item.Anmerkungen ?? "",
            bild: item.bild ?? "",
            collectionId: item.collectionId,
            collectionName: item.collectionName,
          });
        }
      }

      setAllKisten(Array.from(kisteMap.values()));
    } catch (error) {
      console.error("Error fetching shelf data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group kisten by regal number
  const regalGroups = (): { regal: number; kisten: KisteData[] }[] => {
    const map = new Map<number, KisteData[]>();
    for (const k of allKisten) {
      if (k.regal > 0) {
        if (!map.has(k.regal)) map.set(k.regal, []);
        map.get(k.regal)!.push(k);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([regal, kisten]) => ({ regal, kisten }));
  };

  const currentShelfKisten =
    selectedRegal !== null
      ? allKisten.filter((k) => k.regal === selectedRegal)
      : [];

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Lade Regale…</div>
      </div>
    );
  }

  // ── Overview: all Regale ─────────────────────────────────────────────
  if (view === "overview") {
    const shelves = regalGroups();
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/items")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Regalansicht</h1>
          </div>

          {shelves.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Keine Regale gefunden.</p>
              <p className="text-sm mt-1">
                Weise Kisten eine Regalnummer zu, um sie hier zu sehen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {shelves.map(({ regal, kisten }) => (
                <button
                  key={regal}
                  onClick={() => {
                    setSelectedRegal(regal);
                    setView("shelf");
                  }}
                  className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150 text-left p-4 flex flex-col gap-3"
                >
                  <MiniShelfPreview kisten={kisten} />
                  <div>
                    <div className="font-bold text-base">Regal {regal}</div>
                    <div className="text-sm text-gray-500">
                      {kisten.length}{" "}
                      {kisten.length === 1 ? "Kiste" : "Kisten"}
                    </div>
                  </div>
                  <ChevronRight className="absolute top-4 right-3 w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Shelf detail: 4×8 grid ───────────────────────────────────────────
  if (view === "shelf" && selectedRegal !== null) {
    const grid = buildShelfGrid(currentShelfKisten);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedRegal(null);
                setView("overview");
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Regal {selectedRegal}</h1>
          </div>

          {/* Shelf grid — renders top-to-bottom as Etage 4→1 */}
          <div className="bg-white rounded-xl border-[3px] border-gray-800 overflow-hidden shadow-lg">
            {Array.from({ length: ETAGEN }, (_, i) => ETAGEN - 1 - i).map(
              (etage) => (
                <div
                  key={etage}
                  className={`flex ${etage > 0 ? "border-b-[3px] border-gray-800" : ""}`}
                >
                  {/* Left section (cols 0–3) */}
                  <div className="flex flex-1 border-r-[3px] border-gray-800">
                    {[0, 1, 2, 3].map((col) => {
                      const kiste = grid[etage][col];
                      const sp = toStellplatz(etage, col);
                      return (
                        <button
                          key={col}
                          disabled={!kiste}
                          onClick={() => {
                            if (kiste) {
                              setSelectedKiste(kiste);
                              setView("kiste");
                            }
                          }}
                          className={[
                            "flex-1 min-h-[64px] sm:min-h-[80px] flex flex-col items-center justify-center p-1 text-center transition-colors",
                            col < 3
                              ? "border-r border-dashed border-gray-400"
                              : "",
                            kiste
                              ? "bg-blue-50 hover:bg-blue-100 active:bg-blue-200 cursor-pointer"
                              : "cursor-default",
                          ].join(" ")}
                        >
                          {kiste ? (
                            <>
                              <Box className="w-4 h-4 text-blue-500 mb-0.5 shrink-0" />
                              <span className="text-[10px] sm:text-xs font-semibold text-blue-700 leading-tight line-clamp-2 break-words w-full text-center">
                                {kiste.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-300 select-none">
                              {sp}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right section (cols 4–7) */}
                  <div className="flex flex-1">
                    {[4, 5, 6, 7].map((col) => {
                      const kiste = grid[etage][col];
                      const sp = toStellplatz(etage, col);
                      return (
                        <button
                          key={col}
                          disabled={!kiste}
                          onClick={() => {
                            if (kiste) {
                              setSelectedKiste(kiste);
                              setView("kiste");
                            }
                          }}
                          className={[
                            "flex-1 min-h-[64px] sm:min-h-[80px] flex flex-col items-center justify-center p-1 text-center transition-colors",
                            col < 7
                              ? "border-r border-dashed border-gray-400"
                              : "",
                            kiste
                              ? "bg-blue-50 hover:bg-blue-100 active:bg-blue-200 cursor-pointer"
                              : "cursor-default",
                          ].join(" ")}
                        >
                          {kiste ? (
                            <>
                              <Box className="w-4 h-4 text-blue-500 mb-0.5 shrink-0" />
                              <span className="text-[10px] sm:text-xs font-semibold text-blue-700 leading-tight line-clamp-2 break-words w-full text-center">
                                {kiste.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-300 select-none">
                              {sp}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>

          <p className="mt-3 text-xs text-gray-400 text-center">
            Belegte Fächer antippen zum Öffnen
          </p>
        </div>
      </div>
    );
  }

  // ── Kiste detail: items list ─────────────────────────────────────────
  if (view === "kiste" && selectedKiste) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedKiste(null);
                setView("shelf");
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{selectedKiste.name}</h1>
              <p className="text-xs text-gray-500">
                Regal {selectedKiste.regal} · Stellplatz{" "}
                {selectedKiste.stellplatz}
              </p>
            </div>
          </div>

          {selectedKiste.items.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Keine Gegenstände in dieser Kiste.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedKiste.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4"
                >
                  {item.bild ? (
                    <img
                      src={getImageUrl(
                        item.collectionName,
                        item.id,
                        item.bild,
                        true
                      )}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.bestand} Stk.
                    </div>
                    {item.organisation && item.organisation.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.organisation.map((org: string) => (
                          <Badge
                            key={org}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {org}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.Anmerkungen && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {item.Anmerkungen}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
