
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
import type { GrapeLot } from "@/types";
import { mockGrapeLots } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { PackagePlus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  grapeVariety: z.string().min(2, "La variedad debe tener al menos 2 caracteres.").max(100),
  parcelData: z.string().min(10, "Los datos de la parcela deben tener al menos 10 caracteres.").max(500),
  inputsUsed: z.string().min(10, "Los insumos deben tener al menos 10 caracteres.").max(500),
  imageUrl: z.string().url("Debe ser una URL válida.").optional(),
});

export function RegisterGrapeLotForm() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      grapeVariety: "",
      parcelData: "",
      inputsUsed: "",
      imageUrl: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    
    const newGrapeLot: GrapeLot = {
      id: `GRAPE-${Date.now().toString().slice(-4)}`,
      ...values,
      viticultorId: currentUser.id,
      harvestDate: new Date().toISOString(),
      registrationDate: new Date().toISOString(),
      imageUrl: values.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(values.name)}`,
    };

    mockGrapeLots.push(newGrapeLot); 
    console.log("Nuevo Lote de Uva Registrado:", newGrapeLot);
    toast({
      title: "Cosecha Registrada",
      description: `El lote ${newGrapeLot.name} ha sido registrado exitosamente.`,
    });
    form.reset();
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-primary" /> Registrar Nueva Cosecha de Uva
        </CardTitle>
        <CardDescription>Rellena los detalles del lote de uva que estás introduciendo en la cadena de suministro.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cosecha Malbec 2024 - Parcela 5" {...field} />
                  </FormControl>
                  <FormDescription>El nombre o identificador para este lote de uva.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grapeVariety"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variedad de Uva</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Malbec" {...field} />
                  </FormControl>
                  <FormDescription>La variedad de uva de esta cosecha.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parcelData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datos de la Parcela</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la ubicación y características de la parcela."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Información detallada sobre la parcela de origen.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inputsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insumos Utilizados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe los fertilizantes, pesticidas y otros insumos utilizados."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Información sobre los tratamientos aplicados al cultivo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormDescription>Un enlace a una imagen de la cosecha.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Registrando..." : "Registrar Cosecha"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
