import { Context } from 'fabric-contract-api';
import { Asset, HistoryEntry } from '../models/Asset';

/**
 * Clase para gestionar la trazabilidad de activos
 */
export class TraceabilityUtils {
    /**
     * Obtiene el historial completo de un activo
     * @param ctx Contexto de la transacción
     * @param assetId ID del activo
     */
    static async getAssetHistory(ctx: Context, assetId: string): Promise<any[]> {
        const historyIterator = await ctx.stub.getHistoryForKey(assetId);
        const results = [];
        
        try {
            let result = await historyIterator.next();
            while (!result.done) {
                if (result.value && result.value.value.toString()) {
                    const obj = {
                        txId: result.value.txId,
                        timestamp: result.value.timestamp,
                        value: JSON.parse(result.value.value.toString())
                    };
                    results.push(obj);
                }
                result = await historyIterator.next();
            }
        } finally {
            await historyIterator.close();
        }
        
        return results;
    }
    
    /**
     * Registra una acción en el historial de un activo
     * @param asset Activo a actualizar
     * @param action Tipo de acción
     * @param actor ID de quien realiza la acción
     * @param details Detalles adicionales
     */
    static addHistoryEntry(asset: Asset, action: string, actor: string, details?: any): void {
        const entry: HistoryEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            actor: actor,
            details: details || {}
        };
        
        asset.History.push(entry);
    }
    
    /**
     * Busca activos relacionados con un activo específico
     * @param ctx Contexto de la transacción
     * @param relationField Campo de relación a buscar
     * @param assetId ID del activo de referencia
     */
    static async findRelatedAssets(ctx: Context, relationField: string, assetId: string): Promise<any[]> {
        const query = {
            selector: {
                [`Properties.${relationField}`]: assetId
            }
        };
        
        const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const assets = [];
        
        try {
            let result = await resultsIterator.next();
            while (!result.done) {
                if (result.value && result.value.value.toString()) {
                    const asset = JSON.parse(result.value.value.toString());
                    assets.push(asset);
                }
                result = await resultsIterator.next();
            }
        } finally {
            await resultsIterator.close();
        }
        
        return assets;
    }
    
    /**
     * Construye el árbol de trazabilidad completo para un producto
     * @param ctx Contexto de la transacción
     * @param productId ID del producto final
     */
    static async buildTraceabilityTree(ctx: Context, productId: string): Promise<any> {
        const assetBuffer = await ctx.stub.getState(productId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`El activo ${productId} no existe`);
        }
        
        const asset: Asset = JSON.parse(assetBuffer.toString());
        const result: any = {
            asset: asset,
            history: await this.getAssetHistory(ctx, productId),
            relatedAssets: {}
        };
        
        // Si es un producto terminado, buscar materias primas utilizadas
        if (asset.Type === 'vino' && asset.Properties.cosechaIds) {
            result.relatedAssets.materiasPrimas = [];
            
            for (const cosechaId of asset.Properties.cosechaIds) {
                const cosechaBuffer = await ctx.stub.getState(cosechaId);
                if (cosechaBuffer && cosechaBuffer.length > 0) {
                    const cosecha = JSON.parse(cosechaBuffer.toString());
                    result.relatedAssets.materiasPrimas.push(cosecha);
                }
            }
        }
        
        // Buscar registros de transporte relacionados
        if (['lote', 'vino'].includes(asset.Type)) {
            const transportes = await this.findRelatedAssets(ctx, 'assetId', productId);
            if (transportes.length > 0) {
                result.relatedAssets.transportes = transportes;
            }
        }
        
        // Buscar certificados relacionados
        if (asset.Properties.certificados) {
            result.relatedAssets.certificados = [];
            
            for (const certId of asset.Properties.certificados) {
                const certBuffer = await ctx.stub.getState(certId);
                if (certBuffer && certBuffer.length > 0) {
                    const certificado = JSON.parse(certBuffer.toString());
                    result.relatedAssets.certificados.push(certificado);
                }
            }
        }
        
        return result;
    }
}
