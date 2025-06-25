
export enum Role {
  Viticultor = "Viticultor",
  Bodega = "Bodega",
  Transportista = "Transportista",
  Distribuidor = "Distribuidor",
  Minorista = "Minorista",
  Regulador = "Regulador",
  Consumidor = "Consumidor",
  None = "None",
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface GrapeLot {
  id: string;
  name: string; // e.g., "Cosecha Malbec 2023 - Parcela 5"
  grapeVariety: string;
  parcelData: string; // e.g., "Parcela 5, Finca El Sol"
  inputsUsed: string; // e.g., "Fertilizantes orgánicos, riego por goteo"
  viticultorId: string;
  harvestDate: string; // ISO Date string
  imageUrl?: string;
  registrationDate: string; // ISO Date string, was missing
}

export interface WineBatch {
  id: string;
  name: string; // e.g., "Gran Reserva Malbec 2023"
  grapeLotIds: string[];
  bodegaId: string;
  productionDetails: string;
  chemicalAnalysis: string; // e.g., "pH: 3.5, Alcohol: 14.2%"
  bottlingDate: string; // ISO Date string
  registrationDate: string; // ISO Date string
  imageUrl?: string;
}

export type Asset = GrapeLot | WineBatch;

export type TransferStatus = "pending" | "accepted" | "rejected" | "in_transit";

export interface Transfer {
  id: string;
  assetId: string;
  assetName: string; // For display purposes
  assetType: "GrapeLot" | "WineBatch";
  fromUserId: string;
  fromRole: Role;
  toUserId: string;
  toRole: Role;
  status: TransferStatus;
  requestDate: string; // ISO Date string
  actionDate?: string; // ISO Date string
  quantity?: number; // Optional quantity for transfer
  transportistaId?: string;
  transportConditions?: string;
}

export interface WineTraceEvent {
  timestamp: string;
  event: string;
  actor: string;
  details?: string;
  assetId: string;
}
