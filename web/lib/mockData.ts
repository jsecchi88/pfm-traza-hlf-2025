
import { Role, type GrapeLot, type WineBatch, type Transfer } from '@/types';
import { faker } from '@faker-js/faker';
import { MOCK_USERS } from './constants';

const generateId = (prefix: string) => `${prefix}-${faker.string.alphanumeric(4).toUpperCase()}`;

const viticultores = MOCK_USERS[Role.Viticultor];
const bodegas = MOCK_USERS[Role.Bodega];
const distribuidores = MOCK_USERS[Role.Distribuidor];
const minoristas = MOCK_USERS[Role.Minorista];
const consumidores = MOCK_USERS[Role.Consumidor];

export const mockGrapeLots: GrapeLot[] = Array.from({ length: 5 }).map((_, i) => {
  const viticultor = viticultores[i % viticultores.length];
  const variety = faker.helpers.arrayElement(['Malbec', 'Cabernet Sauvignon', 'Chardonnay', 'Merlot']);
  return {
    id: generateId('GRAPE'),
    name: `Cosecha ${variety} ${new Date().getFullYear()} - Lote ${i + 1}`,
    grapeVariety: variety,
    parcelData: `Parcela ${faker.number.int({ min: 1, max: 20 })}, Finca ${viticultor.name}`,
    inputsUsed: `Riego por goteo, fertilizantes orgánicos.`,
    viticultorId: viticultor.id,
    harvestDate: faker.date.past().toISOString(),
    registrationDate: new Date().toISOString(),
    imageUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent(`Uva ${variety}`)}`,
  };
});

export const mockWineBatches: WineBatch[] = [];
export const mockTransfers: Transfer[] = [];

// Create transfers for Grapes from Viticultor to Bodega, and then create WineBatches
mockGrapeLots.forEach((grapeLot, i) => {
  if (i < 3) { // Only some lots get transferred and processed initially
    const viticultor = viticultores.find(v => v.id === grapeLot.viticultorId);
    const bodega = bodegas[i % bodegas.length];
    if (viticultor && bodega) {
      // 1. Transfer Grapes to Bodega
      const grapeTransfer: Transfer = {
        id: generateId('TR'),
        assetId: grapeLot.id,
        assetName: grapeLot.name,
        assetType: "GrapeLot",
        fromUserId: viticultor.id,
        fromRole: Role.Viticultor,
        toUserId: bodega.id,
        toRole: Role.Bodega,
        status: "accepted",
        requestDate: faker.date.between({ from: grapeLot.harvestDate, to: new Date() }).toISOString(),
        actionDate: new Date().toISOString(),
        quantity: faker.number.int({ min: 500, max: 2000 }),
      };
      mockTransfers.push(grapeTransfer);

      // 2. Bodega creates Wine from the Grapes
      const wineBatch: WineBatch = {
        id: generateId('WINE'),
        name: `Reserva ${grapeLot.grapeVariety} ${new Date().getFullYear()}`,
        grapeLotIds: [grapeLot.id],
        bodegaId: bodega.id,
        productionDetails: `Fermentado en tanques de acero inoxidable. Crianza de 12 meses en barricas de roble francés.`,
        chemicalAnalysis: `pH: ${faker.number.float({ min: 3.2, max: 3.8, precision: 0.1 })}, Alcohol: ${faker.number.float({ min: 13.0, max: 14.5, precision: 0.1 })}%`,
        bottlingDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        imageUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent(`Vino ${grapeLot.grapeVariety}`)}`,
      };
      mockWineBatches.push(wineBatch);
      
      // 3. Transfer Wine from Bodega to Distribuidor
      const distribuidor = distribuidores[i % distribuidores.length];
      if (distribuidor) {
          const wineTransfer: Transfer = {
              id: generateId('TR'),
              assetId: wineBatch.id,
              assetName: wineBatch.name,
              assetType: "WineBatch",
              fromUserId: bodega.id,
              fromRole: Role.Bodega,
              toUserId: distribuidor.id,
              toRole: Role.Distribuidor,
              status: "accepted",
              requestDate: new Date().toISOString(),
              actionDate: new Date().toISOString(),
              quantity: faker.number.int({ min: 100, max: 500 }),
          };
          mockTransfers.push(wineTransfer);

          // 4. Transfer Wine from Distribuidor to Minorista
          const minorista = minoristas[i % minoristas.length];
          if(minorista){
             const retailTransfer: Transfer = {
                id: generateId('TR'),
                assetId: wineBatch.id,
                assetName: wineBatch.name,
                assetType: "WineBatch",
                fromUserId: distribuidor.id,
                fromRole: Role.Distribuidor,
                toUserId: minorista.id,
                toRole: Role.Minorista,
                status: "accepted",
                requestDate: new Date().toISOString(),
                actionDate: new Date().toISOString(),
                quantity: faker.number.int({ min: 10, max: 50 }),
            };
            mockTransfers.push(retailTransfer);

            // 5. "Sell" wine to a consumer
            const consumidor = consumidores[i % consumidores.length];
            if(consumidor){
               const consumerSale: Transfer = {
                  id: generateId('TR'),
                  assetId: wineBatch.id,
                  assetName: wineBatch.name,
                  assetType: "WineBatch",
                  fromUserId: minorista.id,
                  fromRole: Role.Minorista,
                  toUserId: consumidor.id,
                  toRole: Role.Consumidor,
                  status: "accepted",
                  requestDate: new Date().toISOString(),
                  actionDate: new Date().toISOString(),
                  quantity: faker.number.int({min: 1, max: 3}),
              };
              mockTransfers.push(consumerSale);
            }
          }
      }
    }
  }
});


// Helper function to get assets for a user
export const getAssetsForUser = (userId: string, role: Role): (GrapeLot | WineBatch)[] => {
  switch (role) {
    case Role.Viticultor:
      return mockGrapeLots.filter(gl => gl.viticultorId === userId);
    case Role.Bodega:
      const bodegaWines = mockWineBatches.filter(wb => wb.bodegaId === userId);
      const acceptedGrapeLotIds = mockTransfers
        .filter(t => t.toUserId === userId && t.toRole === Role.Bodega && t.status === 'accepted' && t.assetType === 'GrapeLot')
        .map(t => t.assetId);
      const acceptedGrapeLots = mockGrapeLots.filter(gl => acceptedGrapeLotIds.includes(gl.id));
      return [...bodegaWines, ...acceptedGrapeLots];
    case Role.Distribuidor:
    case Role.Minorista:
      const acceptedWineIds = mockTransfers
        .filter(t => t.toUserId === userId && t.toRole === role && t.status === 'accepted' && t.assetType === 'WineBatch')
        .map(t => t.assetId);
      return mockWineBatches.filter(wb => acceptedWineIds.includes(wb.id));
    default:
      return [];
  }
};

// Helper function to get wine trace
export const getWineTrace = (wineId: string): import('@/types').WineTraceEvent[] => {
  const trace: import('@/types').WineTraceEvent[] = [];
  const wineBatch = mockWineBatches.find(p => p.id === wineId);

  if (!wineBatch) return [];
  
  const bodega = MOCK_USERS[Role.Bodega].find(f => f.id === wineBatch.bodegaId);
  trace.push({
    timestamp: wineBatch.registrationDate,
    event: "Vino Registrado por Bodega",
    actor: `${Role.Bodega} - ${bodega?.name || wineBatch.bodegaId}`,
    assetId: wineBatch.id,
    details: `Vino: ${wineBatch.name}. Detalles: ${wineBatch.productionDetails}. Embotellado: ${new Date(wineBatch.bottlingDate).toLocaleDateString()}`,
  });

  wineBatch.grapeLotIds.forEach(glId => {
    const grapeLot = mockGrapeLots.find(gl => gl.id === glId);
    if (grapeLot) {
      const viticultor = MOCK_USERS[Role.Viticultor].find(p => p.id === grapeLot.viticultorId);
      trace.push({
        timestamp: grapeLot.harvestDate,
        event: "Cosecha de Uva Registrada",
        actor: `${Role.Viticultor} - ${viticultor?.name || grapeLot.viticultorId}`,
        assetId: glId,
        details: `Lote: ${grapeLot.name}. Variedad: ${grapeLot.grapeVariety}. Parcela: ${grapeLot.parcelData}`,
      });
      
      const grapeTransfer = mockTransfers.find(t => 
        t.assetId === glId && 
        t.toUserId === wineBatch.bodegaId &&
        t.status === "accepted"
      );
      if (grapeTransfer) {
        trace.push({
          timestamp: grapeTransfer.actionDate || grapeTransfer.requestDate,
          event: "Lote de Uva Transferido a Bodega",
          actor: `De ${viticultor?.name} a ${bodega?.name}`,
          assetId: glId,
          details: `Cantidad: ${grapeTransfer.quantity}kg`,
        });
      }
    }
  });
  
  mockTransfers
    .filter(t => t.assetId === wineId && t.assetType === "WineBatch")
    .sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime())
    .forEach(transfer => {
      const fromUser = MOCK_USERS[transfer.fromRole]?.find(u => u.id === transfer.fromUserId);
      const toUser = MOCK_USERS[transfer.toRole]?.find(u => u.id === transfer.toUserId);
      trace.push({
        timestamp: transfer.requestDate,
        event: `Transferencia Iniciada: ${transfer.fromRole} a ${transfer.toRole}`,
        actor: `${fromUser?.name || 'N/A'}`,
        assetId: wineId,
        details: `Hacia ${toUser?.name || 'N/A'}. Cantidad: ${transfer.quantity} botellas.`,
      });
      if (transfer.status === "accepted" && transfer.actionDate) {
         trace.push({
          timestamp: transfer.actionDate,
          event: `Transferencia Aceptada`,
          actor: `${transfer.toRole} - ${toUser?.name || transfer.toUserId}`,
          assetId: wineId,
        });
      }
    });

  return trace.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};
