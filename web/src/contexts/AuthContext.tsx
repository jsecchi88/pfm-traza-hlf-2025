"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Role, type User } from '@/types'; // Changed import for Role
import { ROLES, MOCK_USERS } from '@/lib/constants'; // Assuming MOCK_USERS is defined in constants

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  login: (role: Role, userId?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRoleState] = useState<Role>(Role.None);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Persist role in localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem('supplyChainRole') as Role | null;
    const storedUserId = localStorage.getItem('supplyChainUserId');
    if (storedRole && ROLES.includes(storedRole)) {
      if (storedUserId) {
        const user = MOCK_USERS[storedRole]?.find(u => u.id === storedUserId);
        if (user) {
          setCurrentUser({ ...user, role: storedRole });
          setCurrentRoleState(storedRole);
        } else {
          // If user not found, clear storage
          localStorage.removeItem('supplyChainRole');
          localStorage.removeItem('supplyChainUserId');
        }
      } else if (storedRole !== Role.None) {
        // Default to first user of that role if no userId is stored (for simplicity)
        const defaultUser = MOCK_USERS[storedRole]?.[0];
        if (defaultUser) {
          setCurrentUser({ ...defaultUser, role: storedRole });
          setCurrentRoleState(storedRole);
          localStorage.setItem('supplyChainUserId', defaultUser.id);
        }
      }
    }
  }, []);


  const login = (role: Role, userId?: string) => {
    if (role === Role.None) {
      logout();
      return;
    }
    const userToLogin = MOCK_USERS[role]?.find(u => u.id === userId) || MOCK_USERS[role]?.[0];
    if (userToLogin) {
      setCurrentUser({ ...userToLogin, role });
      setCurrentRoleState(role);
      localStorage.setItem('supplyChainRole', role);
      localStorage.setItem('supplyChainUserId', userToLogin.id);
    } else {
      // Handle case where role has no mock users or specific user not found
      setCurrentUser(null);
      setCurrentRoleState(Role.None);
      localStorage.removeItem('supplyChainRole');
      localStorage.removeItem('supplyChainUserId');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRoleState(Role.None);
    localStorage.removeItem('supplyChainRole');
    localStorage.removeItem('supplyChainUserId');
  };
  
  const setCurrentRole = (role: Role) => {
    // This function is primarily for the role selector on the login page.
    // For actual login with user data, use login().
    if (role === Role.None) {
        logout();
    } else {
        // Simplified: just set role, default to first user of that role
        const user = MOCK_USERS[role]?.[0];
        if (user) {
            login(role, user.id);
        } else {
            // If no mock users for role, treat as logout
            logout();
        }
    }
  };


  const isAuthenticated = useMemo(() => currentRole !== Role.None && currentUser !== null, [currentRole, currentUser]);

  const value = useMemo(() => ({
    currentUser,
    currentRole,
    setCurrentRole,
    login,
    logout,
    isAuthenticated,
  }), [currentUser, currentRole, isAuthenticated]); // Removed setCurrentRole from dependencies as it doesn't change

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

