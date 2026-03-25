import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Package, Calendar, RotateCcw } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { getDeviceToken } from "@/lib/deviceToken";
import { PublicRueckgabeDialog } from "@/components/PublicRueckgabeDialog";

export default function MeineAnfragen() {
  const [anfragen, setAnfragen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnfrage, setSelectedAnfrage] = useState<any>(null);
  const [isRueckgabeOpen, setIsRueckgabeOpen] = useState(false);

  useEffect(() => {
    fetchAnfragen();
  }, []);

  const fetchAnfragen = async () => {
    setIsLoading(true);
    try {
      const deviceToken = getDeviceToken();
      const result = await pb.collection("anfragen").getFullList({
        filter: `device_token = "${deviceToken}"`,
        expand: "items,items.kiste,entnahme_ref,entnahme_ref.items,entnahme_ref.items.kiste",
        sort: "-created",
      });
      setAnfragen(result);
    } catch (error) {
      console.error("Error fetching anfragen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "angenommen":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Angenommen</Badge>;
      case "zurückgegeben":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Zurückgegeben</Badge>;
      default:
        return <Badge variant="secondary">Ausstehend</Badge>;
    }
  };

  const getEntnahmeItems = (anfrage: any) => {
    return anfrage.expand?.entnahme_ref?.expand?.items || [];
  };

  const canReturn = (anfrage: any) => {
    return (
      anfrage.status === "angenommen" &&
      anfrage.expand?.entnahme_ref &&
      !anfrage.expand.entnahme_ref.rein
    );
  };

  const handleRueckgabe = (anfrage: any) => {
    setSelectedAnfrage(anfrage);
    setIsRueckgabeOpen(true);
  };

  const handleRueckgabeSuccess = () => {
    fetchAnfragen();
    setSelectedAnfrage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/public-items">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zum Inventar
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Meine Anfragen</h1>
          <p className="text-gray-600 text-sm">
            Hier siehst du den Status deiner Anfragen und den Abholort.
          </p>
        </div>

        {/* Empty state */}
        {anfragen.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Keine Anfragen gefunden</h3>
              <p className="text-sm mb-4">
                Auf diesem Gerät wurden noch keine Anfragen gestellt.
              </p>
              <Link to="/public-items">
                <Button variant="outline">Zum Inventar</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Anfragen list */}
        <div className="space-y-4">
          {anfragen.map((anfrage) => {
            const entnahmeItems = getEntnahmeItems(anfrage);

            return (
              <Card key={anfrage.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{anfrage.zweck}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Benötigt ab: {formatDate(anfrage.raus)}</span>
                      </div>
                    </div>
                    {getStatusBadge(anfrage.status || "ausstehend")}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Requested items */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Angeforderte Gegenstände:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(anfrage.expand?.items || []).map((item: any) => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Pickup location (when angenommen) */}
                  {anfrage.status === "angenommen" && entnahmeItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Abholort:</p>
                      <div className="space-y-2">
                        {entnahmeItems.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-sm bg-green-50 rounded px-3 py-2"
                          >
                            <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                            <span className="font-medium">{item.name}</span>
                            {item.expand?.kiste ? (
                              <span className="text-gray-600">
                                — {item.expand.kiste.name}, Regal {item.expand.kiste.regal}, Stellplatz {item.expand.kiste.stellplatz}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Return button */}
                  {canReturn(anfrage) && (
                    <Button
                      onClick={() => handleRueckgabe(anfrage)}
                      className="w-full"
                      variant="outline"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rückgabe bestätigen
                    </Button>
                  )}

                  {anfrage.status === "zurückgegeben" && (
                    <p className="text-sm text-blue-600 text-center">
                      Gegenstände wurden zurückgegeben. Danke!
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedAnfrage && (
        <PublicRueckgabeDialog
          isOpen={isRueckgabeOpen}
          onClose={() => setIsRueckgabeOpen(false)}
          entnahme={selectedAnfrage.expand?.entnahme_ref}
          anfrageId={selectedAnfrage.id}
          onSuccess={handleRueckgabeSuccess}
        />
      )}
    </div>
  );
}
