import { Context, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { Batch } from '../models/Batch';
import { CertificateInfo } from '../models/CertificateInfo';
import { TransportRecord } from '../models/TransportRecord';
import { BaseContract } from './BaseContract';
import { AccessControl } from '../utils/accessControl';
import { TraceabilityUtils } from '../utils/traceabilityUtils';
import { TransferUtils } from '../utils/transferUtils';

@Info({ title: 'ViticultorContract', description: 'Contrato para gestión de operaciones del viticultor' })
export class ViticultorContract extends BaseContract {
    
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
        // Verificar permisos del viticultor
        AccessControl.enforceViticultor(ctx);
        
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
        superficie: string,
        variedades: string, // JSON array con las variedades plantadas
        propiedades: string // JSON con propiedades como tipo suelo, altitud, etc.
    ): Promise<boolean> {
        // Verificar permisos del viticultor
        AccessControl.enforceViticultor(ctx);
        
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
            superficie: parseFloat(superficie),
            variedades: JSON.parse(variedades),
            propiedades: JSON.parse(propiedades)
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
        // Verificar permisos del viticultor
        AccessControl.enforceViticultor(ctx);
        
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
        destinatarioId: string
    ): Promise<boolean> {
        // Verificar permisos del viticultor
        AccessControl.enforceViticultor(ctx);
        
        // Usar la utilidad de transferencia que ya implementa todas las verificaciones
        try {
            // Leer el activo primero para verificar que es una cosecha
            const asset = await this.readAsset(ctx, cosechaId);
            if (asset.Type !== 'cosecha') {
                throw new Error(`El activo ${cosechaId} no es una cosecha`);
            }
            
            // Transferir el activo usando la utilidad centralizada
            await TransferUtils.transferAsset(ctx, cosechaId, destinatarioId, {
                type: 'transferencia_cosecha'
            });
            return true;
        } catch (error: any) {
            throw new Error(`Error al transferir cosecha: ${error.message || error}`);
        }
    }

    // Registrar análisis de cosecha
    @Transaction()
    @Returns('boolean')
    public async registrarAnalisisCosecha(
        ctx: Context,
        cosechaId: string,
        resultados: string // JSON con resultados del análisis
    ): Promise<boolean> {
        // Verificar permisos del viticultor
        AccessControl.enforceViticultor(ctx);
        
        // Verificar que la cosecha existe
        const cosechaExists = await this.assetExists(ctx, cosechaId);
        if (!cosechaExists) {
            throw new Error(`La cosecha ${cosechaId} no existe`);
        }

        const cosechaBuffer = await ctx.stub.getState(cosechaId);
        const cosecha: Asset = JSON.parse(cosechaBuffer.toString());

        // Verificar que el cliente es el propietario de la cosecha
        if (cosecha.Owner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el propietario de esta cosecha');
        }

        // Actualizar propiedades de la cosecha con los resultados del análisis
        cosecha.Properties.resultadosAnalisis = JSON.parse(resultados);
        cosecha.Status = 'analizada';
        cosecha.History.push({
            timestamp: new Date().toISOString(),
            action: 'ANALYZED',
            actor: this.getClientId(ctx),
            details: { resultados }
        });

        const buffer = Buffer.from(JSON.stringify(cosecha));
        await ctx.stub.putState(cosechaId, buffer);
        return true;
    }

    // La funcionalidad auxiliar ahora está en BaseContract
}
