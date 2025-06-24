import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { Batch } from '../models/Batch';

@Info({ title: 'DistribuidorContract', description: 'Contrato para gestión de operaciones del distribuidor' })
export class DistribuidorContract extends Contract {
    
    // Confirmar recepción de lote
    @Transaction()
    @Returns('boolean')
    public async confirmarRecepcion(
        ctx: Context, 
        loteId: string
    ): Promise<boolean> {
        const loteBuffer = await ctx.stub.getState(loteId);
        if (!loteBuffer || loteBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }
        
        const lote: Asset = JSON.parse(loteBuffer.toString());
        
        // Verificar que el lote está destinado a este distribuidor
        if (lote.Properties.destinationOwner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: este lote no está destinado a tu distribuidora');
        }
        
        // Actualizar propiedad del lote
        lote.Owner = this.getClientId(ctx);
        lote.Status = 'recibido';
        lote.History.push({
            timestamp: new Date().toISOString(),
            action: 'RECEIVED',
            actor: this.getClientId(ctx)
        });
        
        await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
        return true;
    }
    
    // Crear un lote de distribución (agrupación de productos)
    @Transaction()
    @Returns('boolean')
    public async crearLoteDistribucion(
        ctx: Context,
        loteDistribucionId: string,
        loteIds: string, // Array JSON de IDs de lotes
        destino: string,
        fechaCreacion: string,
        detalles: string // JSON con detalles
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, loteDistribucionId);
        if (exists) {
            throw new Error(`El lote de distribución ${loteDistribucionId} ya existe`);
        }
        
        const lotesArray = JSON.parse(loteIds);
        
        // Verificar propiedad de todos los lotes incluidos
        for (const loteId of lotesArray) {
            const loteBuffer = await ctx.stub.getState(loteId);
            if (!loteBuffer || loteBuffer.length === 0) {
                throw new Error(`El lote ${loteId} no existe`);
            }
            
            const lote: Asset = JSON.parse(loteBuffer.toString());
            if (lote.Owner !== this.getClientId(ctx)) {
                throw new Error(`No eres propietario del lote ${loteId}`);
            }
            
            // Actualizar el lote para reflejar que está en un lote de distribución
            lote.Status = 'en_lote_distribucion';
            lote.Properties.loteDistribucionId = loteDistribucionId;
            lote.History.push({
                timestamp: new Date().toISOString(),
                action: 'ADDED_TO_DISTRIBUTION',
                actor: this.getClientId(ctx),
                details: { loteDistribucionId }
            });
            
            await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
        }
        
        // Crear el nuevo lote de distribución
        const batch = new Batch();
        batch.ID = loteDistribucionId;
        batch.Products = lotesArray;
        batch.CreationDate = fechaCreacion;
        batch.Status = 'creado';
        batch.Owner = this.getClientId(ctx);
        batch.Destination = destino;
        batch.Properties = JSON.parse(detalles);
        
        await ctx.stub.putState(loteDistribucionId, Buffer.from(JSON.stringify(batch)));
        return true;
    }
    
    // Transferir lote de distribución a minorista
    @Transaction()
    @Returns('boolean')
    public async transferirLoteDistribucion(
        ctx: Context,
        loteDistribucionId: string,
        minoristaId: string,
        fechaTransferencia: string
    ): Promise<boolean> {
        const batchBuffer = await ctx.stub.getState(loteDistribucionId);
        if (!batchBuffer || batchBuffer.length === 0) {
            throw new Error(`El lote de distribución ${loteDistribucionId} no existe`);
        }
        
        const batch: Batch = JSON.parse(batchBuffer.toString());
        
        // Verificar que el distribuidor es propietario del lote
        if (batch.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres propietario de este lote de distribución');
        }
        
        // Actualizar el lote de distribución
        batch.Status = 'transferido';
        batch.Destination = minoristaId;
        batch.Properties.fechaTransferencia = fechaTransferencia;
        
        // También actualizar todos los lotes incluidos
        for (const loteId of batch.Products) {
            const loteBuffer = await ctx.stub.getState(loteId);
            if (loteBuffer && loteBuffer.length > 0) {
                const lote: Asset = JSON.parse(loteBuffer.toString());
                
                lote.Properties.destinationOwner = minoristaId;
                lote.Status = 'transferido';
                lote.History.push({
                    timestamp: new Date().toISOString(),
                    action: 'TRANSFERRED',
                    actor: this.getClientId(ctx),
                    details: { destinatario: minoristaId }
                });
                
                await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
            }
        }
        
        await ctx.stub.putState(loteDistribucionId, Buffer.from(JSON.stringify(batch)));
        return true;
    }
    
    // Consultar estado de lote
    @Transaction(false) // Solo lectura
    @Returns('string')
    public async consultarEstadoLote(
        ctx: Context,
        loteId: string
    ): Promise<string> {
        const loteBuffer = await ctx.stub.getState(loteId);
        if (!loteBuffer || loteBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }
        
        // Verificar que el cliente es propietario o destinatario
        const lote: Asset = JSON.parse(loteBuffer.toString());
        const clientId = this.getClientId(ctx);
        
        if (lote.Owner !== clientId && lote.Properties.destinationOwner !== clientId) {
            throw new Error('No autorizado: no tienes permisos para ver este lote');
        }
        
        return loteBuffer.toString();
    }
    
    // Métodos auxiliares
    private async assetExists(ctx: Context, id: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(id);
        return (!!buffer && buffer.length > 0);
    }

    private getClientId(ctx: Context): string {
        const clientIdentity = ctx.clientIdentity;
        const id = clientIdentity.getID();
        return id;
    }
}
