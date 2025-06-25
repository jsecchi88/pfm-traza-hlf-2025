import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectFabric } from './hlf.js';
import { ethers } from 'ethers';
const app = express();

const port = 5551;

// Configuración detallada de CORS para permitir solicitudes desde cualquier origen
app.use(cors({
  origin: '*', // O especifica origen exacto como 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Para procesar JSON en el cuerpo de las solicitudes
app.use(bodyParser.json());

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


app.get('/ping2/:name', async (req, res) => {
    try {
        const result = await pingContract.submitTransaction('ping2', req.params.name);
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

/**
 * Endpoint para validar firmas de MetaMask
 * Requiere:
 * - signature: La firma generada por MetaMask
 * - message: El mensaje original que se firmó
 * - address: La dirección Ethereum que supuestamente firmó el mensaje
 */
app.post("/validateSignature", async (req, res) => {
    // Para depuración
    console.log('Request body:', req.body);
    
    try {
        const { signature, message, address } = req.body;
        
        // Validar que todos los campos requeridos estén presentes
        if (!signature || !message || !address) {
            console.log('Campos faltantes:', { signature: !!signature, message: !!message, address: !!address });
            return res.status(400).json({ 
                success: false, 
                error: "Se requieren los campos signature, message y address" 
            });
        }

        let recoveredAddress;
        let isValid = false;
        
        try {
            console.log('Intentando verificar el mensaje con firma:', { message, signature: signature.substring(0, 20) + '...' });
            
            // Utilizar ethers para verificar el mensaje y recuperar la dirección
            recoveredAddress = ethers.verifyMessage(message, signature);
            console.log('Dirección recuperada:', recoveredAddress);
            
            // Comparar la dirección recuperada con la dirección proporcionada
            isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
            console.log('¿Es válida la firma?', isValid);
        } catch (err) {
            console.error('Error al recuperar dirección:', err);
            return res.status(400).json({ 
                success: false, 
                error: "Firma inválida: " + err.message 
            });
        }
        
        // Asegurarse de que la respuesta sea JSON válido
        const response = {
            success: true,
            isValid: isValid,
            recoveredAddress: recoveredAddress
        };
        
        console.log('Respuesta a enviar:', response);
        res.json(response);
    } catch (error) {
        console.error('Error validando firma:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;