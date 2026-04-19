import { useState, useEffect, useMemo } from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { pb } from "@/lib/pocketbase";

interface ItemOption {
  id: string;
  name: string;
  bestand: number;
  organisation?: string[];
  expand?: {
    kiste?: {
      name: string;
      regal: number;
      stellplatz: number;
    };
  };
  [key: string]: any;
}

interface ItemMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabledItemIds?: Set<string>;
}

export function ItemMultiSelect({
  value,
  onChange,
  placeholder = "Gegenstände suchen...",
  className,
  disabledItemIds,
}: ItemMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<ItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const resultList = await pb.collection("items").getFullList({
        sort: "name",
        expand: "kiste",
        filter: "bestand > 0",
      });
      setItems(resultList as unknown as ItemOption[]);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.organisation?.some((org) => org.toLowerCase().includes(term)) ||
        item.expand?.kiste?.name.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const handleSelect = (itemId: string) => {
    if (value.includes(itemId)) {
      onChange(value.filter((id) => id !== itemId));
    } else {
      onChange([...value, itemId]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Count + clear */}
      {value.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{value.length} ausgewählt</span>
          <button
            type="button"
            className="text-xs underline hover:text-foreground"
            onClick={() => onChange([])}
          >
            Alle entfernen
          </button>
        </div>
      )}

      {/* Inline scrollable list */}
      <div
        className="border rounded-md overflow-y-auto bg-background"
        style={{ maxHeight: "45vh", WebkitOverflowScrolling: "touch" }}
      >
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Lade Gegenstände...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchTerm ? "Keine Gegenstände gefunden" : "Keine Gegenstände verfügbar"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredItems.map((item) => {
              const isSelected = value.includes(item.id);
              const isDisabled = disabledItemIds?.has(item.id) ?? false;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !isDisabled && handleSelect(item.id)}
                  disabled={isDisabled}
                  title={isDisabled ? "Bereits gebucht in diesem Zeitraum" : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
                    "hover:bg-accent active:bg-accent/70 touch-manipulation",
                    isSelected && "bg-accent",
                    isDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={cn(
                      "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{item.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.bestand} Stk.
                      </span>
                    </div>
                    {(item.expand?.kiste || item.organisation?.length) && (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.expand?.kiste && (
                          <span className="text-xs text-muted-foreground">
                            {item.expand.kiste.name} · R{item.expand.kiste.regal}S
                            {item.expand.kiste.stellplatz}
                          </span>
                        )}
                        {item.organisation && item.organisation.length > 0 && (
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {item.organisation.slice(0, 2).join(", ")}
                            {item.organisation.length > 2 && " +"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
