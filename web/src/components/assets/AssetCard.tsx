
"use client";

import Image from "next/image";
import type { Asset, GrapeLot, WineBatch } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Building, MapPin, Package, Leaf } from "lucide-react";
import { MOCK_USERS } from "@/lib/constants";


interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const isGrapeLot = (asset: Asset): asset is GrapeLot => 'grapeVariety' in asset;

  const renderSpecificDetails = () => {
    if (isGrapeLot(asset)) {
      const viticultor = MOCK_USERS["Viticultor"].find(p => p.id === asset.viticultorId);
      return (
        <>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            Variedad: {asset.grapeVariety}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Registrado por: {viticultor?.name || asset.viticultorId}</p>
        </>
      );
    } else { // WineBatch
      const bodega = MOCK_USERS["Bodega"].find(f => f.id === asset.bodegaId);
      return (
        <>
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="mr-2 h-4 w-4" />
            Elaborado por: {bodega?.name || asset.bodegaId}
          </div>
          <p className="text-sm mt-2"><strong>Análisis:</strong> {asset.chemicalAnalysis}</p>
          {asset.grapeLotIds.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">Usa {asset.grapeLotIds.length} lote(s) de uva.</p>
          )}
        </>
      );
    }
  };

  const getTraceLink = () => {
    if (isGrapeLot(asset)) {
        // Find a wine batch that uses this grape lot to trace it
        // This is a simplification for the demo.
        const wineUsingThisGrape = mockWineBatches.find(wb => wb.grapeLotIds.includes(asset.id));
        return wineUsingThisGrape ? `/trace?wineId=${wineUsingThisGrape.id}` : `/assets/my-assets`;
    }
    return `/trace?wineId=${asset.id}`;
  }

  // Need to import mockWineBatches for the trace link logic
  const { mockWineBatches } = require('@/lib/mockData');

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-2">
        {asset.imageUrl && (
          <div className="relative aspect-video w-full mb-2">
            <Image
              src={asset.imageUrl}
              alt={asset.name}
              fill
              className="rounded-t-lg object-cover"
              data-ai-hint={isGrapeLot(asset) ? "uvas cosecha" : "botella vino"}
            />
          </div>
        )}
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg">{asset.name}</CardTitle>
          <Badge variant={isGrapeLot(asset) ? "secondary" : "default"} className="whitespace-nowrap">
            {isGrapeLot(asset) ? <Leaf className="mr-1 h-3 w-3"/> : <Package className="mr-1 h-3 w-3"/>}
            {isGrapeLot(asset) ? "Lote de Uva" : "Lote de Vino"}
          </Badge>
        </div>
        <CardDescription>ID: {asset.id}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <p>Registrado: {format(new Date(asset.registrationDate), "PPP")}</p>
        {renderSpecificDetails()}
        {isGrapeLot(asset) && <p className="mt-2 text-xs"><strong>Insumos:</strong> {asset.inputsUsed}</p>}
      </CardContent>
      <CardFooter>
        <Link href={getTraceLink()} passHref className="w-full">
          <Button variant="outline" className="w-full">
            Ver Detalles / Trazar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
