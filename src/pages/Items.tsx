import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { pb } from "@/lib/pocketbase";
import { IconSearch } from "@tabler/icons-react";
import { type RecordModel } from "pocketbase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


export default function Items() {
  const { logout } = useAuth();

  const [items, setItems] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        sort: 'name',
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
  console.log(items)

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Dashboard</h1>
          <div className='space-x-4'>
            <Link to='/'>
              <Button variant='outline'>Home</Button>
            </Link>
            <Button onClick={logout} variant='destructive'>
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Search Card */}
        <Card>
          <CardContent>
            <form onSubmit={handleSearch} className='flex gap-2'>
              <Input
                placeholder='Gegenstände suchen...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type='submit' disabled={isLoading}>
                <IconSearch />
              </Button>
            </form>
          </CardContent>
        </Card>
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
          <div className='grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            {items.map((item) => (
              <Card key={item.id}>
                {/* Item Image */}
                {item.bild && (
                  <div className='relative w-full h-48 overflow-hidden rounded-t-lg'>
                    {/* <img
                      src={pb.files.getUrl(item, item.bild)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    /> */}
                  </div>
                )}

                <CardHeader className='pb-3'>
                  <div className='flex justify-between items-start gap-2'>
                    <CardTitle className='text-lg font-bold text-gray-900 leading-tight'>
                      {item.name}
                    </CardTitle>
                    <Badge
                      variant={item.bestand > 0 ? "default" : "secondary"}
                      className='shrink-0'
                    >
                      {item.bestand} Stk.
                    </Badge>
                  </div>

                  {/* Organisation Badges */}
                  {item.organisation && item.organisation.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-2'>
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
                  )}
                </CardHeader>

                <CardContent className='pt-0 space-y-3'>
                  {/* Description */}
                  {item.Anmerkungen && (
                    <div>
                      <span className='text-sm text-muted-foreground font-bold'>
                        Anmerkungen:
                      </span>
                      <p className='text-sm text-muted-foreground line-clamp-3'>
                        {item.Anmerkungen}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
