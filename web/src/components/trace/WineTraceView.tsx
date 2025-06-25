
"use client";

import type { WineTraceEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Factory, CheckCircle, Package, Leaf, ArrowRightLeft, Truck, Warehouse, Store, User } from "lucide-react";

interface WineTraceViewProps {
  traceEvents: WineTraceEvent[];
  wineName?: string;
}

const EventIcon = ({ eventType }: { eventType: string }) => {
    const lowerCaseEvent = eventType.toLowerCase();
    if (lowerCaseEvent.includes("cosecha")) return <Leaf className="h-5 w-5 text-green-500" />;
    if (lowerCaseEvent.includes("vino registrado")) return <Package className="h-5 w-5 text-purple-500" />;
    if (lowerCaseEvent.includes("transferido") || lowerCaseEvent.includes("transferencia iniciada")) return <ArrowRightLeft className="h-5 w-5 text-orange-500" />;
    if (lowerCaseEvent.includes("aceptada")) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (lowerCaseEvent.includes("bodega")) return <Factory className="h-5 w-5 text-gray-700" />;
    if (lowerCaseEvent.includes("transportista")) return <Truck className="h-5 w-5 text-blue-500" />;
    if (lowerCaseEvent.includes("distribuidor")) return <Warehouse className="h-5 w-5 text-indigo-500" />;
    if (lowerCaseEvent.includes("minorista")) return <Store className="h-5 w-5 text-cyan-500" />;
    if (lowerCaseEvent.includes("consumidor")) return <User className="h-5 w-5 text-teal-500" />;
    return <Package className="h-5 w-5 text-gray-500" />;
};


export function WineTraceView({ traceEvents, wineName }: WineTraceViewProps) {
  if (traceEvents.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-headline">Información de Trazabilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se encontró información de trazabilidad para este ID de vino.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Historial de Trazabilidad para: <span className="text-primary">{wineName || traceEvents[0]?.assetId}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[1.1rem] top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
            
            {traceEvents.map((event, index) => (
              <div key={index} className="mb-8 relative flex items-start">
                {/* Dot on timeline */}
                <div className="absolute left-[1.1rem] top-1.5 -translate-x-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                  <EventIcon eventType={event.event} />
                </div>
                <div className="ml-10 flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                    <h4 className="font-semibold text-md">{event.event}</h4>
                    <Badge variant="outline" className="text-xs mt-1 sm:mt-0">{format(new Date(event.timestamp), "PPpp")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Actor: {event.actor}</p>
                  {event.details && <p className="text-sm mt-1 bg-muted p-2 rounded-md">{event.details}</p>}
                   <p className="text-xs text-muted-foreground mt-1">ID del Lote: {event.assetId}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
