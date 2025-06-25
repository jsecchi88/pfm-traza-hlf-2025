
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Role, type Transfer, type Asset } from "@/types";
import { mockTransfers, getAssetsForUser } from "@/lib/mockData";
import { MOCK_USERS, getTargetRoles } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";

const formSchema = z.object({
  assetId: z.string().min(1, "La selección del lote es obligatoria."),
  toUserId: z.string().min(1, "El destinatario es obligatorio."),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1.").optional(),
});

export function CreateTransferForm() {
  const { currentUser, currentRole } = useAuth();
  const { toast } = useToast();
  const [transferableAssets, setTransferableAssets] = useState<Asset[]>([]);
  const [targetRole, setTargetRole] = useState<Role | null>(null);
  const [availableRecipients, setAvailableRecipients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (currentUser && currentRole !== Role.None) {
      const userAssets = getAssetsForUser(currentUser.id, currentRole);
      
      if (currentRole === Role.Viticultor) {
        setTransferableAssets(userAssets.filter(a => 'grapeVariety' in a));
      } else if ([Role.Bodega, Role.Distribuidor, Role.Minorista].includes(currentRole)) {
        setTransferableAssets(userAssets.filter(a => 'bodegaId' in a));
      } else {
        setTransferableAssets([]);
      }

      const possibleTargetRoles = getTargetRoles(currentRole);
      if (possibleTargetRoles.length > 0) {
        const firstTargetRole = possibleTargetRoles[0];
        setTargetRole(firstTargetRole);
        setAvailableRecipients(MOCK_USERS[firstTargetRole] || []);
      } else {
        setTargetRole(null);
        setAvailableRecipients([]);
      }
    }
  }, [currentUser, currentRole]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: "",
      toUserId: "",
      quantity: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser || !targetRole) {
      toast({ title: "Error", description: "No se puede iniciar la transferencia.", variant: "destructive" });
      return;
    }

    const asset = transferableAssets.find(a => a.id === values.assetId);
    if (!asset) {
       toast({ title: "Error", description: "Lote seleccionado no encontrado.", variant: "destructive" });
      return;
    }

    const newTransfer: Transfer = {
      id: `TR-${Date.now().toString()}`,
      assetId: values.assetId,
      assetName: asset.name,
      assetType: 'grapeVariety' in asset ? "GrapeLot" : "WineBatch",
      fromUserId: currentUser.id,
      fromRole: currentRole,
      toUserId: values.toUserId,
      toRole: targetRole,
      status: "pending",
      requestDate: new Date().toISOString(),
      quantity: values.quantity || 1,
    };

    mockTransfers.push(newTransfer);
    console.log("Nueva Transferencia Iniciada:", newTransfer);
    toast({
      title: "Transferencia Iniciada",
      description: `Se envió la solicitud para transferir ${asset.name} a ${MOCK_USERS[targetRole]?.find(u=>u.id === values.toUserId)?.name}.`,
    });
    form.reset();
  }
  
  if (!targetRole || transferableAssets.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2"><Send className="h-6 w-6 text-primary"/> Iniciar Nueva Transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {transferableAssets.length === 0 ? "Actualmente no tienes lotes elegibles para transferir." : "No hay destinatarios elegibles para transferencias desde tu rol."}
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Send className="h-6 w-6 text-primary"/> Iniciar Nueva Transferencia
        </CardTitle>
        <CardDescription>Selecciona un lote y un destinatario para iniciar una solicitud de transferencia.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lote a Transferir</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un lote" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transferableAssets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.id}) - { 'grapeVariety' in asset ? "Lote de Uva" : "Lote de Vino"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Elige uno de tus lotes disponibles para transferir.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatario ({targetRole})</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={availableRecipients.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecciona un destinatario ${targetRole?.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRecipients.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Selecciona el usuario que recibirá este lote.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} min={1}/>
                  </FormControl>
                  <FormDescription>Especifica la cantidad a transferir (ej. kg de uva, botellas de vino).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || availableRecipients.length === 0}>
               {form.formState.isSubmitting ? "Enviando Solicitud..." : "Iniciar Transferencia"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
