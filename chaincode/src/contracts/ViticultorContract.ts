import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { Batch } from '../models/Batch';
import { CertificateInfo } from '../models/CertificateInfo';
import { TransportRecord } from '../models/TransportRecord';

@Info({ title: 'ViticultorContract', description: 'Contrato para gestión de operaciones del viticultor' })
export class ViticultorContract extends Contract {
    
    // Registrar información de cosecha
    @Transaction()
    @Returns('boolean')
    public async registrarCosecha(
        ctx: Context, 
        cosechaId: string, 
        parcelaId: string, 
        fecha: string, 
        variedadUva: string, 
        cantidadKg: string,
        propiedades: string // JSON con propiedades como acidez, azúcar, etc.
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, cosechaId);
        if (exists) {
            throw new Error(`La cosecha ${cosechaId} ya existe`);
        }

        const asset = new Asset();
        asset.ID = cosechaId;
        asset.Type = 'cosecha';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'registrado';
        asset.Properties = {
            parcelaId,
            fecha,
            variedadUva,
            cantidadKg: parseFloat(cantidadKg),
            propiedades: JSON.parse(propiedades)
        };
        asset.History = [{
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            actor: this.getClientId(ctx)
        }];

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(cosechaId, buffer);
        return true;
    }

    // Registrar información de la parcela
    @Transaction()
    @Returns('boolean')
    public async registrarParcela(
        ctx: Context,
        parcelaId: string,
        ubicacion: string,
        tamanoHectareas: string,
        tipoSuelo: string,
        certificaciones: string // JSON array con certificaciones
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, parcelaId);
        if (exists) {
            throw new Error(`La parcela ${parcelaId} ya existe`);
        }

        const asset = new Asset();
        asset.ID = parcelaId;
        asset.Type = 'parcela';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'activa';
        asset.Properties = {
            ubicacion: JSON.parse(ubicacion), // Coordenadas geográficas
            tamanoHectareas: parseFloat(tamanoHectareas),
            tipoSuelo,
            certificaciones: JSON.parse(certificaciones)
        };
        asset.History = [{
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            actor: this.getClientId(ctx)
        }];

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(parcelaId, buffer);
        return true;
    }

    // Registrar uso de insumos en parcela
    @Transaction()
    @Returns('boolean')
    public async registrarInsumo(
        ctx: Context,
        insumoId: string,
        parcelaId: string,
        tipo: string, // fertilizante, pesticida, etc.
        nombre: string, 
        cantidad: string,
        fechaAplicacion: string,
        detalles: string // JSON con detalles adicionales
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, insumoId);
        if (exists) {
            throw new Error(`El registro de insumo ${insumoId} ya existe`);
        }
        
        // Verificar que la parcela existe
        const parcelaExists = await this.assetExists(ctx, parcelaId);
        if (!parcelaExists) {
            throw new Error(`La parcela ${parcelaId} no existe`);
        }

        const asset = new Asset();
        asset.ID = insumoId;
        asset.Type = 'insumo';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'aplicado';
        asset.Properties = {
            parcelaId,
            tipo,
            nombre,
            cantidad: parseFloat(cantidad),
            fechaAplicacion,
            detalles: JSON.parse(detalles)
        };
        asset.History = [{
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            actor: this.getClientId(ctx)
        }];

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(insumoId, buffer);
        return true;
    }

    // Registrar transferencia de cosecha a bodega
    @Transaction()
    @Returns('boolean')
    public async transferirCosecha(
        ctx: Context,
        cosechaId: string,
        bodegaId: string
    ): Promise<boolean> {
        const assetBuffer = await ctx.stub.getState(cosechaId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`La cosecha ${cosechaId} no existe`);
        }

        const asset: Asset = JSON.parse(assetBuffer.toString());
        
        // Verificar que el cliente es el propietario de la cosecha
        if (asset.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el propietario de esta cosecha');
        }

        asset.Status = 'transferido';
        asset.Properties.destinationOwner = bodegaId;
        asset.History.push({
            timestamp: new Date().toISOString(),
            action: 'TRANSFERRED',
            actor: this.getClientId(ctx),
            details: { newOwner: bodegaId }
        });

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(cosechaId, buffer);
        return true;
    }

    // Métodos auxiliares
    private async assetExists(ctx: Context, id: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(id);
        return (!!buffer && buffer.length > 0);
    }

    private getClientId(ctx: Context): string {
        // Extrae el ID del certificado del cliente
        const clientIdentity = ctx.clientIdentity;
        const id = clientIdentity.getID();
        return id;
    }
}
