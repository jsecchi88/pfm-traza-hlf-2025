/**
 * Script para registrar nuevos usuarios en la red Hyperledger Fabric
 * Utiliza Fabric CA para registrar y matricular usuarios con roles específicos
 */

import { identityManager } from '../auth/identity.js';

/**
 * Registra un nuevo usuario
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @param {string} role - Rol del usuario (Viticultor, Bodega, etc.)
 * @param {Object} attributes - Atributos adicionales
 */
async function registerUser(username, password, role, attributes = {}) {
  try {
    const result = await identityManager.registerUser(username, password, role, attributes);
    console.log(`Usuario ${username} registrado exitosamente:`, result);
    return result;
  } catch (error) {
    console.error(`Error al registrar usuario ${username}:`, error);
    throw error;
  }
}

// Registrar usuarios iniciales del sistema
async function registerInitialUsers() {
  try {
    // Viticultores
    await registerUser('viticultor1', 'password', 'Viticultor', { 
      company: 'Finca El Sol', 
      region: 'Mendoza' 
    });
    
    await registerUser('viticultor2', 'password', 'Viticultor', { 
      company: 'Viña Antigua', 
      region: 'San Juan' 
    });
    
    // Bodegas
    await registerUser('bodega1', 'password', 'Bodega', { 
      company: 'Bodegas Mendoza', 
      specialties: 'Malbec, Cabernet' 
    });
    
    await registerUser('bodega2', 'password', 'Bodega', { 
      company: 'Alta Vista', 
      specialties: 'Malbec, Chardonnay' 
    });
    
    // Transportistas
    await registerUser('transportista1', 'password', 'Transportista', { 
      company: 'Transportes Seguros S.A.',
      vehicleType: 'refrigerated'
    });
    
    // Distribuidores
    await registerUser('distribuidor1', 'password', 'Distribuidor', { 
      company: 'Distribuciones Vino Fino',
      region: 'Buenos Aires'
    });
    
    // Minoristas
    await registerUser('minorista1', 'password', 'Minorista', { 
      company: 'Vinoteca Premium',
      location: 'Palermo, Buenos Aires'
    });
    
    // Regulador
    await registerUser('regulador1', 'password', 'Regulador', { 
      organization: 'Instituto Nacional de Vitivinicultura',
      certificationLevel: 'official'
    });
    
    console.log('Todos los usuarios iniciales han sido registrados exitosamente');
  } catch (error) {
    console.error('Error al registrar usuarios iniciales:', error);
  }
}

// Función principal
async function main() {
  // Si se llama directamente al script, registrar usuarios iniciales
  if (require.main === module) {
    await registerInitialUsers();
  }
}

// Exportar la función para uso en otros módulos
export { registerUser, registerInitialUsers };

// Ejecutar si se llama directamente
main();
