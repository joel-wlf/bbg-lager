import { useState, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  [key: string]: any; // Allow additional PocketBase fields
}

interface ItemMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ItemMultiSelect({
  value,
  onChange,
  placeholder = "Items auswählen...",
  className,
}: ItemMultiSelectProps) {
  const [open, setOpen] = useState(false);
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
        filter: "bestand > 0" // Only show items with stock
      });
      setItems(resultList as unknown as ItemOption[]);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.organisation?.some(org => org.toLowerCase().includes(term)) ||
      item.expand?.kiste?.name.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Get selected items data
  const selectedItems = useMemo(() => {
    return items.filter(item => value.includes(item.id));
  }, [items, value]);

  const handleSelect = (itemId: string) => {
    if (value.includes(itemId)) {
      onChange(value.filter(id => id !== itemId));
    } else {
      onChange([...value, itemId]);
    }
  };

  const handleRemove = (itemId: string) => {
    onChange(value.filter(id => id !== itemId));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="max-w-32 truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedItems.length > 3 && (
            <Badge variant="outline">
              +{selectedItems.length - 3} weitere
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs"
          >
            Alle entfernen
          </Button>
        </div>
      )}

      {/* Dropdown trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedItems.length === 0
                ? placeholder
                : `${selectedItems.length} Item(s) ausgewählt`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
          <div className="flex flex-col max-h-80">
            {/* Search input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Items suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Lade Items...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm ? "Keine Items gefunden" : "Keine Items verfügbar"}
                </div>
              ) : (
                <div className="p-1">
                  {filteredItems.slice(0, 100).map((item) => { // Limit to 100 for performance
                    const isSelected = value.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => handleSelect(item.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{item.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {item.bestand} Stk.
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.organisation && (
                              <Badge variant="outline" className="text-xs">
                                {item.organisation.slice(0, 2).join(", ")}
                                {item.organisation.length > 2 && " +"}
                              </Badge>
                            )}
                            {item.expand?.kiste && (
                              <span className="text-xs text-gray-500">
                                {item.expand.kiste.name} (R{item.expand.kiste.regal}S{item.expand.kiste.stellplatz})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredItems.length > 100 && (
                    <div className="p-2 text-center text-xs text-gray-500 border-t">
                      {filteredItems.length - 100} weitere Items... Bitte verfeinern Sie Ihre Suche.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with selection info */}
            {selectedItems.length > 0 && (
              <div className="border-t p-2 bg-gray-50">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{selectedItems.length} Item(s) ausgewählt</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-6 px-2 text-xs"
                  >
                    Alle entfernen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}