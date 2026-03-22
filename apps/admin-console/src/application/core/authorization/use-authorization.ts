"use client";

import {
  canAccess,
  canAccessPath,
  filterNavItemsByAccess,
  type AccessAction,
  type AuthorizationUser,
} from "@workspace/auth";
import { useCallback, useMemo } from "react";
import { useUser } from "@/application/core/context/UserContext";
import type { NavItem } from "@/application/core/@types/Sidebar/NavItem";

export function useAuthorization() {
  const { user, isLoading } = useUser();

  const authUser = user as AuthorizationUser | null;

  const can = useCallback(
    (resource: string, action: AccessAction, params?: Record<string, unknown>) =>
      canAccess(authUser, {
        app: "admin-console",
        resource,
        action,
        params,
      }),
    [authUser],
  );

  const canPath = useCallback(
    (pathname: string, params?: Record<string, unknown>) =>
      canAccessPath(authUser, "admin-console", pathname, params),
    [authUser],
  );

  const filterNavItems = useCallback(
    (items: NavItem[]) => filterNavItemsByAccess("admin-console", authUser, items),
    [authUser],
  );

  return useMemo(
    () => ({
      user,
      isLoading,
      can,
      canPath,
      filterNavItems,
    }),
    [can, canPath, filterNavItems, isLoading, user],
  );
}
