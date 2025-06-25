
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, AlertTriangle } from "lucide-react";

export default function CertifyPage() {
  const { currentRole } = useAuth();

  if (currentRole !== Role.Regulador) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive"/> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only Regulators can access this page.</p>
            <p className="text-muted-foreground text-sm mt-2">Your current role is: {currentRole}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary"/> Verificación y Certificación
          </CardTitle>
          <CardDescription>
            Busque un lote por su ID para verificar su trazabilidad y añadir certificaciones.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Buscar Lote</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex w-full max-w-xl items-center space-x-2">
                <Input
                type="text"
                placeholder="Introduzca el ID del Lote (ej., GRAPE-xxxx o WINE-xxxx)"
                className="flex-grow"
                />
                <Button type="button">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar Lote
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
                Esta es una funcionalidad de demostración. La lógica de búsqueda y certificación completa no está implementada.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
