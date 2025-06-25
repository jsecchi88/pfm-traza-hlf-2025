
import { Role } from "@/types";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Package, PackagePlus, ArrowRightLeft, Search, User, Factory, Store, ShoppingCart, Link as LinkIcon, ListChecks, Leaf, Truck, Warehouse, ShieldCheck } from 'lucide-react';

export const APP_NAME = "WineChain";

export const ROLES: Role[] = [
  Role.Viticultor,
  Role.Bodega,
  Role.Transportista,
  Role.Distribuidor,
  Role.Minorista,
  Role.Regulador,
  Role.Consumidor,
];

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: Role[];
  subItems?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ROLES.filter(r => r !== Role.None) },
  { 
    label: "Lotes", 
    href: "/assets", 
    icon: Package, 
    allowedRoles: [Role.Viticultor, Role.Bodega, Role.Distribuidor, Role.Minorista],
    subItems: [
      { label: "Registrar Cosecha", href: "/assets/register-raw", icon: PackagePlus, allowedRoles: [Role.Viticultor] },
      { label: "Registrar Vino", href: "/assets/register-product", icon: PackagePlus, allowedRoles: [Role.Bodega] },
      { label: "Ver mis Lotes", href: "/assets/my-assets", icon: Package, allowedRoles: [Role.Viticultor, Role.Bodega, Role.Distribuidor, Role.Minorista] },
    ]
  },
  { 
    label: "Transferencias", 
    href: "/transfers", 
    icon: ArrowRightLeft, 
    allowedRoles: ROLES.filter(r => r !== Role.None && r !== Role.Regulador),
    subItems: [
      { label: "Crear Transferencia", href: "/transfers/create", icon: ArrowRightLeft, allowedRoles: [Role.Viticultor, Role.Bodega, Role.Distribuidor, Role.Minorista] },
      { label: "Ver Transferencias", href: "/transfers/view", icon: ListChecks, allowedRoles: ROLES.filter(r => r !== Role.None && r !== Role.Regulador) },
    ]
  },
  { label: "Trazar Vino", href: "/trace", icon: Search, allowedRoles: ROLES.filter(r => r !== Role.None) },
  { label: "Certificar", href: "/certify", icon: ShieldCheck, allowedRoles: [Role.Regulador]},
];

export const ROLE_ICONS: Record<Role, LucideIcon> = {
  [Role.Viticultor]: Leaf,
  [Role.Bodega]: Factory,
  [Role.Transportista]: Truck,
  [Role.Distribuidor]: Warehouse,
  [Role.Minorista]: Store,
  [Role.Regulador]: ShieldCheck,
  [Role.Consumidor]: ShoppingCart,
  [Role.None]: User,
};

export const APP_LOGO_ICON = LinkIcon;

export const MOCK_USERS: Record<Role, { id: string; name: string }[]> = {
  [Role.Viticultor]: [
    { id: "viticultor-1", name: "Finca El Sol" },
    { id: "viticultor-2", name: "Viñedos de la Montaña" },
  ],
  [Role.Bodega]: [
    { id: "bodega-1", name: "Bodegas Mendoza" },
    { id: "bodega-2", name: "Vinos del Sur" },
  ],
  [Role.Transportista]: [
      { id: "transportista-1", name: "Transportes Andinos" },
  ],
  [Role.Distribuidor]: [
    { id: "distribuidor-1", name: "Distribuidora Nacional" },
    { id: "distribuidor-2", name: "Vinos del Mundo" },
  ],
  [Role.Minorista]: [
    { id: "minorista-1", name: "Super Vinos" },
    { id: "minorista-2", name: "La Cava de Juan" },
  ],
  [Role.Regulador]: [
      { id: "regulador-1", name: "Consejo Regulador D.O."}
  ],
  [Role.Consumidor]: [
    { id: "consumidor-1", name: "Ana García" },
    { id: "consumidor-2", name: "Carlos Pérez" },
  ],
  [Role.None]: [],
};

export function getTargetRoles(currentRole: Role): Role[] {
  switch (currentRole) {
    case Role.Viticultor:
      return [Role.Bodega];
    case Role.Bodega:
      return [Role.Distribuidor];
    case Role.Distribuidor:
      return [Role.Minorista];
    case Role.Minorista:
      return [Role.Consumidor];
    default:
      return [];
  }
}
