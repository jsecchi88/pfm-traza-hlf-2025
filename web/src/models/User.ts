export interface User {
    id: string;
    role: 'viticultor' | 'bodega' | 'transportista' | 'distribuidor' | 'minorista' | 'regulador' | 'consumidor';
    name: string;
    organization: string;
}
