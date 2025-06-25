
"use client";

import { CreateTransferForm } from "@/components/transfers/CreateTransferForm";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function CreateTransferPage() {
  const { currentRole } = useAuth();

  const canCreateTransfer = [Role.Viticultor, Role.Bodega, Role.Distribuidor, Role.Minorista].includes(currentRole);

  if (!canCreateTransfer) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive"/> Acción no permitida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Tu rol ({currentRole}) no puede iniciar transferencias.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <CreateTransferForm />
    </div>
  );
}
