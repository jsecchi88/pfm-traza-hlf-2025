/**
 * Script para probar la validación de firmas directamente.
 * Ejecutar con: node test-signature.js
 */
import { ethers } from 'ethers';

// Crear una billetera aleatoria para pruebas
const wallet = ethers.Wallet.createRandom();

// Mensaje de prueba
const message = "Mensaje de prueba para verificar firma";

// Firmar el mensaje
async function testSignAndVerify() {
  try {
    // Firmar el mensaje con la billetera
    console.log("Firmando mensaje con billetera:", wallet.address);
    const signature = await wallet.signMessage(message);
    
    console.log("Firma generada:", signature);
    
    // Verificar la firma localmente
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log("Dirección recuperada:", recoveredAddress);
    console.log("Coincide con la billetera:", recoveredAddress === wallet.address);
    
    console.log("\nDatos para usar en la API:");
    console.log(JSON.stringify({
      message,
      signature,
      address: wallet.address
    }, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testSignAndVerify();
