import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl, pb } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ItemsHeader from "@/components/ItemsHeader";

export default function Items() {

  const [items, setItems] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (search = "") => {
    setIsLoading(true);
    try {
      pb.autoCancellation(false);

      let filter = "";
      if (search.trim()) {
        filter = `name ~ "${search}"`;
      }

      const resultList = await pb.collection("items").getFullList({
        filter: filter,
        sort: "name",
        expand: "gruppe",
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
    fetchItems(searchTerm);
  };
  console.log(items);

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Search Header */}
        <ItemsHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
        {/* Items Results */}
        {isLoading ? (
          <Card>
            <CardContent className='flex items-center justify-center py-8'>
              <p className='text-gray-500'>Lade Gegenstände...</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className='flex items-center justify-center py-8'>
              <p className='text-gray-500'>
                {searchTerm
                  ? "Keine Gegenstände gefunden."
                  : "Keine Gegenstände verfügbar."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Bestand</TableHead>
                    <TableHead>Bild</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Gruppe</TableHead>
                    <TableHead>Anmerkungen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell>{item.bestand} Stk.</TableCell>
                      <TableCell>
                        {item.bild ? (
                          <img
                            src={getImageUrl("items", item.id, item.bild, true)}
                            onClick={() => {
                              setSelectedImage(
                                getImageUrl("items", item.id, item.bild)
                              );
                              setIsImageModalOpen(true);
                            }}
                            alt={item.name}
                            className='w-8 h-8 object-cover rounded cursor-pointer'
                          />
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.organisation && item.organisation.length > 0 ? (
                          <div className='flex flex-wrap gap-1'>
                            {item.organisation.map((org, index) => (
                              <Badge
                                key={index}
                                variant='outline'
                                className='text-xs'
                              >
                                {org}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.gruppe ? (
                          <div className='flex flex-wrap gap-1'>
                            <Badge variant='outline' className='text-xs'>
                              {item.expand.gruppe.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.Anmerkungen ? (
                          <span className='text-sm line-clamp-2 max-w-xs'>
                            {item.Anmerkungen}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
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
