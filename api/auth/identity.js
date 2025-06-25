/**
 * Módulo de Gestión de Identidad para la aplicación de trazabilidad de vino
 * 
 * Este módulo maneja la autenticación y autorización basada en certificados X.509,
 * integra con el MSP (Membership Service Provider) de Hyperledger Fabric y
 * proporciona control de acceso basado en roles.
 */

import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { promisify } from 'util';
import { X509Certificate } from 'crypto';
import { Gateway, Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';

const __dirname = dirname(".");

// Rutas de certificados y configuración del MSP
const ROOT = path.resolve(__dirname, "../../fabric-samples/test-network");
const BASE_ORG1 = `${ROOT}/organizations/peerOrganizations/org1.example.com`;
const BASE_ORG2 = `${ROOT}/organizations/peerOrganizations/org2.example.com`;
const BASE_ORDERER = `${ROOT}/organizations/ordererOrganizations/example.com`;

// Mapeo de roles a organizaciones
const ROLE_TO_ORG = {
  'Viticultor': 'org1',
  'Bodega': 'org1',
  'Transportista': 'org1',
  'Distribuidor': 'org2',
  'Minorista': 'org2',
  'Regulador': 'org2',
  'Consumidor': 'org2'
};

// Mapeo de organizaciones a MSPs
const ORG_TO_MSP = {
  'org1': 'Org1MSP',
  'org2': 'Org2MSP'
};

// Clase para gestión de identidades
export class IdentityManager {
  constructor() {
    this.wallets = {};
    this.caClients = {};
    this.initialized = false;
  }

  /**
   * Inicializa el gestor de identidad
   */
  async initialize() {
    if (this.initialized) return;

    // Configurar wallet para cada organización
    this.wallets.org1 = await Wallets.newFileSystemWallet(path.join(__dirname, 'wallets', 'org1'));
    this.wallets.org2 = await Wallets.newFileSystemWallet(path.join(__dirname, 'wallets', 'org2'));
    
    // Configurar conexión a Fabric CA para cada organización
    try {
      const org1CACert = fs.readFileSync(`${BASE_ORG1}/ca/ca.org1.example.com-cert.pem`, 'utf8');
      const org2CACert = fs.readFileSync(`${BASE_ORG2}/ca/ca.org2.example.com-cert.pem`, 'utf8');
      
      this.caClients.org1 = new FabricCAServices('https://ca.org1.example.com:7054', {
        trustedRoots: org1CACert,
        verify: false
      }, 'ca-org1');
      
      this.caClients.org2 = new FabricCAServices('https://ca.org2.example.com:7054', {
        trustedRoots: org2CACert,
        verify: false
      }, 'ca-org2');
      
      this.initialized = true;
      console.log('Identity manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize identity manager:', error);
      throw error;
    }
  }

  /**
   * Registra y matricula un nuevo usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @param {string} role - Rol del usuario (Viticultor, Bodega, etc.)
   * @param {Object} attributes - Atributos adicionales del usuario
   * @returns {Object} - Información del usuario registrado
   */
  async registerUser(username, password, role, attributes = {}) {
    await this.initialize();
    
    // Determinar la organización basada en el rol
    const org = ROLE_TO_ORG[role];
    if (!org) {
      throw new Error(`Rol no válido: ${role}`);
    }
    
    const wallet = this.wallets[org];
    const caClient = this.caClients[org];
    const mspId = ORG_TO_MSP[org];
    
    // Verificar si el usuario ya existe
    const userIdentity = await wallet.get(username);
    if (userIdentity) {
      throw new Error(`El usuario ${username} ya está registrado`);
    }
    
    // Obtener admin para el registro
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error(`Admin no encontrado, ejecute el script de registro de admin primero`);
    }
    
    // Crear proveedor para admin
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    
    // Registrar el usuario
    const attrList = [
      {
        name: 'role',
        value: role,
        ecert: true
      },
      ...Object.entries(attributes).map(([key, value]) => ({
        name: key,
        value: String(value),
        ecert: true
      }))
    ];
    
    // Registrar el usuario en Fabric CA
    const secret = await caClient.register({
      affiliation: org === 'org1' ? 'org1.department1' : 'org2.department1',
      enrollmentID: username,
      role: 'client',
      attrs: attrList
    }, adminUser);
    
    // Matricular el usuario
    const enrollment = await caClient.enroll({
      enrollmentID: username,
      enrollmentSecret: secret
    });
    
    // Crear y guardar la identidad en el wallet
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: mspId,
      type: 'X.509',
    };
    
    await wallet.put(username, x509Identity);
    
    return {
      username,
      role,
      organization: org,
      mspId,
      success: true
    };
  }

  /**
   * Autenticar un usuario existente
   * @param {string} username - Nombre de usuario
   * @param {string} role - Rol del usuario (para verificación)
   * @returns {Object} - Objeto de identidad para conexión con Fabric
   */
  async authenticateUser(username, role) {
    await this.initialize();
    
    // Determinar la organización basada en el rol
    const org = ROLE_TO_ORG[role];
    if (!org) {
      throw new Error(`Rol no válido: ${role}`);
    }
    
    const wallet = this.wallets[org];
    
    // Verificar si el usuario existe
    const identity = await wallet.get(username);
    if (!identity) {
      throw new Error(`El usuario ${username} no está registrado`);
    }
    
    // Verificar el rol en el certificado
    const cert = new X509Certificate(identity.credentials.certificate);
    // En un entorno real, aquí verificaríamos los atributos del certificado
    // para confirmar que el rol coincide con el solicitado
    
    return {
      identity,
      username,
      role,
      organization: org,
      mspId: ORG_TO_MSP[org]
    };
  }

  /**
   * Verifica si un usuario tiene permiso para una operación específica
   * @param {Object} userAuth - Información de autenticación del usuario
   * @param {string} contractName - Nombre del contrato
   * @param {string} functionName - Nombre de la función
   * @returns {boolean} - True si el usuario tiene permiso
   */
  async checkPermission(userAuth, contractName, functionName) {
    // Mapa de permisos basado en roles
    const permissionsMap = {
      'ViticultorContract': {
        'registrarCosecha': ['Viticultor'],
        'registrarParcela': ['Viticultor'],
        'registrarInsumo': ['Viticultor'],
        'transferirCosecha': ['Viticultor'],
        'registrarAnalisisCosecha': ['Viticultor'],
      },
      'BodegaContract': {
        'recibirCosecha': ['Bodega'],
        'iniciarElaboracion': ['Bodega'],
        'registrarAnalisis': ['Bodega'],
        'registrarEmbotellado': ['Bodega'],
      },
      'TransportistaContract': {
        'iniciarTransporte': ['Transportista'],
        'registrarCondiciones': ['Transportista'],
        'completarTransporte': ['Transportista'],
      },
      // Agregar más contratos y funciones según sea necesario
    };
    
    // Verificar si el contrato existe en el mapa de permisos
    if (!permissionsMap[contractName]) {
      // Contrato no encontrado en el mapa, denegar por defecto
      console.warn(`Contrato ${contractName} no tiene mapa de permisos definido`);
      return false;
    }
    
    // Verificar si la función existe en el contrato
    if (!permissionsMap[contractName][functionName]) {
      // Función no encontrada en el contrato, denegar por defecto
      console.warn(`Función ${functionName} no tiene permisos definidos en contrato ${contractName}`);
      return false;
    }
    
    // Verificar si el rol del usuario está permitido para esta función
    const allowedRoles = permissionsMap[contractName][functionName];
    return allowedRoles.includes(userAuth.role);
  }

  /**
   * Obtiene la gateway para conectarse a la red con la identidad de un usuario
   * @param {Object} userAuth - Información de autenticación del usuario
   * @returns {Gateway} - Gateway de conexión a Fabric
   */
  async getGateway(userAuth) {
    await this.initialize();
    
    const org = ROLE_TO_ORG[userAuth.role];
    const wallet = this.wallets[org];
    
    // Verificar si el usuario existe
    const identity = await wallet.get(userAuth.username);
    if (!identity) {
      throw new Error(`El usuario ${userAuth.username} no está registrado`);
    }
    
    // Crear la conexión a la gateway
    const gateway = new Gateway();
    
    // Cargar la configuración de conexión
    const connectionProfilePath = path.join(__dirname, `connection-${org}.json`);
    const connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));
    
    // Conectar a la gateway
    await gateway.connect(connectionProfile, {
      wallet,
      identity: userAuth.username,
      discovery: { enabled: true, asLocalhost: true }
    });
    
    return gateway;
  }
}

// Singleton para gestión de identidad
export const identityManager = new IdentityManager();

// Middleware de autenticación para Express
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Se requiere token de autenticación' });
    }
    
    // En un entorno real, aquí decodificaríamos el JWT o token de sesión
    // Para simplificar, asumimos un formato simple: username:role
    const [username, role] = token.split(':');
    
    try {
      const userAuth = await identityManager.authenticateUser(username, role);
      req.userAuth = userAuth; // Adjuntar la información de autenticación a la solicitud
      next();
    } catch (error) {
      console.error('Error de autenticación:', error);
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificación de roles
export const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.userAuth) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (Array.isArray(roles) && !roles.includes(req.userAuth.role)) {
      return res.status(403).json({ error: 'No autorizado para este recurso' });
    }
    
    next();
  };
};
