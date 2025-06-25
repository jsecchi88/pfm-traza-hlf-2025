export interface HistoryEntry {
    timestamp: string;
    action: string; // CREATED, UPDATED, TRANSFERRED, CERTIFIED, etc.
    actor: string; // ID de quien realiza la acción
    details?: any; // Detalles adicionales específicos de la acción
}

export interface Asset {
    ID: string;
    Type: string; // cosecha, parcela, insumo, vino, lote, etc.
    Owner: string; // ID del propietario actual
    Status: string; // registrado, activo, transferido, en_proceso, terminado, etc.
    Properties: any; // Propiedades específicas del activo
    History: HistoryEntry[];
}
