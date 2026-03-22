"use client";

import {
  canAccess,
  canAccessPath,
  filterNavItemsByAccess,
  type AccessAction,
  type AuthorizationUser,
} from "@workspace/auth";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import userServices, {
  type AuthenticatedUser,
} from "@/application/services/UserServices/UserServices";
import type { NavItem } from "@/application/core/@types/Sidebar/NavItem";

type AuthorizationContextValue = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  can: (resource: string, action: AccessAction, params?: Record<string, unknown>) => ReturnType<typeof canAccess>;
  canPath: (pathname: string, params?: Record<string, unknown>) => ReturnType<typeof canAccessPath>;
  filterNavItems: (items: NavItem[]) => NavItem[];
};

const AuthorizationContext = createContext<AuthorizationContextValue | undefined>(undefined);

export function AuthorizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userServices.me();
      setUser(data);
    } catch (err) {
      console.warn("[Dealer Authorization] Falha ao carregar usuario", err);
      setUser(null);
      setError("Falha ao carregar usuario.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const authUser = user as AuthorizationUser | null;

  const value = useMemo<AuthorizationContextValue>(
    () => ({
      user,
      isLoading,
      error,
      refreshUser: loadUser,
      can: (resource, action, params) =>
        canAccess(authUser, {
          app: "dealer-portal",
          resource,
          action,
          params,
        }),
      canPath: (pathname, params) =>
        canAccessPath(authUser, "dealer-portal", pathname, params),
      filterNavItems: (items) =>
        filterNavItemsByAccess("dealer-portal", authUser, items),
    }),
    [authUser, error, isLoading, loadUser, user],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (!context) {
    throw new Error("useAuthorization must be used within AuthorizationProvider");
  }
  return context;
}
