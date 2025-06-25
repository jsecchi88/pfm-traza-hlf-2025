'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import AssetQR from '@/components/AssetQR';
import Timeline from '@/components/Timeline';
import { getAsset } from '@/services/api';
import { Asset } from '@/models';

export default function TrazabilidadDetalle({ params }: { params: { id: string } }) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAsset() {
      if (!params.id) return;
      
      setLoading(true);
      try {
        const result = await getAsset(params.id);
        setAsset(result);
      } catch (err) {
        console.error('Error al obtener el activo:', err);
        setError('No se pudo cargar la información del producto. Verifica el ID e intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAsset();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="py-12">
        <Card>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error || 'No se encontró el producto'}</p>
            <Button className="mt-6" onClick={() => window.history.back()}>
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Trazabilidad del Producto</h1>
        <p className="mt-2 text-gray-600">Información detallada y registro completo de trazabilidad</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card title="Información del Producto">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Detalles</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                  <div className="sm:col-span-2 flex">
                    <dt className="w-32 font-medium text-gray-500">ID:</dt>
                    <dd className="flex-1 font-mono text-sm">{asset.ID}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">Tipo:</dt>
                    <dd>{asset.Type}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">Estado:</dt>
                    <dd>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {asset.Status}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2 flex">
                    <dt className="w-32 font-medium text-gray-500">Propietario:</dt>
                    <dd>{asset.Owner}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Propiedades</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-80">
                  {asset.Properties && Object.keys(asset.Properties).length > 0 ? (
                    <dl className="divide-y divide-gray-200">
                      {Object.entries(asset.Properties).map(([key, value]) => (
                        <div key={key} className="py-3 flex flex-col md:flex-row">
                          <dt className="text-sm font-medium text-gray-500 md:w-1/3">{key}:</dt>
                          <dd className="mt-1 md:mt-0 text-sm text-gray-900 md:w-2/3">
                            {typeof value === 'object' 
                              ? <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                              : String(value)
                            }
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-gray-500 italic">Sin propiedades adicionales</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Código QR">
            <div className="flex flex-col items-center justify-center py-4">
              <AssetQR assetId={asset.ID} size={180} />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Comparte este código para verificar la autenticidad del producto</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Historial de Trazabilidad">
        {asset.History && asset.History.length > 0 ? (
          <Timeline history={asset.History} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No hay registros históricos para este producto</p>
          </div>
        )}
      </Card>

      <div className="text-center">
        <Button onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>
    </div>
  );
}
