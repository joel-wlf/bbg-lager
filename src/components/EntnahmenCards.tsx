import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Package, Clock, ArrowLeft, Eye, AlertTriangle } from "lucide-react";
import { getImageUrl, pb } from "@/lib/pocketbase";

interface EntnahmenCardsProps {
  entnahmen: any[];
  isLoading: boolean;
  searchTerm: string;
  onCardClick: (entnahme: any) => void;
  onReturnEntnahme: (entnahme: any) => void;
  onImageClick: (imageUrl: string) => void;
}

export function EntnahmenCards({
  entnahmen,
  isLoading,
  searchTerm,
  onCardClick,
  onReturnEntnahme,
  onImageClick,
}: EntnahmenCardsProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (entnahme: any) => {
    if (entnahme.rein) {
      return <Badge variant="default" className="bg-green-500">Zurückgegeben</Badge>;
    } else {
      return <Badge variant="secondary">Ausstehend</Badge>;
    }
  };

  const hasProblems = (entnahme: any) => {
    if (!entnahme.problems) return false;
    
    // Check if problems is already an array (from database)
    if (Array.isArray(entnahme.problems)) {
      return entnahme.problems.length > 0;
    }
    
    // If it's a string, try to parse it
    try {
      const problems = JSON.parse(entnahme.problems);
      return Array.isArray(problems) && problems.length > 0;
    } catch {
      return false;
    }
  };

  const getItemImage = (item: any) => {
    if (item.bild) {
      return getImageUrl("items", item.id, item.bild);
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-gray-500'>Lade Entnahmen...</p>
      </div>
    );
  }

  if (entnahmen.length === 0) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-gray-500'>
          {searchTerm
            ? "Keine Entnahmen gefunden."
            : "Keine Entnahmen verfügbar."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entnahmen.map((entnahme) => (
        <Card 
          key={entnahme.id} 
          className="hover:shadow-lg transition-shadow"
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{entnahme.zweck}</CardTitle>
              {getStatusBadge(entnahme)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{entnahme.expand?.user?.name || "Unbekannt"}</span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {entnahme.expand?.items?.length || 0} Gegenstand(e)
                </span>
              </div>
              
              {/* Show first few items */}
              {entnahme.expand?.items?.slice(0, 2).map((item: any, index: number) => (
                <div key={item.id} className="flex items-center gap-2 ml-6">
                  {getItemImage(item) && (
                    <img 
                      src={getItemImage(item)} 
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(getItemImage(item));
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.name}</p>
                    {item.expand?.kiste && (
                      <p className="text-xs text-gray-500 truncate">
                        Kiste: {item.expand.kiste.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {entnahme.expand?.items?.length > 2 && (
                <p className="text-xs text-gray-500 ml-6">
                  +{entnahme.expand.items.length - 2} weitere...
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Raus: {formatDate(entnahme.raus)}
                </span>
              </div>
              {entnahme.rein && (
                <div className="flex items-center gap-2 ml-6">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">
                    Rein: {formatDate(entnahme.rein)}
                  </span>
                </div>
              )}
            </div>

            {/* Problems indicator */}
            {hasProblems(entnahme) && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600 font-medium">
                  Es gab Probleme bei der Rückgabe
                </span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex gap-2 pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onCardClick(entnahme);
              }}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Details
            </Button>
            {!entnahme.rein && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onReturnEntnahme(entnahme);
                }}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurückgeben
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}