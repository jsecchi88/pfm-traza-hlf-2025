import { Context } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { Batch } from '../models/Batch';
import { TraceabilityUtils } from './traceabilityUtils';
import { AccessControl } from './accessControl';
import { IdentityUtils } from './identityUtils';

/**
 * Clase para gestionar transferencias de activos entre actores
 */
export class TransferUtils {
    /**
     * Transfiere un activo a un nuevo propietario
     * @param ctx Contexto de la transacción
     * @param assetId ID del activo a transferir
     * @param newOwner ID del nuevo propietario
     * @param details Detalles adicionales de la transferencia
     */
    static async transferAsset(ctx: Context, assetId: string, newOwner: string, details?: any): Promise<Asset> {
        const assetBuffer = await ctx.stub.getState(assetId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`El activo ${assetId} no existe`);
        }
        
        const asset: Asset = JSON.parse(assetBuffer.toString());
        
        // Verificar que el usuario actual es el propietario
        const clientId = IdentityUtils.getFullClientId(ctx);
        if (asset.Owner !== clientId) {
            throw new Error(`No estás autorizado para transferir este activo. Solo el propietario puede hacerlo.`);
        }
        
        // Actualizar propietario
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        asset.Status = 'transferido';
        
        // Registrar en historial
        TraceabilityUtils.addHistoryEntry(
            asset, 
            'TRANSFERRED', 
            clientId, 
            { from: oldOwner, to: newOwner, ...details }
        );
        
        await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
        return asset;
    }
    
    /**
     * Crea un registro de envío para transferir un lote entre organizaciones
     * @param ctx Contexto de la transacción
     * @param shipmentId ID del envío a crear
     * @param assetIds IDs de los activos a enviar
     * @param targetOrg Organización de destino
     * @param transporterOrg Organización transportista
     * @param details Detalles adicionales del envío
     */
    static async createShipment(
        ctx: Context,
        shipmentId: string,
        assetIds: string[],
        targetOrg: string,
        transporterOrg: string,
        details?: any
    ): Promise<Batch> {
        // Verificar que el envío no existe
        const exists = await ctx.stub.getState(shipmentId);
        if (exists && exists.length > 0) {
            throw new Error(`El envío ${shipmentId} ya existe`);
        }
        
        // Verificar que todos los activos existan y pertenezcan al remitente
        const clientId = IdentityUtils.getFullClientId(ctx);
        for (const assetId of assetIds) {
            const assetBuffer = await ctx.stub.getState(assetId);
            if (!assetBuffer || assetBuffer.length === 0) {
                throw new Error(`El activo ${assetId} no existe`);
            }
            
            const asset: Asset = JSON.parse(assetBuffer.toString());
            if (asset.Owner !== clientId) {
                throw new Error(`No eres el propietario del activo ${assetId}`);
            }
            
            // Marcar el activo como "en proceso de envío"
            asset.Status = 'en_envio';
            TraceabilityUtils.addHistoryEntry(
                asset,
                'SHIPMENT_REQUESTED',
                clientId,
                { shipmentId }
            );
            
            await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
        }
        
        // Crear envío
        const shipment = new Batch();
        shipment.ID = shipmentId;
        shipment.Type = 'envio';
        shipment.Products = assetIds;
        shipment.CreationDate = new Date().toISOString();
        shipment.Status = 'created';
        shipment.Owner = clientId;
        shipment.SourceOrg = IdentityUtils.getClientMSPID(ctx);
        shipment.TargetOrg = targetOrg;
        shipment.TransporterOrg = transporterOrg;
        shipment.Properties = details || {};
        
        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        return shipment;
    }
    
    /**
     * Acepta un envío recibido
     * @param ctx Contexto de la transacción
     * @param shipmentId ID del envío a aceptar
     */
    static async acceptShipment(ctx: Context, shipmentId: string): Promise<Batch> {
        const shipmentBuffer = await ctx.stub.getState(shipmentId);
        if (!shipmentBuffer || shipmentBuffer.length === 0) {
            throw new Error(`El envío ${shipmentId} no existe`);
        }
        
        const shipment: Batch = JSON.parse(shipmentBuffer.toString());
        
        // Verificar que el usuario actual es el destinatario
        const clientMSPID = IdentityUtils.getClientMSPID(ctx);
        if (shipment.TargetOrg !== clientMSPID) {
            throw new Error(`No estás autorizado para aceptar este envío. Solo el destinatario puede hacerlo.`);
        }
        
        // Verificar que el envío fue entregado
        if (shipment.Status !== 'delivered') {
            throw new Error(`El envío ${shipmentId} no está en estado "entregado"`);
        }
        
        // Actualizar estado del envío
        shipment.Status = 'received';
        shipment.Properties.receivedAt = new Date().toISOString();
        shipment.Properties.receivedBy = IdentityUtils.getFullClientId(ctx);
        
        // Transferir propiedad de los activos
        for (const assetId of shipment.Products) {
            const assetBuffer = await ctx.stub.getState(assetId);
            if (assetBuffer && assetBuffer.length > 0) {
                const asset: Asset = JSON.parse(assetBuffer.toString());
                
                asset.Owner = IdentityUtils.getFullClientId(ctx);
                asset.Status = 'recibido';
                
                TraceabilityUtils.addHistoryEntry(
                    asset,
                    'SHIPMENT_RECEIVED',
                    IdentityUtils.getFullClientId(ctx),
                    { shipmentId }
                );
                
                await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
            }
        }
        
        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        return shipment;
    }
}
