import { Context, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { Batch } from '../models/Batch';
import { CertificateInfo } from '../models/CertificateInfo';
import { TransportRecord } from '../models/TransportRecord';
import { BaseContract } from './BaseContract';
import { AccessControl } from '../utils/accessControl';
import { TraceabilityUtils } from '../utils/traceabilityUtils';
import { TransferUtils } from '../utils/transferUtils';

@Info({ title: 'ViticultorContract', description: 'Contrato para gestión de operaciones del viticultor: registro de cosechas y transferencias exclusivamente a bodegas' })
export class ViticultorContract extends BaseContract {
    
    /**
     * Registrar información de cosecha - Punto de entrada principal de las cosechas al sistema
     * Los viticultores son los responsables del registro inicial de las cosechas
     * Documenta fecha, variedad de uva, cantidad en kg o toneladas y propiedades específicas
     */
    @Transaction()
    @Returns('boolean')
    public async registrarCosecha(
        ctx: Context, 
        cosechaId: string, 
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

        // Verificar formato de datos
        try {
            const props = JSON.parse(propiedades);
            const cantidad = parseFloat(cantidadKg);
            
            if (isNaN(cantidad) || cantidad <= 0) {
                throw new Error('La cantidad debe ser un número positivo');
            }
            
            // Verificar que la fecha tenga un formato válido
            if (isNaN(Date.parse(fecha))) {
                throw new Error('La fecha proporcionada no tiene un formato válido');
            }
        } catch (error: any) {
            if (error.message.includes('JSON')) {
                throw new Error('El formato de las propiedades no es un JSON válido');
            }
            throw error;
        }

        const asset = new Asset();
        asset.ID = cosechaId;
        asset.Type = 'cosecha';
        asset.Owner = this.getClientId(ctx);
        asset.Status = 'registrado';
        asset.Properties = {
            fecha,
            variedadUva,
            cantidadKg: parseFloat(cantidadKg),
            propiedades: JSON.parse(propiedades),
            unidad: parseFloat(cantidadKg) >= 1000 ? 'toneladas' : 'kg'
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
        
        // Leer el activo primero para verificar que es una cosecha
        const asset = await this.readAsset(ctx, cosechaId);
        if (asset.Type !== 'cosecha') {
            throw new Error(`El activo ${cosechaId} no es una cosecha`);
        }
        
        // Verificar que el destinatario sea una bodega
        if (!destinatarioId.startsWith(AccessControl.BODEGA_MSP)) {
            throw new Error('Las cosechas solo pueden ser transferidas a bodegas');
        }
        
        // Transferir el activo usando la utilidad centralizada
        try {
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

    /**
     * Consultar las cosechas registradas por el viticultor actual
     * Permite al viticultor ver sus propias cosechas para gestionarlas
     */
    @Transaction(false)
    @Returns('string')
    public async consultarMisCosechas(ctx: Context): Promise<string> {
        // Verificar permisos del viticultor
        AccessControl.enforceViticultor(ctx);
        
        // Obtener ID del cliente actual
        const clientId = this.getClientId(ctx);
        
        // Consultar cosechas que pertenezcan al viticultor
        const query = {
            selector: {
                Type: 'cosecha',
                Owner: clientId
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = await this.getAllResults(iterator);
        
        return JSON.stringify(results);
    }
    
    // Método auxiliar para procesar resultados del iterator
    private async getAllResults(iterator: any): Promise<any[]> {
        const allResults = [];
        let res = await iterator.next();
        
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes;
                try {
                    jsonRes = JSON.parse(res.value.value.toString());
                } catch (err) {
                    jsonRes = res.value.value.toString();
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        
        await iterator.close();
        return allResults;
    }

    // La funcionalidad auxiliar ahora está en BaseContract
}
