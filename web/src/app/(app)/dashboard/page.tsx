
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Role, type Asset, type Transfer } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { mockWineBatches, mockGrapeLots, mockTransfers, getAssetsForUser } from '@/lib/mockData';
import { MOCK_USERS } from '@/lib/constants';
import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Package, PackagePlus, Search, Users, BarChart3, ListChecks, Eye, Leaf, Warehouse, Truck, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const AssetListItem = ({ asset }: { asset: Asset }) => (
  <li className="flex items-center justify-between py-3 border-b last:border-b-0">
    <div className="flex items-center gap-3">
      {asset.imageUrl && <Image data-ai-hint="product package" src={asset.imageUrl} alt={asset.name} width={40} height={40} className="rounded-md object-cover"/>}
      <div>
        <p className="font-medium">{asset.name}</p>
        <p className="text-sm text-muted-foreground">ID: {asset.id}</p>
      </div>
    </div>
    <Badge variant={'grapeVariety' in asset ? "secondary" : "default"}>
      {'grapeVariety' in asset ? 'Lote de Uva' : 'Lote de Vino'}
    </Badge>
  </li>
);

const TransferListItem = ({ transfer }: { transfer: Transfer }) => (
   <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3 border-b last:border-b-0">
    <div className="flex items-center gap-3">
      <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="font-medium">
          {transfer.assetName} ({transfer.assetType === "GrapeLot" ? "Uva" : "Vino"})
        </p>
        <p className="text-sm text-muted-foreground">
          De: {transfer.fromRole} ({MOCK_USERS[transfer.fromRole]?.find(u => u.id === transfer.fromUserId)?.name || 'N/A'})
        </p>
        <p className="text-sm text-muted-foreground">
          A: {transfer.toRole} ({MOCK_USERS[transfer.toRole]?.find(u => u.id === transfer.toUserId)?.name || 'N/A'})
        </p>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 self-end sm:self-center">
        <Badge variant={
            transfer.status === 'accepted' ? 'default' :
            transfer.status === 'rejected' ? 'destructive' : 'secondary'
        } className="capitalize">{transfer.status}</Badge>
        <p className="text-xs text-muted-foreground">{format(new Date(transfer.requestDate), "PPp")}</p>
    </div>
  </li>
);


export default function DashboardPage() {
  const { currentRole, currentUser } = useAuth();
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [userTransfers, setUserTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    if (currentUser) {
      setUserAssets(getAssetsForUser(currentUser.id, currentRole));
      const relatedTransfers = mockTransfers.filter(
        t => t.fromUserId === currentUser.id || t.toUserId === currentUser.id
      ).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
      setUserTransfers(relatedTransfers);
    }
  }, [currentUser, currentRole]);

  if (!currentUser) {
    return <div className="p-4">Cargando información de usuario...</div>;
  }

  const getRoleSpecificStats = () => {
    switch (currentRole) {
      case Role.Viticultor:
        return [
          { title: "Lotes de Uva Registrados", value: userAssets.length, icon: Leaf, description: "Cosechas que has registrado." },
          { title: "Transferencias Salientes", value: userTransfers.filter(t => t.fromUserId === currentUser.id).length, icon: ArrowRightLeft, description: "Lotes enviados a bodegas." },
        ];
      case Role.Bodega:
        return [
          { title: "Lotes de Vino Producidos", value: userAssets.filter(a => 'grapeLotIds' in a).length, icon: Package, description: "Vinos que has elaborado." },
          { title: "Cosechas Recibidas", value: userTransfers.filter(t => t.toUserId === currentUser.id && t.assetType === 'GrapeLot' && t.status === 'accepted').length, icon: PackagePlus, description: "Lotes de uva aceptados." },
        ];
      case Role.Distribuidor:
        return [
          { title: "Inventario de Vino", value: userAssets.length, icon: Warehouse, description: "Lotes de vino en tu almacén." },
          { title: "Entregas a Minoristas", value: userTransfers.filter(t => t.fromUserId === currentUser.id).length, icon: Truck, description: "Envíos a puntos de venta." },
        ];
      case Role.Minorista:
        return [
          { title: "Vino en Tienda", value: userAssets.length, icon: Package, description: "Botellas disponibles para la venta." },
          { title: "Ventas a Consumidores", value: userTransfers.filter(t => t.fromUserId === currentUser.id && t.toRole === Role.Consumidor).length, icon: Users, description: "Vinos vendidos." },
        ];
      case Role.Transportista:
        return [
            { title: "Transferencias en Tránsito", value: userTransfers.filter(t => t.status === "in_transit").length, icon: Truck, description: "Envíos que estás gestionando." },
        ];
      case Role.Regulador:
        return [
            { title: "Lotes Verificados", value: 0, icon: ShieldCheck, description: "Activos verificados por ti (funcionalidad TBD)." },
        ];
      case Role.Consumidor:
        return [
           { title: "Vinos Comprados", value: userTransfers.filter(t => t.toUserId === currentUser.id && t.status === 'accepted').length, icon: Package, description: "Vinos que has adquirido." },
        ];
      default:
        return [];
    }
  };
  
  const quickActions = () => {
    switch (currentRole) {
      case Role.Viticultor:
        return [ { label: "Registrar Cosecha", href: "/assets/register-raw", icon: PackagePlus }, { label: "Crear Transferencia", href: "/transfers/create", icon: ArrowRightLeft } ];
      case Role.Bodega:
        return [ { label: "Registrar Vino", href: "/assets/register-product", icon: PackagePlus }, { label: "Crear Transferencia", href: "/transfers/create", icon: ArrowRightLeft } ];
      case Role.Distribuidor:
      case Role.Minorista:
        return [ { label: "Crear Transferencia", href: "/transfers/create", icon: ArrowRightLeft }, { label: "Ver Inventario", href: "/assets/my-assets", icon: Package } ];
      case Role.Regulador:
        return [ { label: "Verificar Lote", href: "/certify", icon: ShieldCheck } ];
      case Role.Consumidor:
        return [ { label: "Trazar un Vino", href: "/trace", icon: Search }, { label: "Ver Mis Compras", href: "/transfers/view", icon: Eye } ];
      default:
        return [];
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">¡Bienvenido, {currentUser.name} ({currentRole})!</CardTitle>
          <CardDescription>Este es un resumen de tu actividad en la cadena de suministro.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getRoleSpecificStats().map(stat => <StatCard key={stat.title} {...stat} />)}
      </div>
      
      {quickActions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions().map(action => (
              <Link key={action.label} href={action.href} passHref>
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                  <action.icon className="mr-3 h-5 w-5 text-primary" />
                  <span className="text-base">{action.label}</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {userAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Mis Lotes Recientes ({userAssets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {userAssets.slice(0, 3).map(asset => <AssetListItem key={asset.id} asset={asset} />)}
            </ul>
            {userAssets.length > 3 && (
              <Link href="/assets/my-assets" passHref>
                <Button variant="link" className="mt-2 px-0">Ver todos los lotes &rarr;</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
      
      {userTransfers.length > 0 && (
         <Card>
          <CardHeader>
            <CardTitle className="font-headline">Transferencias Recientes ({userTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {userTransfers.slice(0,3).map(transfer => <TransferListItem key={transfer.id} transfer={transfer} />)}
            </ul>
             {userTransfers.length > 3 && (
              <Link href="/transfers/view" passHref>
                <Button variant="link" className="mt-2 px-0">Ver todas las transferencias &rarr;</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {[Role.Viticultor, Role.Bodega, Role.Distribuidor].includes(currentRole) && (
        <Card className="bg-accent/50 border-accent">
          <CardHeader>
              <CardTitle className="font-headline text-accent-foreground flex items-center gap-2">
                <BarChart3 /> Perspectivas IA de la Cadena de Suministro
              </CardTitle>
              <CardDescription className="text-accent-foreground/80">
                Descubre optimizaciones y posibles disrupciones en la cadena de suministro.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/analyzer" passHref>
              <Button>
                Ir al Analizador IA
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
