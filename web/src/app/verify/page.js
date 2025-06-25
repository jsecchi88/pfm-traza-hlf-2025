import MetaMaskSignatureExample from '@/components/MetaMaskSignatureExample';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Validación de identidad con MetaMask
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Utiliza MetaMask para verificar tu identidad mediante firma criptográfica
          </p>
        </div>
        
        <MetaMaskSignatureExample />
        
        <div className="mt-12 max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">¿Cómo funciona?</h2>
          <p className="text-gray-700 mb-4">
            Esta validación utiliza criptografía de clave pública para verificar tu identidad sin 
            necesidad de contraseñas. El proceso es el siguiente:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>MetaMask firma un mensaje con tu clave privada (que nunca sale de tu navegador)</li>
            <li>Nuestra API recibe la firma y el mensaje</li>
            <li>Recuperamos la dirección del firmante a partir de la firma</li>
            <li>Verificamos que la dirección recuperada coincida con la dirección proporcionada</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
