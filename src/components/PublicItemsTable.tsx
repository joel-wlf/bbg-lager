import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getImageUrl } from "@/lib/pocketbase";
import { Button } from "./ui/button";
import { AnfrageDialog } from "./AnfrageDialog";
import { useState } from "react";
import { MessageSquare } from "lucide-react";

interface PublicItemsTableProps {
  items: any[];
  isLoading: boolean;
  searchTerm: string;
  onImageClick: (imageUrl: string) => void;
}

export function PublicItemsTable({
  items,
  isLoading,
  searchTerm,
  onImageClick,
}: PublicItemsTableProps) {
  const [isAnfrageDialogOpen, setIsAnfrageDialogOpen] = useState(false);

  const handleAnfrageSuccess = () => {
    // Could add additional success handling here if needed
    console.log("Anfrage successfully created");
  };

  return (
    <>
      <Card>
        <div className="p-4 pt-0 border-b">
          <Button 
            className='w-full flex items-center gap-2' 
            size="lg"
            onClick={() => setIsAnfrageDialogOpen(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Gegenstände anfragen
          </Button>
        </div>
      <CardContent className='p-0'>
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bestand</TableHead>
                <TableHead>Bild</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Anmerkungen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : items.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-gray-500'>
              {searchTerm
                ? "Keine Gegenstände gefunden."
                : "Keine Gegenstände verfügbar."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bestand</TableHead>
                <TableHead>Bild</TableHead>
                <TableHead>Organisation</TableHead>
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
                          onImageClick(
                            getImageUrl("items", item.id, item.bild)
                          );
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
                        {item.organisation.map((org: string, index: number) => (
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
        )}
      </CardContent>
      </Card>

      {/* Anfrage Dialog */}
      <AnfrageDialog
        isOpen={isAnfrageDialogOpen}
        onClose={() => setIsAnfrageDialogOpen(false)}
        onSuccess={handleAnfrageSuccess}
      />
    </>
  );
}
