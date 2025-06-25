# Aplicación Web de Trazabilidad - PFM Traza HLF

Esta aplicación web forma parte del proyecto "PFM Traza HLF 2025", una plataforma descentralizada basada en Hyperledger Fabric para la trazabilidad completa de productos desde su origen hasta el consumidor final.

## Características

- 📋 **Trazabilidad completa**: Visualización del ciclo de vida completo del producto
- 🔍 **Verificación de autenticidad**: Comprobación de autenticidad mediante blockchain
- 📱 **Códigos QR**: Generación de códigos QR para acceso rápido a la información
- 🔐 **Gestión de roles**: Interfaz adaptada según el rol del usuario
- 📊 **Visualización de datos**: Representación clara de datos de trazabilidad
- 💻 **Diseño responsivo**: Adaptado a dispositivos móviles y escritorio

## Tecnologías

- **Next.js**: Framework React con renderizado del lado del servidor
- **TypeScript**: Tipado estático para mayor robustez
- **TailwindCSS**: Framework CSS para diseño rápido y consistente
- **Axios**: Cliente HTTP para comunicaciones con la API
- **Ethers.js**: Biblioteca para interacción con contratos inteligentes
- **React Hook Form**: Gestión de formularios
- **QRCode.react**: Generación de códigos QR

## Estructura del proyecto

```
web/
├─ src/
│  ├─ app/              # Rutas y páginas de la aplicación
│  ├─ components/       # Componentes reutilizables
│  ├─ context/          # Contexto de React para estado global
│  ├─ models/           # Interfaces y tipos de TypeScript
│  ├─ services/         # Servicios para comunicación con API
│  └─ utils/            # Funciones de utilidad
├─ public/              # Archivos estáticos
└─ ...                  # Configuración del proyecto
```

## Rutas principales

- **/** - Página de inicio con información general
- **/login** - Inicio de sesión para los diferentes actores
- **/trazabilidad** - Consulta de trazabilidad por ID de producto
- **/trazabilidad/[id]** - Detalles de trazabilidad de un producto específico

## Comenzando

Para ejecutar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Autenticación

La aplicación incluye un sistema de autenticación que simula el uso de certificados X.509 de Hyperledger Fabric. En un entorno de producción, se integraría directamente con el MSP (Membership Service Provider) de Fabric.

## Roles de usuario

La interfaz se adapta según el rol del usuario conectado:

- **Viticultor**: Gestión de cosechas y parcelas
- **Bodega**: Elaboración de productos y control de calidad
- **Transportista**: Registro de transportes e incidencias
- **Distribuidor**: Gestión de lotes y recepción de productos
- **Minorista**: Control de inventario y ventas
- **Regulador/Certificador**: Verificaciones y certificados
- **Consumidor**: Consulta de información de productos

## Integración con Hyperledger Fabric

Esta aplicación web se comunica con una API REST que a su vez interactúa con la red Hyperledger Fabric. La conexión se realiza a través del endpoint configurado en `next.config.ts`.
