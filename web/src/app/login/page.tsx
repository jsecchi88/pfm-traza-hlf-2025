'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FormInput from '@/components/FormInput';
import Select from '@/components/Select';
import { User } from '@/models';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    role: '',
  });
  
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación básica
    if (!formData.name.trim() || !formData.organization.trim() || !formData.role) {
      setError('Por favor, completa todos los campos');
      return;
    }

    // En un sistema real, aquí se haría una llamada a la API para autenticar
    // En este ejemplo, simulamos un login exitoso
    const user: User = {
      id: `user-${Date.now()}`,
      name: formData.name,
      organization: formData.organization,
      role: formData.role as User['role'], 
    };

    // Guardar usuario y redirigir
    login(user);
    router.push('/');
  };

  const roleOptions = [
    { value: 'viticultor', label: 'Viticultor' },
    { value: 'bodega', label: 'Bodega' },
    { value: 'transportista', label: 'Transportista' },
    { value: 'distribuidor', label: 'Distribuidor' },
    { value: 'minorista', label: 'Minorista' },
    { value: 'regulador', label: 'Regulador / Certificador' },
    { value: 'consumidor', label: 'Consumidor' }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
          <p className="text-gray-600 mt-1">Accede a la plataforma de trazabilidad</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 p-3 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormInput
            id="name"
            label="Nombre"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <FormInput
            id="organization"
            label="Organización"
            value={formData.organization}
            onChange={handleChange}
            required
          />

          <Select
            id="role"
            label="Rol en la red"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            required
          />

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Esta es una versión demo de la plataforma.</p>
            <p>En un entorno real, se requeriría autenticación con certificados X.509.</p>
          </div>
        </form>
      </Card>
    </div>
  );
}
