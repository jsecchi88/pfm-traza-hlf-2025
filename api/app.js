import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectFabric } from './hlf.js';
import { ethers } from 'ethers';
import { authMiddleware, roleMiddleware, identityManager } from './auth/identity.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = 5551;

// Configuración de middleware
app.use(cors());
app.use(bodyParser.json());

// Secret para JWT (en producción, usar una variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'wine-traceability-secret-key-2025';

// Conexión para endpoints públicos o que no requieren autenticación
const pingContract = await connectFabric("PingContract");

app.get('/ping', async (_req, res) => {
    try {
        const result = await pingContract.submitTransaction('ping');
        console.log(result);
        res.json({ result: Buffer.from(result).toString('utf-8') });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/pingHola/:name', async (req, res) => {
    try {
        const result = await pingContract.submitTransaction('pingHola', req.params.name);
        console.log(result);
        res.json({ result: Buffer.from(result).toString('utf-8') });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.post("/decodeTransaction", async (req, res) => {
    const data = req.body.data;
    try {
        // Parse the transaction data from the request
        const transaction = ethers.Transaction.from(data);

        // Decode and extract relevant transaction details
        const decodedTransaction = {
            to: transaction.to,
            from: transaction.from,
            value: ethers.formatEther(transaction.value),
            nonce: transaction.nonce,
            gasLimit: transaction.gasLimit.toString(),
            gasPrice: transaction.gasPrice ? ethers.formatUnits(transaction.gasPrice, 'gwei') : null,
            data: transaction.data,
            chainId: transaction.chainId,
            type: transaction.type
        };

        res.json({ 
            success: true,
            transaction: decodedTransaction 
        });
    } catch (error) {
        console.error('Error decoding transaction:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ===== ENDPOINTS DE AUTENTICACIÓN Y GESTIÓN DE IDENTIDAD =====

// Registrarse (crear una nueva cuenta)
app.post('/auth/register', async (req, res) => {
    try {
        // En un entorno real, verificaríamos la autorización para crear usuarios
        const { username, password, role, attributes } = req.body;
        
        if (!username || !password || !role) {
            return res.status(400).json({ 
                success: false,
                error: 'Se requieren username, password y role' 
            });
        }
        
        // Registrar el usuario en Fabric CA
        try {
            const result = await identityManager.registerUser(username, password, role, attributes || {});
            
            // Generar JWT para el nuevo usuario
            const token = jwt.sign(
                { username, role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                user: { username, role }
            });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            res.status(500).json({
                success: false,
                error: `Error al registrar usuario: ${error.message}`
            });
        }
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Iniciar sesión
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || !role) {
            return res.status(400).json({ 
                success: false,
                error: 'Se requieren username y role' 
            });
        }
        
        try {
            // Autenticar el usuario
            const userAuth = await identityManager.authenticateUser(username, role);
            
            // En un entorno real, verificaríamos la contraseña aquí
            // Para simplificar, no lo hacemos en este ejemplo
            
            // Generar JWT
            const token = jwt.sign(
                { 
                    username, 
                    role,
                    org: userAuth.organization,
                    mspId: userAuth.mspId
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                token,
                user: { 
                    username, 
                    role,
                    organization: userAuth.organization 
                }
            });
        } catch (error) {
            console.error('Error de autenticación:', error);
            res.status(401).json({
                success: false,
                error: `Credenciales inválidas: ${error.message}`
            });
        }
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Verificar token y obtener información del usuario
app.get('/auth/me', authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: req.userAuth
    });
});

// ====== ENDPOINTS DEL VITICULTOR ======
app.post('/viticultor/cosecha', authMiddleware, roleMiddleware(['Viticultor']), async (req, res) => {
    try {
        const { cosechaId, parcelaId, fecha, variedadUva, cantidadKg, propiedades } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const viticultorContract = await connectFabric("ViticultorContract", req.userAuth);
        
        const result = await viticultorContract.submitTransaction(
            'registrarCosecha',
            cosechaId,
            parcelaId,
            fecha,
            variedadUva,
            cantidadKg,
            JSON.stringify(propiedades)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar cosecha:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/viticultor/parcela', authMiddleware, roleMiddleware(['Viticultor']), async (req, res) => {
    try {
        const { parcelaId, ubicacion, superficie, variedades, propiedades } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const viticultorContract = await connectFabric("ViticultorContract", req.userAuth);
        
        const result = await viticultorContract.submitTransaction(
            'registrarParcela',
            parcelaId,
            JSON.stringify(ubicacion),
            superficie,
            JSON.stringify(variedades),
            JSON.stringify(propiedades)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar parcela:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/viticultor/insumo', authMiddleware, roleMiddleware(['Viticultor']), async (req, res) => {
    try {
        const { insumoId, parcelaId, tipo, nombre, cantidad, fechaAplicacion, detalles } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const viticultorContract = await connectFabric("ViticultorContract", req.userAuth);
        
        const result = await viticultorContract.submitTransaction(
            'registrarInsumo',
            insumoId,
            parcelaId,
            tipo,
            nombre,
            cantidad,
            fechaAplicacion,
            JSON.stringify(detalles)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar insumo:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/viticultor/transferir', authMiddleware, roleMiddleware(['Viticultor']), async (req, res) => {
    try {
        const { cosechaId, destinatarioId } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const viticultorContract = await connectFabric("ViticultorContract", req.userAuth);
        
        const result = await viticultorContract.submitTransaction(
            'transferirCosecha',
            cosechaId,
            destinatarioId
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al transferir cosecha:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/viticultor/analisis-cosecha', authMiddleware, roleMiddleware(['Viticultor']), async (req, res) => {
    try {
        const { cosechaId, resultados } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticada
        const viticultorContract = await connectFabric("ViticultorContract", req.userAuth);
        
        const result = await viticultorContract.submitTransaction(
            'registrarAnalisisCosecha',
            cosechaId,
            JSON.stringify(resultados)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar análisis de cosecha:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS DE LA BODEGA ======
app.post('/bodega/recibir-cosecha', authMiddleware, roleMiddleware(['Bodega']), async (req, res) => {
    try {
        const { cosechaId } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const bodegaContract = await connectFabric("BodegaContract", req.userAuth);
        
        const result = await bodegaContract.submitTransaction(
            'recibirCosecha',
            cosechaId
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al recibir cosecha:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/bodega/iniciar-elaboracion', authMiddleware, roleMiddleware(['Bodega']), async (req, res) => {
    try {
        const { vinoId, cosechaIds, tipoVino, metodoElaboracion, detalles } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const bodegaContract = await connectFabric("BodegaContract", req.userAuth);
        
        const result = await bodegaContract.submitTransaction(
            'iniciarElaboracion',
            vinoId,
            JSON.stringify(cosechaIds),
            tipoVino,
            metodoElaboracion,
            JSON.stringify(detalles)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al iniciar elaboración:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/bodega/registrar-analisis', authMiddleware, roleMiddleware(['Bodega']), async (req, res) => {
    try {
        const { analisisId, vinoId, tipoAnalisis, fechaAnalisis, resultados } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const bodegaContract = await connectFabric("BodegaContract", req.userAuth);
        
        const result = await bodegaContract.submitTransaction(
            'registrarAnalisis',
            analisisId,
            vinoId,
            tipoAnalisis,
            fechaAnalisis,
            JSON.stringify(resultados)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar análisis:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/bodega/embotellado', authMiddleware, roleMiddleware(['Bodega']), async (req, res) => {
    try {
        const { loteId, vinoId, cantidadBotellas, fechaEmbotellado, detalles } = req.body;
        
        // Obtener el contrato con la identidad del usuario autenticado
        const bodegaContract = await connectFabric("BodegaContract", req.userAuth);
        
        const result = await bodegaContract.submitTransaction(
            'registrarEmbotellado',
            loteId,
            vinoId,
            cantidadBotellas,
            fechaEmbotellado,
            JSON.stringify(detalles)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar embotellado:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS DEL TRANSPORTISTA ======
app.post('/transportista/iniciar', async (req, res) => {
    try {
        const { transporteId, loteId, origen, destino, fechaSalida, estimacionLlegada, condicionesIniciales } = req.body;
        
        const result = await transportistaContract.submitTransaction(
            'iniciarTransporte',
            transporteId,
            loteId,
            origen,
            destino,
            fechaSalida,
            estimacionLlegada,
            JSON.stringify(condicionesIniciales)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al iniciar transporte:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/transportista/actualizar-condiciones', async (req, res) => {
    try {
        const { transporteId, ubicacion, temperatura, humedad, otrosDatos } = req.body;
        
        const result = await transportistaContract.submitTransaction(
            'registrarCondiciones',
            transporteId,
            JSON.stringify(ubicacion),
            temperatura,
            humedad,
            JSON.stringify(otrosDatos)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al actualizar condiciones:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/transportista/completar', async (req, res) => {
    try {
        const { transporteId, fechaEntrega, condicionesFinales, notas } = req.body;
        
        const result = await transportistaContract.submitTransaction(
            'completarTransporte',
            transporteId,
            fechaEntrega,
            JSON.stringify(condicionesFinales),
            notas
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al completar transporte:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS DEL DISTRIBUIDOR ======
app.post('/distribuidor/recibir-lote', async (req, res) => {
    try {
        const { loteId } = req.body;
        
        const result = await distribuidorContract.submitTransaction(
            'recibirLote',
            loteId
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al recibir lote:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/distribuidor/transferir-lote', async (req, res) => {
    try {
        const { loteId, minoristaId, cantidad, detalles } = req.body;
        
        const result = await distribuidorContract.submitTransaction(
            'transferirAMinorista',
            loteId,
            minoristaId,
            cantidad,
            JSON.stringify(detalles)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al transferir lote:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS DEL MINORISTA ======
app.post('/minorista/recibir-lote', async (req, res) => {
    try {
        const { loteId } = req.body;
        
        const result = await minoristaContract.submitTransaction(
            'recibirLote',
            loteId
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al recibir lote en minorista:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/minorista/venta', async (req, res) => {
    try {
        const { ventaId, loteId, cantidad, fechaVenta, consumidorId, detalles } = req.body;
        
        const result = await minoristaContract.submitTransaction(
            'registrarVenta',
            ventaId,
            loteId,
            cantidad,
            fechaVenta,
            consumidorId || '',
            JSON.stringify(detalles)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al registrar venta:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS DEL REGULADOR ======
app.post('/regulador/certificar', async (req, res) => {
    try {
        const { certificadoId, assetId, tipoVerificacion, resultado, fechaExpedicion, fechaExpiracion, detalles } = req.body;
        
        const result = await reguladorContract.submitTransaction(
            'emitirCertificado',
            certificadoId,
            assetId,
            tipoVerificacion,
            resultado,
            fechaExpedicion,
            fechaExpiracion,
            JSON.stringify(detalles)
        );
        
        res.json({ 
            success: true,
            result: result.toString() === 'true'
        });
    } catch (error) {
        console.error('Error al emitir certificado:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/regulador/verificar/:certificadoId', async (req, res) => {
    try {
        const certificadoId = req.params.certificadoId;
        
        const result = await reguladorContract.evaluateTransaction(
            'verificarCertificado',
            certificadoId
        );
        
        res.json({ 
            success: true,
            verificado: result.toString() === 'true',
            certificado: JSON.parse(result.toString())
        });
    } catch (error) {
        console.error('Error al verificar certificado:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS DEL CONSUMIDOR ======
app.get('/consumidor/trazar/:loteId', async (req, res) => {
    try {
        const loteId = req.params.loteId;
        
        const result = await consumidorContract.evaluateTransaction(
            'trazarProducto',
            loteId
        );
        
        res.json({ 
            success: true,
            trazabilidad: JSON.parse(result.toString())
        });
    } catch (error) {
        console.error('Error al trazar producto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/consumidor/verificar-autenticidad/:loteId', async (req, res) => {
    try {
        const loteId = req.params.loteId;
        
        const result = await consumidorContract.evaluateTransaction(
            'verificarAutenticidad',
            loteId
        );
        
        res.json({ 
            success: true,
            autentico: result.toString() === 'true',
            detalles: JSON.parse(result.toString())
        });
    } catch (error) {
        console.error('Error al verificar autenticidad:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ENDPOINTS PARA CONSULTAS GENERALES ======
app.get('/asset/:id', authMiddleware, async (req, res) => {
    try {
        const assetId = req.params.id;
        // Usar el contrato base con la identidad del usuario
        const baseContract = await connectFabric("BaseContract", req.userAuth);
        
        const result = await baseContract.evaluateTransaction(
            'readAsset',
            assetId
        );
        
        res.json({ 
            success: true,
            asset: JSON.parse(result.toString())
        });
    } catch (error) {
        console.error('Error al consultar activo:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/asset/:id/history', authMiddleware, async (req, res) => {
    try {
        const assetId = req.params.id;
        // Usar el contrato base con la identidad del usuario
        const baseContract = await connectFabric("BaseContract", req.userAuth);
        
        const result = await baseContract.evaluateTransaction(
            'getAssetHistory',
            assetId
        );
        
        res.json({ 
            success: true,
            history: JSON.parse(result.toString())
        });
    } catch (error) {
        console.error('Error al consultar historial:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/query', authMiddleware, async (req, res) => {
    try {
        const { query } = req.body;
        // Usar el contrato base con la identidad del usuario
        const baseContract = await connectFabric("BaseContract", req.userAuth);
        
        const result = await baseContract.evaluateTransaction(
            'queryAssets',
            JSON.stringify(query)
        );
        
        res.json({ 
            success: true,
            results: JSON.parse(result.toString())
        });
    } catch (error) {
        console.error('Error en consulta:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;