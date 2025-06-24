export class Batch {
    ID: string = '';
    Products: string[] = []; // Array de IDs de productos en este lote
    CreationDate: string = '';
    Status: string = ''; // created, in_transit, delivered, etc.
    Owner: string = '';
    Destination: string = '';
    Properties: any = {}; // Propiedades adicionales
}
