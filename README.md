# pfm-traza-hlf-2025

Plataforma descentralizada basada en Hyperledger Fabric que permite la trazabilidad completa de productos desde su origen hasta el consumidor final, utilizando registros digitales para representar materias primas y productos terminados.

---

## Diagrama general

```mermaid
graph TD
    A[Viticultor] -->|Entrega uvas| B[Bodega]
    B -->|Elabora vino| C[Distribuidor]
    C -->|Distribuye| D[Minorista]
    D -->|Vende| E[Consumidor]
    B -->|Solicita transporte| F[Transportista]
    F -->|Entrega producto| C
    G[Regulador/Certificador] -.->|Verifica y certifica| B
    G -.->|Verifica| C
    G -.->|Verifica| D
    E -->|Consulta trazabilidad| D
```

---

## Tabla de actores y permisos

<table>
  <thead>
    <tr>
      <th>Actor</th>
      <th>Rol en la red</th>
      <th>Permisos principales</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Viticultor</strong></td>
      <td>Cultiva las uvas</td>
      <td>Registrar cosecha, datos de parcela, insumos utilizados</td>
    </tr>
    <tr>
      <td><strong>Bodega</strong></td>
      <td>Elabora el vino</td>
      <td>Registrar producción, análisis químicos, embotellado</td>
    </tr>
    <tr>
      <td><strong>Transportista</strong></td>
      <td>Moviliza productos entre actores</td>
      <td>Registrar condiciones de transporte (IoT), ubicaciones</td>
    </tr>
    <tr>
      <td><strong>Distribuidor</strong></td>
      <td>Compra y redistribuye botellas</td>
      <td>Confirmar recepción, crear lotes de distribución</td>
    </tr>
    <tr>
      <td><strong>Minorista</strong></td>
      <td>Punto de venta final</td>
      <td>Registrar disponibilidad, confirmar trazabilidad para consumidor</td>
    </tr>
    <tr>
      <td><strong>Regulador/Certificador</strong></td>
      <td>Entidad oficial o consejo regulador</td>
      <td>Verificar autenticidad, registrar certificados de calidad o DO</td>
    </tr>
    <tr>
      <td><strong>Consumidor (lectura)</strong></td>
      <td>Escanea QR o accede desde app móvil</td>
      <td>Solo lectura de datos trazables de una botella específica</td>
    </tr>
  </tbody>
</table>

---

## Descripción general

Esta plataforma permite:
- Registrar digitalmente cada etapa de la cadena de suministro.
- Garantizar la autenticidad y trazabilidad de los productos.
- Facilitar la consulta de información por parte de consumidores y reguladores.
- Integrar sensores IoT y datos de calidad en tiempo real.

Cada actor tiene permisos específicos y todas las acciones quedan registradas de forma inmutable en la blockchain de Hyperledger Fabric.

---

## Instrucciones de despliegue

1. **Clona el repositorio:**
   ```sh
   git clone <URL-del-repositorio>
   cd pfm-traza-hlf-2025
   ```
2. **Instala dependencias en los módulos principales:**
   ```sh
   cd chaincode && npm install
   cd ../api && npm install
   cd ../metamask/supplychain-tracker && npm install
   ```
3. **Despliega la red de Hyperledger Fabric:**
   - Sigue las instrucciones del directorio `fabric-samples` o usa los scripts de red incluidos.
4. **Compila y ejecuta el chaincode en modo externo:**
   ```sh
   cd chaincode
   npm run start:external
   ```
5. **Arranca la API:**
   ```sh
   cd ../api
   npm start
   ```
6. **Arranca la aplicación web (Next.js):**
   ```sh
   cd ../metamask/supplychain-tracker
   npm run dev
   ```
7. **Accede a la plataforma:**
   - API: http://localhost:5551
   - Web: http://localhost:3000

Asegúrate de tener Docker y Node.js instalados. Consulta la documentación de cada subproyecto para detalles avanzados.