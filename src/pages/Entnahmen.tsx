import { useAuth } from "@/contexts/AuthContext";
import { pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchHeader from "@/components/SearchHeader";
import { EntnahmenCards } from "@/components/EntnahmenCards";
import { EntnahmenDialog } from "@/components/EntnahmenDialog";
import { EntnahmenHeader } from "@/components/EntnahmenHeader";
import { EntnahmenCrudDialog } from "@/components/EntnahmenCrudDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Entnahmen() {
  const { user } = useAuth();

  const [entnahmen, setEntnahmen] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntnahme, setSelectedEntnahme] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // CRUD Dialog state
  const [isCrudDialogOpen, setIsCrudDialogOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'return'>('create');
  const [crudEntnahme, setCrudEntnahme] = useState<any>(null);
  
  // Image Modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Debounce search term with 300ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchEntnahmen();
  }, []);

  // Trigger search when debounced search term changes
  useEffect(() => {
    fetchEntnahmen(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const fetchEntnahmen = async (search = "") => {
    pb.autoCancellation(false)
    setIsLoading(true);
    try {
      let filter = "";
      if (search.trim()) {
        filter = `zweck ~ "${search}" || user.name ~ "${search}"`;
      }

      const resultList = await pb.collection("entnahmen").getList(1, 50, {
        filter,
        sort: "-created",
        expand: "user,items,items.kiste"
      });


      setEntnahmen(resultList.items);
    } catch (error) {
      console.error("Error fetching entnahmen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntnahmen(searchTerm);
  };

  const handleCardClick = (entnahme: any) => {
    setSelectedEntnahme(entnahme);
    setIsDialogOpen(true);
  };

  const handleCreateEntnahme = () => {
    setCrudMode('create');
    setCrudEntnahme(null);
    setIsCrudDialogOpen(true);
  };

  const handleReturnEntnahme = (entnahme: any) => {
    setCrudMode('return');
    setCrudEntnahme(entnahme);
    setIsCrudDialogOpen(true);
  };

  const handleCrudSuccess = () => {
    fetchEntnahmen(searchTerm);
  };

  // Handle image modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Nicht angemeldet
          </h1>
          <p className="text-gray-600 mb-6">
            Sie müssen sich anmelden, um Entnahmen zu verwalten.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 px-4'>
      <div className='max-w-6xl mx-auto space-y-4'>
        {/* Header with Create Button */}
        <EntnahmenHeader onCreateEntnahme={handleCreateEntnahme} />
        
        {/* Search Header */}
        <SearchHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Entnahmen suchen..."
        />
        
        {/* Entnahmen Cards */}
        <EntnahmenCards
          entnahmen={entnahmen}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onCardClick={handleCardClick}
          onReturnEntnahme={handleReturnEntnahme}
          onImageClick={handleImageClick}
        />
      </div>

      {/* Entnahme Details Dialog */}
      <EntnahmenDialog
        entnahme={selectedEntnahme}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onImageClick={handleImageClick}
      />

      {/* CRUD Dialog */}
      <EntnahmenCrudDialog
        isOpen={isCrudDialogOpen}
        onClose={() => setIsCrudDialogOpen(false)}
        mode={crudMode}
        entnahme={crudEntnahme}
        onSuccess={handleCrudSuccess}
      />

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className='p-3'>
          {selectedImage && (
            <img
              src={selectedImage}
              alt='Item'
              className='max-w-full max-h-full '
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}