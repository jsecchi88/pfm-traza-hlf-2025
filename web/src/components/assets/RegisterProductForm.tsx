
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import type { WineBatch, GrapeLot } from "@/types";
import { mockWineBatches, mockGrapeLots, mockTransfers } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PackagePlus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  productionDetails: z.string().min(10, "Los detalles deben tener al menos 10 caracteres.").max(500),
  grapeLotIds: z.array(z.string()).min(1, "Se debe seleccionar al menos un lote de uva."),
  chemicalAnalysis: z.string().min(5, "El análisis debe tener al menos 5 caracteres."),
  bottlingDate: z.date({ required_error: "La fecha de embotellado es obligatoria."}),
  imageUrl: z.string().url("Debe ser una URL válida.").optional(),
});

export function RegisterWineBatchForm() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [availableGrapeLots, setAvailableGrapeLots] = useState<GrapeLot[]>([]);

  useEffect(() => {
    if (currentUser) {
      const acceptedGrapeLotIds = mockTransfers
        .filter(t => t.toUserId === currentUser.id && t.assetType === "GrapeLot" && t.status === "accepted")
        .map(t => t.assetId);
      const factoryGrapeLots = mockGrapeLots.filter(gl => acceptedGrapeLotIds.includes(gl.id));
      setAvailableGrapeLots(factoryGrapeLots);
    }
  }, [currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      productionDetails: "",
      grapeLotIds: [],
      chemicalAnalysis: "",
      imageUrl: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    
    const newWineBatch: WineBatch = {
      id: `WINE-${Date.now().toString().slice(-4)}`,
      ...values,
      grapeLotIds: values.grapeLotIds,
      bodegaId: currentUser.id,
      bottlingDate: values.bottlingDate.toISOString(),
      registrationDate: new Date().toISOString(),
      imageUrl: values.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(values.name)}`,
    };

    mockWineBatches.push(newWineBatch);
    console.log("Nuevo Lote de Vino Registrado:", newWineBatch);
    toast({
      title: "Vino Registrado",
      description: `El lote ${newWineBatch.name} ha sido registrado exitosamente.`,
    });
    form.reset();
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
         <PackagePlus className="h-6 w-6 text-primary" /> Registrar Nuevo Lote de Vino
        </CardTitle>
        <CardDescription>Detalla el vino terminado y los lotes de uva utilizados.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Vino</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Gran Reserva Malbec 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles de Producción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el proceso de fermentación, crianza, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grapeLotIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Lotes de Uva Utilizados</FormLabel>
                    <FormDescription>
                      Selecciona los lotes de uva que se usaron para este vino.
                    </FormDescription>
                  </div>
                  {availableGrapeLots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay lotes de uva disponibles. Primero debes aceptar transferencias de viticultores.</p>
                  ) : (
                    availableGrapeLots.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="grapeLotIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== item.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.name} (Variedad: {item.grapeVariety})
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  )))}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="chemicalAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Análisis Químico</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: pH: 3.6, Alcohol: 13.9%" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bottlingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Embotellado</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/botella-vino.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || availableGrapeLots.length === 0}>
              {form.formState.isSubmitting ? "Registrando..." : "Registrar Lote de Vino"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
