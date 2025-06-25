
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WineTraceView } from "@/components/trace/WineTraceView";
import type { WineTraceEvent } from "@/types";
import { getWineTrace, mockWineBatches } from "@/lib/mockData";
import { SearchCode, Loader2, Search } from "lucide-react";

export default function TraceWinePage() {
  const searchParams = useSearchParams();
  const initialWineId = searchParams.get('wineId') || "";
  const [wineId, setWineId] = useState(initialWineId);
  const [traceEvents, setTraceEvents] = useState<WineTraceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [wineName, setWineName] = useState<string | undefined>(undefined);

  const handleSearch = async () => {
    if (!wineId.trim()) return;
    setIsLoading(true);
    setSearched(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const events = getWineTrace(wineId.trim());
    setTraceEvents(events);
    const wine = mockWineBatches.find(p => p.id === wineId.trim());
    setWineName(wine?.name);
    setIsLoading(false);
  };
  
  // Auto-search if wineId is in URL params
  useEffect(() => {
    if (initialWineId) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWineId]);


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <SearchCode className="h-8 w-8 text-primary"/> Trazabilidad del Vino
          </CardTitle>
          <CardDescription>
            Introduce el ID de un lote de vino para ver su historial completo en la cadena de suministro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-xl items-center space-x-2">
            <Input
              type="text"
              placeholder="Introduce el ID del vino (ej., WINE-xxxx)"
              value={wineId}
              onChange={(e) => setWineId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-grow"
            />
            <Button type="button" onClick={handleSearch} disabled={isLoading || !wineId.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Trazar Vino
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Obteniendo datos de trazabilidad...</p>
        </div>
      )}

      {!isLoading && searched && (
        <WineTraceView traceEvents={traceEvents} wineName={wineName}/>
      )}
       {!isLoading && !searched && (
        <Card className="mt-6">
         <CardContent className="py-10 text-center">
           <p className="text-muted-foreground">Introduce un ID de vino para empezar la trazabilidad.</p>
         </CardContent>
        </Card>
      )}
    </div>
  );
}
