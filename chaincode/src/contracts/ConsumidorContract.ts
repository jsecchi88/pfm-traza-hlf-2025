import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { CertificateInfo } from '../models/CertificateInfo';

@Info({ title: 'ConsumidorContract', description: 'Contrato para consultas de trazabilidad por parte de consumidores' })
export class ConsumidorContract extends Contract {
    
    // Consultar datos de trazabilidad de una botella específica
    @Transaction(false) // Solo lectura
    @Returns('string')
    public async consultarTrazabilidad(
        ctx: Context,
        unidadId: string
    ): Promise<string> {
        const unidadBuffer = await ctx.stub.getState(unidadId);
        if (!unidadBuffer || unidadBuffer.length === 0) {
            throw new Error(`La unidad ${unidadId} no existe`);
        }
        
        const unidad: Asset = JSON.parse(unidadBuffer.toString());
        const loteId = unidad.Properties.loteId;
        
        // Recopilar datos específicos para el consumidor
        const resultado: {
            unidad: { id: string, estado: string },
            lote: { id: string, fechaEmbotellado: string } | null,
            vino: { id: string, tipo: string, metodo: string, añada: number } | null,
            bodega: { id: string } | null,
            certificados: Array<{ tipo: string, emisor: string, fechaEmision: string }>,
            trazabilidad: Array<any>
        } = {
            unidad: {
                id: unidad.ID,
                estado: unidad.Status
            },
            lote: null,
            vino: null,
            bodega: null,
            certificados: [],
            trazabilidad: []
        };
        
        // Obtener datos del lote
        const loteBuffer = await ctx.stub.getState(loteId);
        if (loteBuffer && loteBuffer.length > 0) {
            const lote: Asset = JSON.parse(loteBuffer.toString());
            resultado.lote = {
                id: lote.ID,
                fechaEmbotellado: lote.Properties.fechaEmbotellado
            };
            
            // Obtener datos del vino
            if (lote.Properties.vinoId) {
                const vinoBuffer = await ctx.stub.getState(lote.Properties.vinoId);
                if (vinoBuffer && vinoBuffer.length > 0) {
                    const vino: Asset = JSON.parse(vinoBuffer.toString());
                    resultado.vino = {
                        id: vino.ID,
                        tipo: vino.Properties.tipoVino,
                        metodo: vino.Properties.metodoElaboracion,
                        añada: new Date(vino.Properties.fechaInicio).getFullYear()
                    };
                    
                    // Bodega (propietario del vino)
                    resultado.bodega = {
                        id: vino.Owner
                    };
                    
                    // Certificados asociados al vino
                    if (vino.Properties.certificados && vino.Properties.certificados.length > 0) {
                        for (const certId of vino.Properties.certificados) {
                            const certBuffer = await ctx.stub.getState(certId);
                            if (certBuffer && certBuffer.length > 0) {
                                const cert: CertificateInfo = JSON.parse(certBuffer.toString());
                                
                                if (cert.Status === 'valid') {
                                    resultado.certificados.push({
                                        tipo: cert.Type,
                                        emisor: cert.Issuer,
                                        fechaEmision: cert.IssueDate
                                    });
                                }
                            }
                        }
                    }
                    
                    // Obtener datos de trazabilidad (cosechas)
                    if (vino.Properties.cosechaIds && vino.Properties.cosechaIds.length > 0) {
                        for (const cosechaId of vino.Properties.cosechaIds) {
                            const cosechaBuffer = await ctx.stub.getState(cosechaId);
                            if (cosechaBuffer && cosechaBuffer.length > 0) {
                                const cosecha: Asset = JSON.parse(cosechaBuffer.toString());
                                
                                resultado.trazabilidad.push({
                                    etapa: 'Viticultura',
                                    fecha: cosecha.Properties.fecha,
                                    variedad: cosecha.Properties.variedadUva,
                                    origen: `Parcela ${cosecha.Properties.parcelaId}`
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Eventos de transporte (si existen)
        const query = {
            selector: {
                Type: 'transporte',
                'Properties.loteId': loteId
            }
        };
        
        // Intentar encontrar registros de transporte
        const iterador = await ctx.stub.getQueryResult(JSON.stringify(query));
        try {
            let resultado_consulta = await iterador.next();
            while (!resultado_consulta.done) {
                if (resultado_consulta.value && resultado_consulta.value.value.toString()) {
                    const transporte = JSON.parse(resultado_consulta.value.value.toString());
                    
                    if (transporte.Incidents && transporte.Incidents.length > 0) {
                        // Solo mostrar al consumidor si hubo incidencias importantes
                        resultado.trazabilidad.push({
                            etapa: 'Transporte',
                            fechaSalida: transporte.DepartureTime,
                            fechaEntrega: transporte.ActualArrival,
                            incidencias: transporte.Incidents.length
                        });
                    } else {
                        resultado.trazabilidad.push({
                            etapa: 'Transporte',
                            fechaSalida: transporte.DepartureTime,
                            fechaEntrega: transporte.ActualArrival,
                            incidencias: 0
                        });
                    }
                }
                resultado_consulta = await iterador.next();
            }
        } finally {
            await iterador.close();
        }
        
        // Añadir información de disponibilidad
        if (unidad.Properties.fechaVenta) {
            resultado.trazabilidad.push({
                etapa: 'Venta',
                fecha: unidad.Properties.fechaVenta
            });
        }
        
        return JSON.stringify(resultado);
    }
    
    // Verificar autenticidad de QR
    @Transaction(false) // Solo lectura
    @Returns('boolean')
    public async verificarQR(
        ctx: Context,
        qrData: string
    ): Promise<boolean> {
        const datos = JSON.parse(qrData);
        const productId = datos.productId;
        
        // Verificar que el producto existe en la cadena
        const unidadBuffer = await ctx.stub.getState(productId);
        if (!unidadBuffer || unidadBuffer.length === 0) {
            return false;
        }
        
        const unidad: Asset = JSON.parse(unidadBuffer.toString());
        
        // Verificar que los datos del QR coinciden con los de la cadena
        if (unidad.Owner === datos.minoristaId && unidad.Properties.loteId === datos.loteId) {
            return true;
        }
        
        return false;
    }
}
