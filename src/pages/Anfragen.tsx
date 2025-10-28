import { AnfragenCards } from "@/components/AnfragenCards";
import { AnfragenDialog } from "@/components/AnfragenDialog";
import { pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";

export default function Anfragen() {
  const [anfragen, setAnfragen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnfrage, setSelectedAnfrage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAnfragen();
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

  const handleOpenDialog = (anfrage: any) => {
    setSelectedAnfrage(anfrage);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAnfrage(null);
  };

  const handleEntnahmeCreated = () => {
    // Refresh the anfragen list after creating an entnahme
    fetchAnfragen();
    handleCloseDialog();
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        
        <AnfragenCards
          anfragen={anfragen}
          isLoading={isLoading}
          onOpenDialog={handleOpenDialog}
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