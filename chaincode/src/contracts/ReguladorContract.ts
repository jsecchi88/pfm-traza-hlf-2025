import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { CertificateInfo } from '../models/CertificateInfo';

@Info({ title: 'ReguladorContract', description: 'Contrato para gestión de operaciones del regulador o certificador' })
export class ReguladorContract extends Contract {
    
    // Emitir certificado
    @Transaction()
    @Returns('boolean')
    public async emitirCertificado(
        ctx: Context, 
        certificadoId: string,
        assetId: string,
        tipoCertificado: string, // DO, calidad, orgánico, etc.
        fechaEmision: string,
        fechaExpiracion: string,
        detalles: string // JSON con detalles específicos
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, certificadoId);
        if (exists) {
            throw new Error(`El certificado ${certificadoId} ya existe`);
        }
        
        // Verificar que el activo existe
        const assetBuffer = await ctx.stub.getState(assetId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`El activo ${assetId} no existe`);
        }
        
        const asset: Asset = JSON.parse(assetBuffer.toString());
        
        // Crear certificado
        const certificado = new CertificateInfo();
        certificado.ID = certificadoId;
        certificado.Type = tipoCertificado;
        certificado.IssueDate = fechaEmision;
        certificado.ExpiryDate = fechaExpiracion;
        certificado.Issuer = this.getClientId(ctx);
        certificado.AssetID = assetId;
        certificado.Status = 'valid';
        certificado.Properties = JSON.parse(detalles);
        
        // Actualizar el activo con referencia al certificado
        asset.Properties.certificados = asset.Properties.certificados || [];
        asset.Properties.certificados.push(certificadoId);
        asset.History.push({
            timestamp: new Date().toISOString(),
            action: 'CERTIFIED',
            actor: this.getClientId(ctx),
            details: { certificadoId, tipoCertificado }
        });
        
        await ctx.stub.putState(certificadoId, Buffer.from(JSON.stringify(certificado)));
        await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
        return true;
    }
    
    // Verificar autenticidad de un producto/activo
    @Transaction(false) // Solo lectura
    @Returns('boolean')
    public async verificarAutenticidad(
        ctx: Context,
        assetId: string
    ): Promise<boolean> {
        const assetBuffer = await ctx.stub.getState(assetId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`El activo ${assetId} no existe`);
        }
        
        const asset: Asset = JSON.parse(assetBuffer.toString());
        
        // Verificar si tiene certificados asociados
        if (!asset.Properties.certificados || asset.Properties.certificados.length === 0) {
            return false;
        }
        
        // Verificar al menos un certificado válido
        for (const certificadoId of asset.Properties.certificados) {
            const certBuffer = await ctx.stub.getState(certificadoId);
            if (certBuffer && certBuffer.length > 0) {
                const cert: CertificateInfo = JSON.parse(certBuffer.toString());
                
                // Verificar validez del certificado
                if (cert.Status === 'valid' && cert.Issuer === this.getClientId(ctx)) {
                    // Verificar que no ha expirado
                    const now = new Date();
                    const expiry = new Date(cert.ExpiryDate);
                    
                    if (now <= expiry) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Revocar certificado
    @Transaction()
    @Returns('boolean')
    public async revocarCertificado(
        ctx: Context,
        certificadoId: string,
        motivo: string
    ): Promise<boolean> {
        const certBuffer = await ctx.stub.getState(certificadoId);
        if (!certBuffer || certBuffer.length === 0) {
            throw new Error(`El certificado ${certificadoId} no existe`);
        }
        
        const cert: CertificateInfo = JSON.parse(certBuffer.toString());
        
        // Verificar que el regulador es quien emitió el certificado
        if (cert.Issuer !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el emisor original de este certificado');
        }
        
        cert.Status = 'revoked';
        cert.Properties.revocationReason = motivo;
        cert.Properties.revocationDate = new Date().toISOString();
        
        // Actualizar el activo asociado
        const assetBuffer = await ctx.stub.getState(cert.AssetID);
        if (assetBuffer && assetBuffer.length > 0) {
            const asset: Asset = JSON.parse(assetBuffer.toString());
            
            asset.History.push({
                timestamp: new Date().toISOString(),
                action: 'CERTIFICATE_REVOKED',
                actor: this.getClientId(ctx),
                details: { certificadoId, motivo }
            });
            
            await ctx.stub.putState(cert.AssetID, Buffer.from(JSON.stringify(asset)));
        }
        
        await ctx.stub.putState(certificadoId, Buffer.from(JSON.stringify(cert)));
        return true;
    }
    
    // Auditar trazabilidad completa
    @Transaction(false) // Solo lectura
    @Returns('string')
    public async auditarTrazabilidad(
        ctx: Context,
        assetId: string
    ): Promise<string> {
        // Verificar permisos (solo reguladores pueden auditar)
        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (!clientMSPID.includes('ReguladoresMSP')) {
            throw new Error('No autorizado: solo los reguladores pueden realizar auditorías completas');
        }
        
        const trazabilidad = await this.getFullAssetHistory(ctx, assetId);
        return JSON.stringify(trazabilidad);
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
    
    private async getFullAssetHistory(ctx: Context, assetId: string): Promise<any> {
        const result: any = {
            asset: null,
            history: [],
            relatedAssets: []
        };
        
        // Obtener el activo
        const assetBuffer = await ctx.stub.getState(assetId);
        if (!assetBuffer || assetBuffer.length === 0) {
            throw new Error(`El activo ${assetId} no existe`);
        }
        
        const asset: Asset = JSON.parse(assetBuffer.toString());
        result.asset = asset;
        
        // Obtener el historial del activo
        const iterator = await ctx.stub.getHistoryForKey(assetId);
        let historicResults = [];
        
        try {
            let result = await iterator.next();
            while (!result.done) {
                if (result.value && result.value.value.toString()) {
                    const obj = {
                        timestamp: result.value.timestamp,
                        txId: result.value.txId,
                        value: JSON.parse(result.value.value.toString())
                    };
                    historicResults.push(obj);
                }
                result = await iterator.next();
            }
        } finally {
            await iterator.close();
        }
        
        result.history = historicResults;
        
        // Obtener activos relacionados según el tipo
        if (asset.Type === 'vino') {
            // Para un vino, obtener las cosechas relacionadas
            if (asset.Properties.cosechaIds) {
                for (const cosechaId of asset.Properties.cosechaIds) {
                    const cosechaBuffer = await ctx.stub.getState(cosechaId);
                    if (cosechaBuffer && cosechaBuffer.length > 0) {
                        result.relatedAssets.push(JSON.parse(cosechaBuffer.toString()));
                    }
                }
            }
        } else if (asset.Type === 'lote') {
            // Para un lote, obtener el vino relacionado
            if (asset.Properties.vinoId) {
                const vinoBuffer = await ctx.stub.getState(asset.Properties.vinoId);
                if (vinoBuffer && vinoBuffer.length > 0) {
                    result.relatedAssets.push(JSON.parse(vinoBuffer.toString()));
                }
            }
        }
        
        // Certificados
        if (asset.Properties.certificados) {
            result.certificates = [];
            for (const certId of asset.Properties.certificados) {
                const certBuffer = await ctx.stub.getState(certId);
                if (certBuffer && certBuffer.length > 0) {
                    result.certificates.push(JSON.parse(certBuffer.toString()));
                }
            }
        }
        
        return result;
    }
}
