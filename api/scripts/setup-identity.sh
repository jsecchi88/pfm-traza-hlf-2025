#!/bin/bash

# Script de inicialización para Fabric CA y gestión de identidades

# Colores para una mejor visualización
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

# Directorio base
BASE_DIR="$(pwd)"
API_DIR="${BASE_DIR}/api"
FABRIC_SAMPLES="${BASE_DIR}/fabric-samples"

echo -e "${YELLOW}==== Inicializando el entorno de gestión de identidad ====${NC}"

# Verificar que Fabric Samples esté instalado
if [ ! -d "$FABRIC_SAMPLES" ]; then
    echo -e "${RED}Error: No se encontró el directorio fabric-samples.${NC}"
    echo "Por favor, ejecute el script install-fabric.sh para descargar Fabric Samples."
    exit 1
fi

# Crear directorios necesarios
echo -e "${GREEN}Creando directorios de wallets...${NC}"
mkdir -p "${API_DIR}/wallets/org1"
mkdir -p "${API_DIR}/wallets/org2"

# Verificar que la red de Fabric esté en ejecución
cd "$FABRIC_SAMPLES/test-network"

NETWORK_STATUS=$(./network.sh status | grep "not running")
if [[ ! -z "$NETWORK_STATUS" ]]; then
    echo -e "${RED}La red de Hyperledger Fabric no está en ejecución.${NC}"
    echo -e "${YELLOW}¿Desea iniciar la red ahora? [y/n]${NC}"
    read -r START_NETWORK
    if [[ "$START_NETWORK" == "y" || "$START_NETWORK" == "Y" ]]; then
        echo -e "${GREEN}Iniciando la red Hyperledger Fabric...${NC}"
        ./network.sh up createChannel -c mychannel -ca
    else
        echo "Para usar la gestión de identidad, la red debe estar en ejecución."
        exit 1
    fi
fi

# Verificar instalación del chaincode
echo -e "${YELLOW}Verificando instalación del chaincode...${NC}"
CHAINCODE_INSTALLED=$(./network.sh chaincode list | grep "basicts")
if [[ -z "$CHAINCODE_INSTALLED" ]]; then
    echo -e "${RED}El chaincode 'basicts' no está instalado.${NC}"
    echo -e "${YELLOW}¿Desea instalarlo ahora? [y/n]${NC}"
    read -r INSTALL_CHAINCODE
    if [[ "$INSTALL_CHAINCODE" == "y" || "$INSTALL_CHAINCODE" == "Y" ]]; then
        echo -e "${GREEN}Instalando y desplegando el chaincode...${NC}"
        cd "$BASE_DIR"
        # Aquí deberías tener tu script para instalar el chaincode
        echo "Implementa la lógica para instalar el chaincode"
    else
        echo "Para usar la gestión de identidad, el chaincode debe estar instalado."
        exit 1
    fi
fi

# Volver al directorio base
cd "$BASE_DIR"

# Instalar dependencias necesarias
echo -e "${GREEN}Instalando dependencias...${NC}"
cd "$API_DIR"
npm install jsonwebtoken dotenv fabric-ca-client

# Matricular administradores
echo -e "${GREEN}Matriculando administradores...${NC}"
node scripts/enrollAdmins.js

# Registrar usuarios iniciales
echo -e "${GREEN}Registrando usuarios iniciales...${NC}"
node scripts/registerUsers.js

echo -e "${GREEN}==== Inicialización completa ====${NC}"
echo -e "${YELLOW}Ahora puede iniciar la API con:${NC}"
echo -e "cd $API_DIR && node app.js"

cd "$BASE_DIR"
