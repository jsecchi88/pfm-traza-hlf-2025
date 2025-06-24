import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { Batch } from '../models/Batch';

@Info({ title: 'MinoristaContract', description: 'Contrato para gestión de operaciones del minorista' })
export class MinoristaContract extends Contract {
    
    // Confirmar recepción de lote de distribución
    @Transaction()
    @Returns('boolean')
    public async confirmarRecepcionLote(
        ctx: Context, 
        loteDistribucionId: string
    ): Promise<boolean> {
        const batchBuffer = await ctx.stub.getState(loteDistribucionId);
        if (!batchBuffer || batchBuffer.length === 0) {
            throw new Error(`El lote de distribución ${loteDistribucionId} no existe`);
        }
        
        const batch: Batch = JSON.parse(batchBuffer.toString());
        
        // Verificar que el lote está destinado a este minorista
        if (batch.Destination !== this.getClientId(ctx)) {
            throw new Error('No autorizado: este lote no está destinado a tu tienda');
        }
        
        // Actualizar propiedad del lote
        batch.Owner = this.getClientId(ctx);
        batch.Status = 'recibido';
        batch.Properties.fechaRecepcion = new Date().toISOString();
        
        // También actualizar todos los lotes incluidos
        for (const loteId of batch.Products) {
            const loteBuffer = await ctx.stub.getState(loteId);
            if (loteBuffer && loteBuffer.length > 0) {
                const lote: Asset = JSON.parse(loteBuffer.toString());
                
                lote.Owner = this.getClientId(ctx);
                lote.Status = 'en_minorista';
                lote.History.push({
                    timestamp: new Date().toISOString(),
                    action: 'RECEIVED_BY_RETAILER',
                    actor: this.getClientId(ctx)
                });
                
                await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
            }
        }
        
        await ctx.stub.putState(loteDistribucionId, Buffer.from(JSON.stringify(batch)));
        return true;
    }
    
    // Registrar disponibilidad de producto
    @Transaction()
    @Returns('boolean')
    public async registrarDisponibilidad(
        ctx: Context,
        loteId: string,
        unidadesDisponibles: string,
        ubicacionTienda: string,
        precioVenta: string,
        detalles: string // JSON con detalles
    ): Promise<boolean> {
        const loteBuffer = await ctx.stub.getState(loteId);
        if (!loteBuffer || loteBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }
        
        const lote: Asset = JSON.parse(loteBuffer.toString());
        
        // Verificar que el minorista es propietario del lote
        if (lote.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres propietario de este lote');
        }
        
        // Actualizar información de disponibilidad
        lote.Status = 'disponible';
        lote.Properties.disponibilidad = {
            unidades: parseInt(unidadesDisponibles),
            ubicacionTienda,
            precioVenta: parseFloat(precioVenta),
            fechaDisponibilidad: new Date().toISOString(),
            detalles: JSON.parse(detalles)
        };
        
        lote.History.push({
            timestamp: new Date().toISOString(),
            action: 'AVAILABLE_FOR_SALE',
            actor: this.getClientId(ctx),
            details: { unidades: parseInt(unidadesDisponibles) }
        });
        
        await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
        return true;
    }
    
    // Generar código QR para trazabilidad
    @Transaction()
    @Returns('string')
    public async generarCodigoQR(
        ctx: Context,
        loteId: string,
        unidadId: string
    ): Promise<string> {
        const loteBuffer = await ctx.stub.getState(loteId);
        if (!loteBuffer || loteBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }
        
        const lote: Asset = JSON.parse(loteBuffer.toString());
        
        // Verificar que el minorista es propietario del lote
        if (lote.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres propietario de este lote');
        }
        
        // Registrar unidad individual
        const unidadKey = `${loteId}_UNIT_${unidadId}`;
        const exists = await this.assetExists(ctx, unidadKey);
        
        if (!exists) {
            // Crear registro de unidad
            const unidad = new Asset();
            unidad.ID = unidadKey;
            unidad.Type = 'unidad';
            unidad.Owner = this.getClientId(ctx);
            unidad.Status = 'disponible';
            unidad.Properties = {
                loteId,
                unidadId,
                fechaGeneracion: new Date().toISOString()
            };
            unidad.History = [{
                timestamp: new Date().toISOString(),
                action: 'CREATED',
                actor: this.getClientId(ctx)
            }];
            
            await ctx.stub.putState(unidadKey, Buffer.from(JSON.stringify(unidad)));
        }
        
        // Generar datos para el QR
        const qrData = {
            productId: unidadKey,
            minoristaId: this.getClientId(ctx),
            loteId: loteId,
            timestamp: new Date().toISOString(),
            url: `https://trazabilidad.ejemplo.com/verificar/${unidadKey}`
        };
        
        return JSON.stringify(qrData);
    }
    
    // Confirmar venta (opcional)
    @Transaction()
    @Returns('boolean')
    public async registrarVenta(
        ctx: Context,
        unidadKey: string
    ): Promise<boolean> {
        const unidadBuffer = await ctx.stub.getState(unidadKey);
        if (!unidadBuffer || unidadBuffer.length === 0) {
            throw new Error(`La unidad ${unidadKey} no existe`);
        }
        
        const unidad: Asset = JSON.parse(unidadBuffer.toString());
        
        // Verificar que el minorista es propietario de la unidad
        if (unidad.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres propietario de esta unidad');
        }
        
        // Actualizar estado a vendido
        unidad.Status = 'vendido';
        unidad.Properties.fechaVenta = new Date().toISOString();
        unidad.History.push({
            timestamp: new Date().toISOString(),
            action: 'SOLD',
            actor: this.getClientId(ctx)
        });
        
        await ctx.stub.putState(unidadKey, Buffer.from(JSON.stringify(unidad)));
        
        // Actualizar contador de disponibilidad en el lote
        const loteId = unidad.Properties.loteId;
        const loteBuffer = await ctx.stub.getState(loteId);
        
        if (loteBuffer && loteBuffer.length > 0) {
            const lote: Asset = JSON.parse(loteBuffer.toString());
            if (lote.Properties.disponibilidad) {
                lote.Properties.disponibilidad.unidades -= 1;
                await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
            }
        }
        
        return true;
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
