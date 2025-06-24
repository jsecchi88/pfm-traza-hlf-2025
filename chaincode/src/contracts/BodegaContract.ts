import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';

@Info({ title: 'BodegaContract', description: 'Contrato para gestión de operaciones de la bodega' })
export class BodegaContract extends Contract {
    
    // Registrar recepción de cosecha
    @Transaction()
    @Returns('boolean')
    public async recibirCosecha(
        ctx: Context, 
        cosechaId: string
    ): Promise<boolean> {
        const assetBuffer = await ctx.stub.getState(cosechaId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`La cosecha ${cosechaId} no existe`);
        }

        const asset: Asset = JSON.parse(assetBuffer.toString());
        
        // Verificar que la cosecha está destinada a esta bodega
        if (asset.Properties.destinationOwner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: esta cosecha no está destinada a tu bodega');
        }

        // Actualizar propietario y estado
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'recibido';
        asset.History.push({
            timestamp: new Date().toISOString(),
            action: 'RECEIVED',
            actor: this.getClientId(ctx)
        });

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(cosechaId, buffer);
        return true;
    }

    // Registrar proceso de elaboración de vino
    @Transaction()
    @Returns('boolean')
    public async iniciarElaboracion(
        ctx: Context, 
        vinoId: string, 
        cosechaIds: string,
        tipoVino: string,
        metodoElaboracion: string,
        detalles: string // JSON con detalles específicos
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, vinoId);
        if (exists) {
            throw new Error(`El vino con ID ${vinoId} ya existe`);
        }
        
        const cosechasArray = JSON.parse(cosechaIds);
        
        // Verificar existencia de todas las cosechas y pertenencia a la bodega
        for (const cosechaId of cosechasArray) {
            const cosechaBuffer = await ctx.stub.getState(cosechaId);
            if (!cosechaBuffer || cosechaBuffer.length === 0) {
                throw new Error(`La cosecha ${cosechaId} no existe`);
            }
            
            const cosecha: Asset = JSON.parse(cosechaBuffer.toString());
            if (cosecha.Owner !== this.getClientId(ctx)) {
                throw new Error(`No eres propietario de la cosecha ${cosechaId}`);
            }
            
            // Marcar la cosecha como en proceso
            cosecha.Status = 'en_proceso';
            cosecha.History.push({
                timestamp: new Date().toISOString(),
                action: 'IN_PROCESSING',
                actor: this.getClientId(ctx),
                details: { vinoId }
            });
            
            await ctx.stub.putState(cosechaId, Buffer.from(JSON.stringify(cosecha)));
        }
        
        // Crear nuevo activo de tipo vino
        const asset = new Asset();
        asset.ID = vinoId;
        asset.Type = 'vino';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'en_elaboracion';
        asset.Properties = {
            cosechaIds: cosechasArray,
            tipoVino,
            metodoElaboracion,
            fechaInicio: new Date().toISOString(),
            detalles: JSON.parse(detalles)
        };
        asset.History = [{
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            actor: this.getClientId(ctx)
        }];

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(vinoId, buffer);
        return true;
    }
    
    // Registrar análisis químico
    @Transaction()
    @Returns('boolean')
    public async registrarAnalisis(
        ctx: Context,
        analisisId: string,
        vinoId: string,
        tipoAnalisis: string,
        fechaAnalisis: string,
        resultados: string // JSON con resultados
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, analisisId);
        if (exists) {
            throw new Error(`El análisis ${analisisId} ya existe`);
        }
        
        // Verificar que el vino existe y pertenece a la bodega
        const vinoBuffer = await ctx.stub.getState(vinoId);
        if (!vinoBuffer || vinoBuffer.length === 0) {
            throw new Error(`El vino ${vinoId} no existe`);
        }
        
        const vino: Asset = JSON.parse(vinoBuffer.toString());
        if (vino.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres propietario de este vino');
        }
        
        // Crear activo de tipo análisis
        const asset = new Asset();
        asset.ID = analisisId;
        asset.Type = 'analisis';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'completado';
        asset.Properties = {
            vinoId,
            tipoAnalisis,
            fechaAnalisis,
            resultados: JSON.parse(resultados)
        };
        asset.History = [{
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            actor: this.getClientId(ctx)
        }];
        
        // Actualizar vino con referencia al análisis
        vino.Properties.analisis = vino.Properties.analisis || [];
        vino.Properties.analisis.push(analisisId);
        vino.History.push({
            timestamp: new Date().toISOString(),
            action: 'ANALYSIS_ADDED',
            actor: this.getClientId(ctx),
            details: { analisisId }
        });
        
        await ctx.stub.putState(analisisId, Buffer.from(JSON.stringify(asset)));
        await ctx.stub.putState(vinoId, Buffer.from(JSON.stringify(vino)));
        return true;
    }
    
    // Registrar embotellado
    @Transaction()
    @Returns('boolean')
    public async registrarEmbotellado(
        ctx: Context,
        loteId: string,
        vinoId: string,
        cantidadBotellas: string,
        fechaEmbotellado: string,
        detalles: string // JSON con detalles
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, loteId);
        if (exists) {
            throw new Error(`El lote ${loteId} ya existe`);
        }
        
        // Verificar que el vino existe y pertenece a la bodega
        const vinoBuffer = await ctx.stub.getState(vinoId);
        if (!vinoBuffer || vinoBuffer.length === 0) {
            throw new Error(`El vino ${vinoId} no existe`);
        }
        
        const vino: Asset = JSON.parse(vinoBuffer.toString());
        if (vino.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres propietario de este vino');
        }
        
        // Crear activo de tipo lote
        const asset = new Asset();
        asset.ID = loteId;
        asset.Type = 'lote';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'embotellado';
        asset.Properties = {
            vinoId,
            cantidadBotellas: parseInt(cantidadBotellas),
            fechaEmbotellado,
            detalles: JSON.parse(detalles)
        };
        asset.History = [{
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            actor: this.getClientId(ctx)
        }];
        
        // Actualizar estado del vino
        vino.Status = 'embotellado';
        vino.Properties.loteId = loteId;
        vino.History.push({
            timestamp: new Date().toISOString(),
            action: 'BOTTLED',
            actor: this.getClientId(ctx),
            details: { loteId }
        });
        
        await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(asset)));
        await ctx.stub.putState(vinoId, Buffer.from(JSON.stringify(vino)));
        return true;
    }
    
    // Transferir lote a distribuidor o transportista
    @Transaction()
    @Returns('boolean')
    public async transferirLote(
        ctx: Context,
        loteId: string,
        destinatarioId: string
    ): Promise<boolean> {
        const assetBuffer = await ctx.stub.getState(loteId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }

        const asset: Asset = JSON.parse(assetBuffer.toString());
        
        // Verificar que el cliente es el propietario del lote
        if (asset.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el propietario de este lote');
        }

        asset.Status = 'transferido';
        asset.Properties.destinationOwner = destinatarioId;
        asset.History.push({
            timestamp: new Date().toISOString(),
            action: 'TRANSFERRED',
            actor: this.getClientId(ctx),
            details: { newOwner: destinatarioId }
        });

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(loteId, buffer);
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
