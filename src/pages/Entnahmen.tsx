import { useAuth } from "@/contexts/AuthContext";
import { pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchHeader from "@/components/SearchHeader";
import { EntnahmenCards } from "@/components/EntnahmenCards";
import { EntnahmenDialog } from "@/components/EntnahmenDialog";
import { useDebounce } from "@/hooks/useDebounce";

export default function Entnahmen() {
  const { user } = useAuth();

  const [entnahmen, setEntnahmen] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntnahme, setSelectedEntnahme] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-6xl mx-auto space-y-6'>
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
        />
      </div>

      {/* Entnahme Details Dialog */}
      <EntnahmenDialog
        entnahme={selectedEntnahme}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}