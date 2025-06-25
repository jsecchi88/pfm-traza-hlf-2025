
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_NAME, ROLES, ROLE_ICONS, APP_LOGO_ICON, MOCK_USERS } from '@/lib/constants';
import { Role } from '@/types';
import { Label } from '@/components/ui/label';
import React from 'react';


export default function RoleSelectionPage() {
  const { login, isAuthenticated, currentRole, currentUser } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<Role>(Role.None);
  const [selectedUserId, setSelectedUserId] = React.useState<string>('');


  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleRoleChange = (roleValue: string) => {
    const role = roleValue as Role;
    setSelectedRole(role);
    setSelectedUserId(''); // Reset user selection when role changes
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleLogin = () => {
    if (selectedRole !== Role.None && selectedUserId) {
      login(selectedRole, selectedUserId);
    } else if (selectedRole !== Role.None && MOCK_USERS[selectedRole]?.length > 0){
      // if no user selected but role has users, pick first one
      login(selectedRole, MOCK_USERS[selectedRole][0].id);
    }
  };

  const availableUsersForRole = selectedRole !== Role.None ? MOCK_USERS[selectedRole] : [];

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-headline text-center text-3xl">¡Bienvenido de nuevo!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Redirigiendo a tu dashboard...</p>
            <p>Rol Actual: {currentRole}</p>
            {currentUser && <p>Usuario: {currentUser.name}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <APP_LOGO_ICON className="mb-4 h-16 w-16 text-primary" />
          <CardTitle className="font-headline text-4xl text-primary">{APP_NAME}</CardTitle>
          <CardDescription className="text-lg">
            Selecciona tu rol para acceder a la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role-select" className="text-sm font-medium">Seleccionar Rol</Label>
            <Select onValueChange={handleRoleChange} defaultValue={selectedRole !== Role.None ? selectedRole : undefined}>
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue placeholder="Elige tu rol..." />
              </SelectTrigger>
              <SelectContent>
                {ROLES.filter(r => r !== Role.None).map((role) => {
                  const Icon = ROLE_ICONS[role];
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{role}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {selectedRole !== Role.None && availableUsersForRole.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="user-select" className="text-sm font-medium">Seleccionar Usuario ({selectedRole})</Label>
              <Select onValueChange={handleUserChange} value={selectedUserId} disabled={availableUsersForRole.length === 0}>
                <SelectTrigger id="user-select" className="w-full">
                  <SelectValue placeholder={`Selecciona un usuario ${selectedRole.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsersForRole.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleLogin} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={selectedRole === Role.None || (availableUsersForRole.length > 0 && !selectedUserId)}
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
        <p>Asegurando transparencia y confianza en las cadenas de suministro.</p>
      </footer>
    </div>
  );
}
