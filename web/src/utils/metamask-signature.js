/**
 * Utilidades para trabajar con firmas de MetaMask
 */

/**
 * Solicita al usuario firmar un mensaje utilizando MetaMask
 * @param {string} message - El mensaje a firmar
 * @returns {Promise<{signature: string, message: string, address: string}>} - Los datos de la firma
 */
export async function signMessageWithMetaMask(message) {
  try {
    // Verificar si MetaMask está instalado
    if (!window.ethereum) {
      throw new Error('MetaMask no está instalado. Por favor, instale la extensión de MetaMask.');
    }

    // Solicitar conexión a MetaMask si no está conectado
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No se pudo acceder a las cuentas de MetaMask. Asegúrese de que está desbloqueado.');
    }

    // Obtener la dirección de la cuenta activa
    const address = accounts[0];

    // Solicitar firma del mensaje
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });

    // Devolver los datos necesarios para la verificación
    return {
      signature,
      message,
      address,
    };
  } catch (error) {
    console.error('Error al firmar mensaje con MetaMask:', error);
    throw error;
  }
}

/**
 * Verifica una firma mediante la API
 * @param {object} signatureData - Los datos de la firma (signature, message, address)
 * @returns {Promise<boolean>} - True si la firma es válida, False en caso contrario
 */
export async function verifySignatureWithAPI(signatureData) {
  try {
    const response = await fetch('http://localhost:5551/validateSignature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signatureData),
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      // Intentar obtener el texto del error
      const errorText = await response.text();
      console.error('Error de respuesta HTTP:', response.status, errorText);
      
      // Verificar si el texto parece HTML
      if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
        throw new Error(`Error del servidor (${response.status}): La API está devolviendo HTML en lugar de JSON. Posiblemente el servidor está caído o hay un problema de CORS.`);
      } else {
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }
    }

    // Intentar parsear la respuesta como JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // Si no es JSON, mostrar el texto recibido
      const responseText = await response.text();
      console.error('Respuesta no válida (no es JSON):', responseText);
      throw new Error('La respuesta del servidor no es un JSON válido. Verifique los logs para más detalles.');
    }
    
    // Verificar si la operación fue exitosa según la API
    if (!data.success) {
      throw new Error(data.error || 'Error al verificar la firma');
    }

    return data.isValid;
  } catch (error) {
    console.error('Error al verificar firma con la API:', error);
    throw error;
  }
}

/**
 * Ejemplo de uso completo:
 * 1. Solicitar firma al usuario
 * 2. Verificar la firma con la API
 * @param {string} message - El mensaje a firmar
 * @returns {Promise<boolean>} - True si la firma es válida, False en caso contrario
 */
export async function signAndVerify(message) {
  try {
    // 1. Solicitar firma al usuario
    const signatureData = await signMessageWithMetaMask(message);
    
    // 2. Verificar la firma con la API
    const isValid = await verifySignatureWithAPI(signatureData);
    
    return isValid;
  } catch (error) {
    console.error('Error en el proceso de firma y verificación:', error);
    throw error;
  }
}
