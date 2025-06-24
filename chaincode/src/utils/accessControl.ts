import { Context } from 'fabric-contract-api';
import { IdentityUtils } from './identityUtils';

/**
 * Clase para gestionar el control de acceso basado en roles
 */
export class AccessControl {
    // MSP IDs para cada tipo de organización
    static readonly VITICULTOR_MSP = 'ViticultorMSP';
    static readonly BODEGA_MSP = 'BodegaMSP';
    static readonly TRANSPORTISTA_MSP = 'TransportistaMSP';
    static readonly DISTRIBUIDOR_MSP = 'DistribuidorMSP';
    static readonly MINORISTA_MSP = 'MinoristaMSP';
    static readonly REGULADOR_MSP = 'ReguladorMSP';
    
    /**
     * Verifica si el cliente es un viticultor
     */
    static isViticultor(ctx: Context): boolean {
        return IdentityUtils.isFromOrg(ctx, this.VITICULTOR_MSP);
    }
    
    /**
     * Verifica si el cliente es una bodega
     */
    static isBodega(ctx: Context): boolean {
        return IdentityUtils.isFromOrg(ctx, this.BODEGA_MSP);
    }
    
    /**
     * Verifica si el cliente es un transportista
     */
    static isTransportista(ctx: Context): boolean {
        return IdentityUtils.isFromOrg(ctx, this.TRANSPORTISTA_MSP);
    }
    
    /**
     * Verifica si el cliente es un distribuidor
     */
    static isDistribuidor(ctx: Context): boolean {
        return IdentityUtils.isFromOrg(ctx, this.DISTRIBUIDOR_MSP);
    }
    
    /**
     * Verifica si el cliente es un minorista
     */
    static isMinorista(ctx: Context): boolean {
        return IdentityUtils.isFromOrg(ctx, this.MINORISTA_MSP);
    }
    
    /**
     * Verifica si el cliente es un regulador/certificador
     */
    static isRegulador(ctx: Context): boolean {
        return IdentityUtils.isFromOrg(ctx, this.REGULADOR_MSP);
    }
    
    /**
     * Valida que el cliente sea un viticultor, de lo contrario lanza error
     */
    static enforceViticultor(ctx: Context): void {
        if (!this.isViticultor(ctx)) {
            throw new Error('No autorizado: se requieren permisos de Viticultor para esta operación');
        }
    }
    
    /**
     * Valida que el cliente sea una bodega, de lo contrario lanza error
     */
    static enforceBodega(ctx: Context): void {
        if (!this.isBodega(ctx)) {
            throw new Error('No autorizado: se requieren permisos de Bodega para esta operación');
        }
    }
    
    /**
     * Valida que el cliente sea un transportista, de lo contrario lanza error
     */
    static enforceTransportista(ctx: Context): void {
        if (!this.isTransportista(ctx)) {
            throw new Error('No autorizado: se requieren permisos de Transportista para esta operación');
        }
    }
    
    /**
     * Valida que el cliente sea un distribuidor, de lo contrario lanza error
     */
    static enforceDistribuidor(ctx: Context): void {
        if (!this.isDistribuidor(ctx)) {
            throw new Error('No autorizado: se requieren permisos de Distribuidor para esta operación');
        }
    }
    
    /**
     * Valida que el cliente sea un minorista, de lo contrario lanza error
     */
    static enforceMinorista(ctx: Context): void {
        if (!this.isMinorista(ctx)) {
            throw new Error('No autorizado: se requieren permisos de Minorista para esta operación');
        }
    }
    
    /**
     * Valida que el cliente sea un regulador, de lo contrario lanza error
     */
    static enforceRegulador(ctx: Context): void {
        if (!this.isRegulador(ctx)) {
            throw new Error('No autorizado: se requieren permisos de Regulador para esta operación');
        }
    }
    
    /**
     * Valida que el cliente sea el propietario del activo
     * @param ctx Contexto de la transacción
     * @param ownerID ID del propietario del activo
     */
    static enforceOwner(ctx: Context, ownerID: string): void {
        const clientID = IdentityUtils.getFullClientId(ctx);
        if (ownerID !== clientID) {
            throw new Error('No autorizado: no eres el propietario de este activo');
        }
    }
}
