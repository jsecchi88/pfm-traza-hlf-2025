'use client';

import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FormInput from '@/components/FormInput';
import { getAsset } from '@/services/api';
import { Asset } from '@/models';
import Timeline from '@/components/Timeline';

export default function Trazabilidad() {
  const [assetId, setAssetId] = useState('');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assetId.trim()) {
      setError('Por favor, introduce un ID de producto para buscar');
      return;
    }

    setLoading(true);
    setError('');
    setAsset(null);

    try {
      const result = await getAsset(assetId);
      setAsset(result);
    } catch (error) {
      console.error('Error al buscar trazabilidad:', error);
      setError('No se encontró el producto. Verifica el ID e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Consulta de Trazabilidad</h1>
        <p className="mt-2 text-lg text-gray-600">
          Verifica la autenticidad y visualiza la trazabilidad completa de cualquier producto
        </p>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <FormInput
              id="assetId"
              label="ID del Producto"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="Introduce el ID del producto o escanea el QR"
              required
            />
          </div>
          <div className="self-end mb-4 md:mb-0">
            <Button type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-100 p-3 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
      </Card>

      {asset && (
        <div className="space-y-6">
          <Card title="Información del Producto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Detalles</h3>
                <dl className="space-y-1">
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">ID:</dt>
                    <dd>{asset.ID}</dd>
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
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">Propietario:</dt>
                    <dd>{asset.Owner}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Propiedades</h3>
                <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-48">
                  <pre className="text-xs">{JSON.stringify(asset.Properties, null, 2)}</pre>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Historial de Trazabilidad">
            <Timeline history={asset.History} />
          </Card>
        </div>
      )}
    </div>
  );
}
