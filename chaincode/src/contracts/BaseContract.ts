import { Context, Contract } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { IdentityUtils } from '../utils/identityUtils';
import { TraceabilityUtils } from '../utils/traceabilityUtils';

/**
 * Contrato base con funcionalidades comunes para todos los contratos
 */
export class BaseContract extends Contract {
    /**
     * Comprueba si un activo existe
     */
    protected async assetExists(ctx: Context, id: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(id);
        return (!!buffer && buffer.length > 0);
    }
    
    /**
     * Obtiene el ID del cliente actual
     */
    protected getClientId(ctx: Context): string {
        return IdentityUtils.getFullClientId(ctx);
    }
    
    /**
     * Lee un activo del ledger
     */
    protected async readAsset(ctx: Context, id: string): Promise<Asset> {
        const buffer = await ctx.stub.getState(id);
        if (!buffer || buffer.length === 0) {
            throw new Error(`El activo ${id} no existe`);
        }
        
        const asset: Asset = JSON.parse(buffer.toString());
        return asset;
    }
    
    /**
     * Guarda un activo en el ledger
     */
    protected async writeAsset(ctx: Context, asset: Asset): Promise<void> {
        await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
    }
    
    /**
     * Crea un nuevo activo
     */
    protected async createAsset(ctx: Context, asset: Asset): Promise<Asset> {
        const exists = await this.assetExists(ctx, asset.ID);
        if (exists) {
            throw new Error(`El activo ${asset.ID} ya existe`);
        }
        
        await this.writeAsset(ctx, asset);
        return asset;
    }
    
    /**
     * Actualiza un activo existente
     */
    protected async updateAsset(ctx: Context, asset: Asset): Promise<Asset> {
        const exists = await this.assetExists(ctx, asset.ID);
        if (!exists) {
            throw new Error(`El activo ${asset.ID} no existe`);
        }
        
        await this.writeAsset(ctx, asset);
        return asset;
    }
    
    /**
     * Obtiene el historial completo de un activo
     */
    protected async getAssetHistory(ctx: Context, id: string): Promise<any[]> {
        return TraceabilityUtils.getAssetHistory(ctx, id);
    }
    
    /**
     * Busca activos por criterios
     */
    protected async queryAssets(ctx: Context, queryString: string): Promise<any[]> {
        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        const results = [];
        
        try {
            let result = await resultsIterator.next();
            while (!result.done) {
                if (result.value && result.value.value.toString()) {
                    const record = JSON.parse(result.value.value.toString());
                    results.push(record);
                }
                result = await resultsIterator.next();
            }
        } finally {
            await resultsIterator.close();
        }
        
        return results;
    }
}
