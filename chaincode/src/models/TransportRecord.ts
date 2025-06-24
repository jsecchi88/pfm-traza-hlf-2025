export class TransportRecord {
    ID: string = '';
    ProductIDs: string[] = []; // IDs de los productos transportados
    BatchID: string = ''; // Opcional: ID del lote transportado
    Origin: string = '';
    Destination: string = '';
    CarrierID: string = '';
    DepartureTime: string = '';
    EstimatedArrival: string = '';
    ActualArrival: string = '';
    Status: string = ''; // scheduled, in_transit, delivered, etc.
    Conditions: any = {}; // Temperatura, humedad, etc. (datos IoT)
    Incidents: any[] = []; // Registro de incidencias
}
