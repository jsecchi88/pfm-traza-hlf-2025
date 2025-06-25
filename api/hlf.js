import * as grpc from "@grpc/grpc-js"
import { signers, connect } from "@hyperledger/fabric-gateway"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { dirname } from 'node:path';
import { identityManager } from './auth/identity.js';

const __dirname = dirname(".");

const ROOT = path.resolve(__dirname, "../fabric-samples/test-network")
const CHANNEL = "mychannel"
const CHAINCODE = "basicts"

// Configuración para conexión con identidad de sistema (fallback)
const BASE = `${ROOT}/organizations/peerOrganizations/org1.example.com`
const CERT_USER = fs.readFileSync(`${BASE}/users/User1@org1.example.com/msp/signcerts/cert.pem`).toString()
const keyDir = `${BASE}/users/User1@org1.example.com/msp/keystore`;
const keyFiles = fs.readdirSync(keyDir);
const keyFilePath = path.join(keyDir, keyFiles[0]);
const KEY_USER = fs.readFileSync(keyFilePath).toString()
const MSPID = "Org1MSP"
const peerEndpoint = 'localhost:7051'
const peerHostAlias = 'peer0.org1.example.com';
const tlsCertPath = fs.readFileSync(`${BASE}/peers/peer0.org1.example.com/tls/ca.crt`).toString()

async function newGrpcConnection(userAuth) {
    // Si tenemos información de autenticación de usuario, usamos el peer de su organización
    if (userAuth) {
        const orgId = userAuth.organization;
        const peerConfig = {
            'org1': {
                endpoint: 'localhost:7051',
                hostAlias: 'peer0.org1.example.com',
                tlsCertPath: `${ROOT}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`
            },
            'org2': {
                endpoint: 'localhost:9051', 
                hostAlias: 'peer0.org2.example.com',
                tlsCertPath: `${ROOT}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt`
            }
        };

        const config = peerConfig[orgId];
        const tlsCert = fs.readFileSync(config.tlsCertPath).toString();
        const tlsCredentials = grpc.credentials.createSsl(Buffer.from(tlsCert));
        
        return new grpc.Client(config.endpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': config.hostAlias,
        });
    } else {
        // Fallback al peer por defecto si no hay información de autenticación
        const tlsCredentials = grpc.credentials.createSsl(Buffer.from(tlsCertPath));
        return new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
        });
    }
}

/**
 * Conectar a Fabric y obtener un contrato específico
 * @param {string} contractName - Nombre del contrato a conectar
 * @param {Object} userAuth - Información de autenticación del usuario (opcional)
 * @returns {Contract} Contrato de Fabric
 */
export async function connectFabric(contractName, userAuth = null) {
    let client = null;
    
    try {
        // Conectar al peer según el usuario
        client = await newGrpcConnection(userAuth);
    } catch (error) {
        console.error("Error conectando al peer:", error);
        throw error;
    }

    try {
        let gateway;
        
        // Si tenemos información de autenticación del usuario, usarla
        if (userAuth && userAuth.identity) {
            // Obtener la identidad del wallet
            const identity = {
                mspId: userAuth.mspId,
                credentials: Buffer.from(userAuth.identity.credentials.certificate)
            };
            
            // Crear el signer con la clave privada del usuario
            const privateKey = crypto.createPrivateKey(Buffer.from(userAuth.identity.credentials.privateKey));
            const signer = signers.newPrivateKeySigner(privateKey);
            
            // Verificar permisos si se especifica un contrato y no es una consulta general
            if (contractName !== 'BaseContract' && contractName.toLowerCase() !== 'querycontract') {
                // Verificar si el usuario tiene permiso para este contrato
                const hasPermission = await identityManager.checkPermission(userAuth, contractName, 'ANY');
                if (!hasPermission) {
                    throw new Error(`El usuario ${userAuth.username} no tiene permiso para acceder al contrato ${contractName}`);
                }
            }
            
            // Conectar a la gateway con la identidad del usuario
            gateway = connect({ client, identity, signer });
        } else {
            // Fallar a la identidad del sistema si no hay usuario autenticado
            const identity = {
                mspId: MSPID,
                credentials: Buffer.from(CERT_USER)
            };
            
            const privateKey = crypto.createPrivateKey(Buffer.from(KEY_USER));
            const signer = signers.newPrivateKeySigner(privateKey);
            
            gateway = connect({ client, identity, signer });
        }
        
        const network = gateway.getNetwork(CHANNEL);
        const contract = network.getContract(CHAINCODE, contractName);
        return contract;
    } catch (error) {
        console.error("Error conectando a la gateway:", error);
        throw error;
    }
}