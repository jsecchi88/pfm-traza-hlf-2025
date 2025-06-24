export class Batch {
    ID: string = '';
    Type: string = ''; // envio, asignacion, lote, etc.
    Products: any = {}; // Puede ser un array de IDs o un objeto con detalles
    CreationDate: string = '';
    Status: string = ''; // created, in_transit, delivered, received, etc.
    Owner: string = ''; // ID del propietario actual
    SourceOrg: string = ''; // Organización de origen
    TargetOrg: string = ''; // Organización de destino
    TransporterOrg: string = ''; // Transportista asignado
    Properties: any = {}; // Propiedades adicionales
}
