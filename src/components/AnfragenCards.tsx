import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, User, Eye } from "lucide-react";

interface AnfragenCardsProps {
  anfragen: any[];
  isLoading: boolean;
  onOpenDialog: (anfrage: any) => void;
}

export function AnfragenCards({ anfragen, isLoading, onOpenDialog }: AnfragenCardsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (anfrage: any) => {
    // You can extend this logic based on your needs
    const createdDate = new Date(anfrage.created);
    const now = new Date();
    const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 3600);

    if (diffHours < 24) {
      return <Badge variant="default">Neu</Badge>;
    } else if (diffHours < 72) {
      return <Badge variant="secondary">Ausstehend</Badge>;
    } else {
      return <Badge variant="outline">Älter</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (anfragen.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Keine Anfragen vorhanden</h3>
          <p>Es sind noch keine Anfragen eingegangen.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {anfragen.map((anfrage) => (
        <Card key={anfrage.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{anfrage.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {formatDate(anfrage.raus)}
                  </span>
                </div>
              </div>
              {getStatusBadge(anfrage)}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">Zweck:</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {anfrage.zweck}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {anfrage.items?.length || 0} Gegenstände
                </span>
              </div>
              {anfrage.expand?.items && anfrage.expand.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {anfrage.expand.items.slice(0, 3).map((item: any) => (
                    <Badge key={item.id} variant="outline" className="text-xs">
                      {item.name}
                    </Badge>
                  ))}
                  {anfrage.expand.items.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{anfrage.expand.items.length - 3} weitere
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>Erstellt: {formatDate(anfrage.created)}</span>
              </div>
              
              <Button 
                onClick={() => onOpenDialog(anfrage)}
                className="w-full"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Details anzeigen
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}