export class CertificateInfo {
    ID: string = '';
    Type: string = ''; // DO, calidad, orgánico, etc.
    IssueDate: string = '';
    ExpiryDate: string = '';
    Issuer: string = '';
    AssetID: string = '';
    Status: string = ''; // valid, expired, revoked
    Properties: any = {}; // Detalles específicos
}
