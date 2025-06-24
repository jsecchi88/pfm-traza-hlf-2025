import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from '../models/Asset';
import { TransportRecord } from '../models/TransportRecord';

@Info({ title: 'TransportistaContract', description: 'Contrato para gestión de operaciones del transportista' })
export class TransportistaContract extends Contract {
    
    // Iniciar transporte
    @Transaction()
    @Returns('boolean')
    public async iniciarTransporte(
        ctx: Context, 
        transporteId: string,
        loteId: string,
        origen: string,
        destino: string,
        fechaSalida: string,
        estimacionLlegada: string,
        condicionesIniciales: string // JSON con datos IoT iniciales
    ): Promise<boolean> {
        const exists = await this.assetExists(ctx, transporteId);
        if (exists) {
            throw new Error(`El transporte ${transporteId} ya existe`);
        }
        
        // Verificar que el lote existe
        const loteBuffer = await ctx.stub.getState(loteId);
        if (!loteBuffer || loteBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }
        
        const lote: Asset = JSON.parse(loteBuffer.toString());
        
        // Verificar que el lote está destinado a este transportista
        if (lote.Properties.destinationOwner !== this.getClientId(ctx)) {
            throw new Error('No autorizado: este lote no está destinado a tu empresa de transporte');
        }
        
        // Crear registro de transporte
        const transportRecord = new TransportRecord();
        transportRecord.ID = transporteId;
        transportRecord.BatchID = loteId;
        transportRecord.Origin = origen;
        transportRecord.Destination = destino;
        transportRecord.CarrierID = this.getClientId(ctx);
        transportRecord.DepartureTime = fechaSalida;
        transportRecord.EstimatedArrival = estimacionLlegada;
        transportRecord.Status = 'en_transito';
        transportRecord.Conditions = JSON.parse(condicionesIniciales);
        
        // Actualizar propiedad del lote
        lote.Owner = this.getClientId(ctx);
        lote.Status = 'en_transito';
        lote.History.push({
            timestamp: new Date().toISOString(),
            action: 'IN_TRANSIT',
            actor: this.getClientId(ctx),
            details: { transporteId }
        });
        
        await ctx.stub.putState(transporteId, Buffer.from(JSON.stringify(transportRecord)));
        await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
        return true;
    }
    
    // Actualizar condiciones de transporte (datos IoT)
    @Transaction()
    @Returns('boolean')
    public async actualizarCondiciones(
        ctx: Context,
        transporteId: string,
        datos: string, // JSON con datos de sensores
        ubicacion: string, // Coordenadas actuales
        timestamp: string
    ): Promise<boolean> {
        const transportBuffer = await ctx.stub.getState(transporteId);
        if (!transportBuffer || transportBuffer.length === 0) {
            throw new Error(`El transporte ${transporteId} no existe`);
        }
        
        const transport: TransportRecord = JSON.parse(transportBuffer.toString());
        
        // Verificar que el transportista es quien gestiona este transporte
        if (transport.CarrierID !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el transportista asignado');
        }
        
        const datosIoT = JSON.parse(datos);
        
        // Añadir nueva lectura de sensores
        transport.Conditions.readings = transport.Conditions.readings || [];
        transport.Conditions.readings.push({
            timestamp,
            data: datosIoT,
            location: JSON.parse(ubicacion)
        });
        
        // Verificar si hay incidencias según umbrales
        if (this.detectarIncidencia(datosIoT)) {
            transport.Incidents.push({
                timestamp,
                details: `Valores fuera de rango: ${this.getIncidenceDetails(datosIoT)}`,
                location: JSON.parse(ubicacion)
            });
        }
        
        await ctx.stub.putState(transporteId, Buffer.from(JSON.stringify(transport)));
        return true;
    }
    
    // Registrar incidencia manual
    @Transaction()
    @Returns('boolean')
    public async registrarIncidencia(
        ctx: Context,
        transporteId: string,
        detalles: string,
        ubicacion: string,
        timestamp: string
    ): Promise<boolean> {
        const transportBuffer = await ctx.stub.getState(transporteId);
        if (!transportBuffer || transportBuffer.length === 0) {
            throw new Error(`El transporte ${transporteId} no existe`);
        }
        
        const transport: TransportRecord = JSON.parse(transportBuffer.toString());
        
        // Verificar que el transportista es quien gestiona este transporte
        if (transport.CarrierID !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el transportista asignado');
        }
        
        // Añadir incidencia
        transport.Incidents.push({
            timestamp,
            details: detalles,
            location: JSON.parse(ubicacion)
        });
        
        await ctx.stub.putState(transporteId, Buffer.from(JSON.stringify(transport)));
        return true;
    }
    
    // Finalizar transporte y entregar
    @Transaction()
    @Returns('boolean')
    public async finalizarTransporte(
        ctx: Context,
        transporteId: string,
        loteId: string,
        destinatarioId: string,
        fechaLlegada: string,
        condicionesFinales: string // JSON con datos finales
    ): Promise<boolean> {
        const transportBuffer = await ctx.stub.getState(transporteId);
        if (!transportBuffer || transportBuffer.length === 0) {
            throw new Error(`El transporte ${transporteId} no existe`);
        }
        
        const transport: TransportRecord = JSON.parse(transportBuffer.toString());
        
        // Verificar que el transportista es quien gestiona este transporte
        if (transport.CarrierID !== this.getClientId(ctx)) {
            throw new Error('No autorizado: no eres el transportista asignado');
        }
        
        // Verificar que el lote coincide
        if (transport.BatchID !== loteId) {
            throw new Error(`El lote ${loteId} no corresponde a este transporte`);
        }
        
        // Actualizar transporte
        transport.Status = 'entregado';
        transport.ActualArrival = fechaLlegada;
        transport.Conditions.final = JSON.parse(condicionesFinales);
        
        // Actualizar el lote
        const loteBuffer = await ctx.stub.getState(loteId);
        if (!loteBuffer || loteBuffer.length === 0) {
            throw new Error(`El lote ${loteId} no existe`);
        }
        
        const lote: Asset = JSON.parse(loteBuffer.toString());
        lote.Status = 'pendiente_confirmacion';
        lote.Properties.destinationOwner = destinatarioId;
        lote.History.push({
            timestamp: new Date().toISOString(),
            action: 'DELIVERED',
            actor: this.getClientId(ctx),
            details: { destinatarioId, fechaLlegada }
        });
        
        await ctx.stub.putState(transporteId, Buffer.from(JSON.stringify(transport)));
        await ctx.stub.putState(loteId, Buffer.from(JSON.stringify(lote)));
        return true;
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
    
    private detectarIncidencia(datos: any): boolean {
        // Lógica para detectar incidencias basadas en umbrales
        // Por ejemplo, temperatura fuera de rango
        if (datos.temperatura) {
            if (datos.temperatura < 10 || datos.temperatura > 18) {
                return true;
            }
        }
        
        // Humedad fuera de rango
        if (datos.humedad) {
            if (datos.humedad < 50 || datos.humedad > 80) {
                return true;
            }
        }
        
        return false;
    }
    
    private getIncidenceDetails(datos: any): string {
        const issues = [];
        
        if (datos.temperatura && (datos.temperatura < 10 || datos.temperatura > 18)) {
            issues.push(`Temperatura ${datos.temperatura}°C fuera del rango óptimo (10-18°C)`);
        }
        
        if (datos.humedad && (datos.humedad < 50 || datos.humedad > 80)) {
            issues.push(`Humedad ${datos.humedad}% fuera del rango óptimo (50-80%)`);
        }
        
        return issues.join(', ');
    }
}
