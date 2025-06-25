
"use client";

import { RegisterWineBatchForm } from "@/components/assets/RegisterWineBatchForm";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function RegisterWineBatchPage() {
  const { currentRole } = useAuth();

  if (currentRole !== Role.Bodega) {
     return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive"/> Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Solo las Bodegas pueden registrar lotes de vino.</p>
            <p className="text-muted-foreground text-sm mt-2">Tu rol actual es: {currentRole}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <RegisterWineBatchForm />
    </div>
  );
}
