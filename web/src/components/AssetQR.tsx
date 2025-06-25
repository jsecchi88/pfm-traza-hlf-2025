'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface AssetQRProps {
  assetId: string;
  size?: number;
}

export default function AssetQR({ assetId, size = 128 }: AssetQRProps) {
  // URL completo para mostrar la trazabilidad del activo
  const traceabilityUrl = `${window.location.origin}/trazabilidad/${assetId}`;

  return (
    <div className="flex flex-col items-center">
      <QRCodeSVG 
        value={traceabilityUrl} 
        size={size} 
        level="H" 
        includeMargin={true}
        className="border rounded-md shadow-sm" 
      />
      <p className="mt-2 text-xs text-gray-500 text-center">
        Escane este código QR para ver la trazabilidad
      </p>
      <p className="mt-1 text-xs text-gray-400">ID: {assetId}</p>
    </div>
  );
}
