import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchHeader from "@/components/SearchHeader";
import { useDebounce } from "@/hooks/useDebounce";
import { PublicItemsTable } from "@/components/PublicItemsTable";
import { ArrowLeft } from "lucide-react";

export default function PublicItems() {
  const [items, setItems] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [organisationFilter, setOrganisationFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [futureBookings, setFutureBookings] = useState<Map<string, { raus: string; rein_erwartet: string }[]>>(new Map());

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchFutureBookings();
  }, []);

  useEffect(() => {
    fetchItems(debouncedSearchTerm, organisationFilter);
  }, [debouncedSearchTerm, organisationFilter]);

  const fetchFutureBookings = async () => {
    try {
      pb.autoCancellation(false);
      const today = new Date().toISOString().split("T")[0];
      const result = await pb.collection("entnahmen").getFullList({
        filter: `rein = "" && rein_erwartet >= "${today}"`,
        fields: "id,items,raus,rein_erwartet",
      });
      const map = new Map<string, { raus: string; rein_erwartet: string }[]>();
      for (const e of result) {
        for (const itemId of e.items || []) {
          if (!map.has(itemId)) map.set(itemId, []);
          map.get(itemId)!.push({ raus: e.raus, rein_erwartet: e.rein_erwartet });
        }
      }
      setFutureBookings(map);
    } catch (error) {
      console.error("Error fetching future bookings:", error);
    }
  };

  const fetchItems = async (search = "", orgFilter: string | null = null) => {
    setIsLoading(true);
    try {
      pb.autoCancellation(false);

      const filters: string[] = [];
      if (search.trim()) {
        filters.push(`name ~ "${search}"`);
      }
      if (orgFilter) {
        filters.push(`organisation ~ "${orgFilter}"`);
      }
      const filter = filters.join(" && ");

      const resultList = await pb.collection("items").getFullList({
        filter: filter,
        sort: "name",
        expand: "kiste",
      });
      setItems(resultList);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(searchTerm, organisationFilter);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <div className='pt-6'>
          <div className='flex items-center justify-between mb-4'>
            <Link to='/'>
              <Button variant='outline' className='flex items-center gap-2'>
                <ArrowLeft className='w-4 h-4' />
                Zurück zum Login
              </Button>
            </Link>
          </div>
          <div className='text-left'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              K/J Lager - Inventar
            </h1>
            <p className='text-gray-600'>
              Durchsuche unsere verfügbaren Gegenstände
            </p>
          </div>
        </div>

        <SearchHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder='Gegenstände suchen...'
        />

        <PublicItemsTable
          items={items}
          isLoading={isLoading}
          searchTerm={searchTerm}
          organisationFilter={organisationFilter}
          onOrganisationFilterChange={setOrganisationFilter}
          onImageClick={handleImageClick}
          futureBookings={futureBookings}
          onBookingCreated={fetchFutureBookings}
        />
      </div>

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
