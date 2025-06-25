
"use client";

import React, { useState, useEffect } from 'react';
import { Role, type Transfer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTransfers } from '@/lib/mockData';
import { MOCK_USERS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock3, ArrowRightLeft, User, Package, Leaf } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface TransferListProps {
  initialFilter?: "all" | "incoming" | "outgoing" | "pending" | "completed";
}

export function TransferList({ initialFilter = "all" }: TransferListProps) {
  const { currentUser, currentRole } = useAuth();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>(mockTransfers);
  const [activeTab, setActiveTab] = useState<string>(initialFilter);

  const handleTransferAction = (transferId: string, newStatus: "accepted" | "rejected") => {
    setTransfers(prevTransfers =>
      prevTransfers.map(t =>
        t.id === transferId ? { ...t, status: newStatus, actionDate: new Date().toISOString() } : t
      )
    );
    const transferIndex = mockTransfers.findIndex(t => t.id === transferId);
    if (transferIndex !== -1) {
      mockTransfers[transferIndex] = { ...mockTransfers[transferIndex], status: newStatus, actionDate: new Date().toISOString() };
    }

    toast({
      title: `Transferencia ${newStatus === 'accepted' ? 'Aceptada' : 'Rechazada'}`,
      description: `La transferencia ID ${transferId} ha sido ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'}.`,
    });
  };
  
  const getFilteredTransfers = () => {
    if (!currentUser) return [];
    
    // Transportistas ven todas las transferencias activas para potencialmente gestionarlas.
    if(currentRole === Role.Transportista) {
        return transfers.filter(t => ['pending', 'in_transit', 'accepted'].includes(t.status))
            .sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }

    let filtered = transfers.filter(t => t.toUserId === currentUser.id || t.fromUserId === currentUser.id);

    if (activeTab === "incoming") {
      filtered = filtered.filter(t => t.toUserId === currentUser.id);
    } else if (activeTab === "outgoing") {
      filtered = filtered.filter(t => t.fromUserId === currentUser.id);
    } else if (activeTab === "pending") {
      filtered = filtered.filter(t => t.status === "pending");
    } else if (activeTab === "completed") {
      filtered = filtered.filter(t => ["accepted", "rejected"].includes(t.status));
    }
    return filtered.sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  };

  const displayedTransfers = getFilteredTransfers();

  if (!currentUser) {
    return <p>Cargando datos de usuario...</p>;
  }
  
  const renderTransferItem = (transfer: Transfer) => {
    const fromUser = MOCK_USERS[transfer.fromRole]?.find(u => u.id === transfer.fromUserId);
    const toUser = MOCK_USERS[transfer.toRole]?.find(u => u.id === transfer.toUserId);
    const isCurrentUserRecipient = transfer.toUserId === currentUser.id;
    const canTakeAction = isCurrentUserRecipient && transfer.status === 'pending' && currentRole !== Role.Consumidor;

    return (
      <Card key={transfer.id} className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle className="font-headline text-lg flex items-center gap-2 mb-2 sm:mb-0">
              {transfer.assetType === "GrapeLot" ? <Leaf className="h-5 w-5 text-green-600" /> : <Package className="h-5 w-5 text-blue-600" />}
              {transfer.assetName}
            </CardTitle>
            <Badge variant={
                transfer.status === 'accepted' ? 'default' :
                transfer.status === 'rejected' ? 'destructive' : 'secondary'
            } className="capitalize text-xs">
              {transfer.status === 'pending' && <Clock3 className="mr-1 h-3 w-3"/>}
              {transfer.status === 'accepted' && <CheckCircle2 className="mr-1 h-3 w-3"/>}
              {transfer.status === 'rejected' && <XCircle className="mr-1 h-3 w-3"/>}
              {transfer.status}
            </Badge>
          </div>
          <CardDescription className="text-xs">ID: {transfer.id} | Cantidad: {transfer.quantity}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>De: {fromUser?.name || transfer.fromRole}</span>
            </div>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground"/>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>A: {toUser?.name || transfer.toRole}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Solicitado: {format(new Date(transfer.requestDate), "PPp")}
            {transfer.actionDate && ` | Acción: ${format(new Date(transfer.actionDate), "PPp")}`}
          </p>
          {canTakeAction && (
            <div className="flex gap-2 pt-2 border-t mt-3">
              <Button size="sm" variant="default" onClick={() => handleTransferAction(transfer.id, 'accepted')}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Aceptar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleTransferAction(transfer.id, 'rejected')}>
                <XCircle className="mr-2 h-4 w-4" /> Rechazar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="incoming">Entrantes</TabsTrigger>
            <TabsTrigger value="outgoing">Salientes</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
             {displayedTransfers.length > 0 ? (
                <div>{displayedTransfers.map(renderTransferItem)}</div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-4" />
                  <p>No se encontraron transferencias para esta categoría.</p>
                </div>
              )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
