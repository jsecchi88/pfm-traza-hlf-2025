/**
 * Script para registrar administradores en cada organización
 * Este script debe ejecutarse una vez para configurar los administradores iniciales
 * que luego podrán registrar a otros usuarios.
 */

import { Wallets, X509Identity } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';

const __dirname = dirname(".");

// Rutas de certificados y configuración del MSP
const ROOT = path.resolve(__dirname, "../../fabric-samples/test-network");
const BASE_ORG1 = `${ROOT}/organizations/peerOrganizations/org1.example.com`;
const BASE_ORG2 = `${ROOT}/organizations/peerOrganizations/org2.example.com`;

// Función para registrar el administrador de una organización
async function enrollAdmin(orgName) {
  try {
    const ccpPath = path.resolve(__dirname, `../connection-${orgName}.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Crear una nueva instancia de CA y configurar el wallet
    const caInfo = ccp.certificateAuthorities[`ca.${orgName}.example.com`];
    const caURL = caInfo.url;
    const ca = new FabricCAServices(caURL);

    // Configurar el wallet para la organización
    const walletPath = path.join(__dirname, `../wallets/${orgName}`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Verificar si el admin ya existe en el wallet
    const identity = await wallet.get('admin');
    if (identity) {
      console.log(`El administrador de ${orgName} ya existe en el wallet`);
      return;
    }

    // Matricular el admin utilizando el certificado y la clave preconfigurados
    const enrollment = await ca.enroll({
      enrollmentID: 'admin',
      enrollmentSecret: 'adminpw'
    });

    // Crear identidad de administrador en el wallet
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgName === 'org1' ? 'Org1MSP' : 'Org2MSP',
      type: 'X.509',
    };
    
    await wallet.put('admin', x509Identity);
    console.log(`Administrador de ${orgName} matriculado exitosamente`);

  } catch (error) {
    console.error(`Error al matricular el administrador de ${orgName}:`, error);
    throw error;
  }
}

// Registrar administradores para ambas organizaciones
async function main() {
  try {
    await enrollAdmin('org1');
    await enrollAdmin('org2');
    console.log('Administradores matriculados exitosamente');
  } catch (error) {
    console.error('Error al matricular administradores:', error);
  }
}

main();
