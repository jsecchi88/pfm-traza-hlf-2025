
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role, type Asset } from "@/types";
import { getAssetsForUser } from "@/lib/mockData";
import { AssetCard } from "@/components/assets/AssetCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackageSearch } from "lucide-react";

export default function MyAssetsPage() {
  const { currentUser, currentRole } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<"all" | "grape" | "wine">("all");

  useEffect(() => {
    if (currentUser && currentRole !== Role.None) {
      setAssets(getAssetsForUser(currentUser.id, currentRole));
    }
  }, [currentUser, currentRole]);

  const filteredAssets = assets.filter(asset => {
    const nameMatch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = assetTypeFilter === "all" ||
                      (assetTypeFilter === "grape" && 'grapeVariety' in asset) ||
                      (assetTypeFilter === "wine" && 'bodegaId' in asset);
    return nameMatch && typeMatch;
  });

  if (!currentUser) {
    return <p>Cargando información de usuario...</p>;
  }
  
  const canFilterByType = currentRole === Role.Bodega; // Only Bodegas handle both types

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <PackageSearch className="h-8 w-8 text-primary" /> Mis Lotes
          </CardTitle>
          <CardDescription>
            Visualiza todos los lotes que has registrado o recibido.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Input 
              placeholder="Buscar lotes por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            {canFilterByType && (
              <Select value={assetTypeFilter} onValueChange={(value: "all" | "grape" | "wine") => setAssetTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Tipos</SelectItem>
                  <SelectItem value="grape">Lotes de Uva</SelectItem>
                  <SelectItem value="wine">Lotes de Vino</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {assets.length === 0 ? "Aún no tienes lotes." : "Ningún lote coincide con tus filtros actuales."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
