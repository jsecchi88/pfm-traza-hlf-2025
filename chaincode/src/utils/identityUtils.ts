import { Context } from 'fabric-contract-api';

/**
 * Utilidades para gestión de identidad en Hyperledger Fabric
 */
export class IdentityUtils {
    /**
     * Obtiene el ID completo del cliente a partir del certificado X.509
     */
    public static getFullClientId(ctx: Context): string {
        return ctx.clientIdentity.getID();
    }
    
    /**
     * Obtiene el nombre del MSP al que pertenece el cliente
     */
    public static getClientMSPID(ctx: Context): string {
        return ctx.clientIdentity.getMSPID();
    }
    
    /**
     * Verifica si el cliente tiene un rol específico
     * @param ctx Contexto de la transacción
     * @param role Rol a verificar
     */
    public static hasRole(ctx: Context, role: string): boolean {
        const attrValue = ctx.clientIdentity.getAttributeValue(role);
        return attrValue === 'true';
    }
    
    /**
     * Obtiene un atributo específico del certificado del cliente
     * @param ctx Contexto de la transacción
     * @param attrName Nombre del atributo
     */
    public static getAttribute(ctx: Context, attrName: string): string | null {
        return ctx.clientIdentity.getAttributeValue(attrName);
    }
    
    /**
     * Verifica si el cliente pertenece a una organización específica
     * @param ctx Contexto de la transacción
     * @param orgMspId MSP ID de la organización a verificar
     */
    public static isFromOrg(ctx: Context, orgMspId: string): boolean {
        return ctx.clientIdentity.getMSPID() === orgMspId;
    }
    
    /**
     * Valida si el cliente tiene permiso para una operación específica
     * @param ctx Contexto de la transacción
     * @param requiredMspIds Lista de MSP IDs autorizados
     * @param requiredRole Rol requerido (opcional)
     */
    public static validateIdentity(ctx: Context, requiredMspIds: string[], requiredRole?: string): boolean {
        const clientMspId = ctx.clientIdentity.getMSPID();
        
        // Verificar si el cliente pertenece a una organización autorizada
        const isFromAuthorizedOrg = requiredMspIds.includes(clientMspId);
        
        // Si no se requiere un rol específico, basta con pertenecer a una organización autorizada
        if (!requiredRole) {
            return isFromAuthorizedOrg;
        }
        
        // Si se requiere un rol específico, verificar que lo tenga
        const hasRequiredRole = this.hasRole(ctx, requiredRole);
        
        return isFromAuthorizedOrg && hasRequiredRole;
    }
}
