import { AnfragenCards } from "@/components/AnfragenCards";
import { AnfragenDialog } from "@/components/AnfragenDialog";
import { pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";

export default function Anfragen() {
  const [anfragen, setAnfragen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnfrage, setSelectedAnfrage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeEntnahmenItemIds, setActiveEntnahmenItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnfragen();
    fetchActiveEntnahmenItems();
  }, []);

  const fetchAnfragen = async () => {
    setIsLoading(true);
    try {
      const resultList = await pb.collection("anfragen").getFullList({
        sort: "-created",
        expand: "items",
      });
      setAnfragen(resultList);
    } catch (error) {
      console.error("Error fetching anfragen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveEntnahmenItems = async () => {
    try {
      pb.autoCancellation(false);
      const result = await pb.collection("entnahmen").getFullList({
        fields: "id,rein,items",
      });
      const ids = new Set<string>();
      for (const e of result) {
        if (!e.rein) {
          for (const itemId of e.items || []) ids.add(itemId);
        }
      }
      setActiveEntnahmenItemIds(ids);
    } catch (error) {
      console.error("Error fetching active entnahmen:", error);
    }
  };

  const handleOpenDialog = (anfrage: any) => {
    setSelectedAnfrage(anfrage);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAnfrage(null);
  };

  const handleEntnahmeCreated = () => {
    fetchAnfragen();
    fetchActiveEntnahmenItems();
    handleCloseDialog();
  };

  // Compute conflicts: anfrage items that are currently in an active Entnahme
  const conflictsMap: Record<string, string[]> = {};
  for (const anfrage of anfragen) {
    const names: string[] = [];
    for (const item of anfrage.expand?.items || []) {
      if (activeEntnahmenItemIds.has(item.id)) names.push(item.name);
    }
    if (names.length > 0) conflictsMap[anfrage.id] = names;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>

        <AnfragenCards
          anfragen={anfragen}
          isLoading={isLoading}
          onOpenDialog={handleOpenDialog}
          conflictsMap={conflictsMap}
        />

        {selectedAnfrage && (
          <AnfragenDialog
            isOpen={isDialogOpen}
            onClose={handleCloseDialog}
            anfrage={selectedAnfrage}
            onEntnahmeCreated={handleEntnahmeCreated}
          />
        )}
      </div>
    </div>
  );
}