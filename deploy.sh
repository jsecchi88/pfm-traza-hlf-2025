# Starting the Fabric Test Network With Channel
cd fabric-samples/test-network
./network.sh down
./network.sh up createChannel -ca -c mychannel

# Deploying the chaincode on the channel
echo "Deploying chaincode..."
DEPLOY_OUTPUT=$(./network.sh deployCCAAS \
  -ccn basicts \
  -ccp ../asset-transfer-basic/chaincode-typescript \
  -ccl typescript 2>&1)

# Display the output for the user to see
echo "$DEPLOY_OUTPUT"

# Extract the CHAINCODE_ID from the output
CHAINCODE_ID=$(echo "$DEPLOY_OUTPUT" | grep -o "basicts_1.0:[a-zA-Z0-9]*" | head -1)
if [ -z "$CHAINCODE_ID" ]; then
    echo "WARNING: Could not extract CHAINCODE_ID automatically. Please check the logs and set it manually."
    CHAINCODE_ID="basicts_1.0:CHAINCODE_ID_NOT_FOUND"
else
    echo "Extracted CHAINCODE_ID: $CHAINCODE_ID"
fi

# Return to the project root directory
cd ../..
PROJ_PATH=$(pwd)

# Terminal 2 - Deploying Chaincode (Smart-Contract)
cd ./chaincode

# Export environment variables for the chaincode server
export CHAINCODE_SERVER_ADDRESS=host.docker.internal:9998
export CHAINCODE_ID

# Install dependencies and build
npm install
npm run build

# Start the chaincode server
npm run start

# Definimos una función para abrir un nuevo terminal en VS Code
open_new_vscode_terminal() {
    # Esta función usa AppleScript para abrir un nuevo terminal integrado en VS Code
    osascript <<EOF
tell application "Visual Studio Code" to activate
delay 1
tell application "System Events"
    tell process "Code"
        # Usar el atajo de teclado para abrir un nuevo terminal (Ctrl+Shift+`)
        key down {control, shift}
        keystroke "\<"
        key up {control, shift}
        delay 1
    end tell
end tell
EOF
    echo "Nuevo terminal abierto en VS Code"
}

# Llamamos a la función para abrir un nuevo terminal
echo "Abriendo un nuevo terminal para los siguientes pasos..."
open_new_vscode_terminal

# Terminal 3 - Connect API to the Chaincode
cd ./api

# Install dependencies and start the API server
npm i
npm run start

# Return to the project root directory
cd ../..
PROJ_PATH=$(pwd)

# Abrimos otro terminal para el paso de verificación
echo "Abriendo un nuevo terminal para verificar la API..."
open_new_vscode_terminal

#Terminal 4 - Verify Ping
curl http://localhost:5551/ping