'use client'

import { useState } from 'react';
import { signAndVerify, signMessageWithMetaMask } from '@/utils/metamask-signature';

export default function MetaMaskSignatureExample() {
  const [message, setMessage] = useState('Verificar mi identidad en PFM Traza HLF');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignMessage = async () => {
    setIsLoading(true);
    setError('');
    setStatus('');

    try {
      // Mostrar información para depuración
      console.log('Iniciando proceso de firma con mensaje:', message);

      // 1. Obtener la firma directamente para mostrar datos de depuración
      const signatureData = await signMessageWithMetaMask(message);
      console.log('Datos de firma obtenidos:', {
        address: signatureData.address,
        message: signatureData.message,
        signature: `${signatureData.signature.substring(0, 10)}...`
      });

      // 2. Verificar la firma
      try {
        const response = await fetch('http://localhost:5551/validateSignature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signatureData),
        });

        console.log('Respuesta del servidor:', {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Respuesta del servidor (error):', errorText);
          throw new Error(`Error del servidor (${response.status}): ${errorText}`);
        }

        // Intentar parsear la respuesta
        const data = await response.json();
        console.log('Respuesta parseada:', data);
        
        if (data.isValid) {
          setStatus(`✅ Firma verificada correctamente (dirección: ${data.recoveredAddress.substring(0, 8)}...)`);
        } else {
          setStatus('❌ La firma no es válida');
        }
      } catch (verifyError) {
        console.error('Error en la verificación:', verifyError);
        setError(`Error de verificación: ${verifyError.message}`);
      }
    } catch (error) {
      console.error('Error en el proceso de firma:', error);
      setError(error.message || 'Error al procesar la firma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Validación de Firma con MetaMask</h2>
      
      <div className="mb-4">
        <label htmlFor="message" className="block text-gray-700 mb-2">
          Mensaje a firmar:
        </label>
        <textarea
          id="message"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      
      <button
        onClick={handleSignMessage}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {isLoading ? 'Procesando...' : 'Firmar con MetaMask'}
      </button>
      
      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          {status}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Este proceso:</p>
        <ol className="list-decimal pl-5 mt-2">
          <li>Solicita a MetaMask que firme el mensaje</li>
          <li>Envía la firma, mensaje y dirección a la API</li>
          <li>Verifica criptográficamente que la firma es auténtica</li>
        </ol>
      </div>
    </div>
  );
}
