export type FrontendApp = "admin-console" | "dealer-portal" | "public-site";

export type AccessAction =
  | "view"
  | "list"
  | "show"
  | "create"
  | "edit"
  | "delete"
  | "manage"
  | "changeStatus"
  | "analyze"
  | string;

export interface AuthorizationUser {
  id?: number | null;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
  scope?: string | null;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canChangeProposalStatus?: boolean;
  allowedDealerIds?: number[];
}

export interface AccessRequest {
  app: FrontendApp;
  resource: string;
  action: AccessAction;
  params?: Record<string, unknown>;
}

export interface AccessDecision {
  can: boolean;
  reason?: string;
}

type RouteRule = {
  prefix: string;
  resource: string;
  action: AccessAction;
};

type BasicNavSubItem = {
  path: string;
};

type BasicNavItem = {
  path?: string;
  subItems?: BasicNavSubItem[];
};

const ADMIN_ROUTE_RULES: RouteRule[] = [
  { prefix: "/cobrancas/inteligencia", resource: "billing", action: "analyze" },
  { prefix: "/cobrancas", resource: "billing", action: "view" },
  { prefix: "/esteira-de-propostas", resource: "proposals", action: "list" },
  { prefix: "/simulacao/novo", resource: "simulations", action: "create" },
  { prefix: "/propostas/link-cliente", resource: "proposals", action: "create" },
  { prefix: "/vendedores", resource: "team", action: "manage" },
  { prefix: "/operadores", resource: "team", action: "manage" },
  { prefix: "/gestores", resource: "team", action: "manage" },
  { prefix: "/logistas", resource: "stores", action: "manage" },
  { prefix: "/marketplace", resource: "marketplace", action: "view" },
  { prefix: "/visao-geral", resource: "dashboard", action: "view" },
  { prefix: "/configuracoes", resource: "settings", action: "view" },
];

const DEALER_ROUTE_RULES: RouteRule[] = [
  { prefix: "/operador/relatorios", resource: "reports", action: "view" },
  { prefix: "/gestor/relatorios", resource: "reports", action: "view" },
  { prefix: "/gestor/configuracoes", resource: "settings", action: "view" },
  { prefix: "/gestao/propostas", resource: "proposals", action: "list" },
  { prefix: "/minhas-propostas", resource: "proposals", action: "list" },
  { prefix: "/esteira-propostas", resource: "proposals", action: "list" },
  { prefix: "/simulacao-vendedor", resource: "simulations", action: "create" },
  { prefix: "/simulacao/novo", resource: "simulations", action: "create" },
  { prefix: "/simulacao", resource: "simulations", action: "create" },
  { prefix: "/minhas-lojas", resource: "stores", action: "list" },
  { prefix: "/meus-documentos", resource: "documents", action: "list" },
  { prefix: "/documentos", resource: "documents", action: "list" },
  { prefix: "/minhas-operacoes", resource: "dashboard", action: "view" },
  { prefix: "/operacao", resource: "dashboard", action: "view" },
  { prefix: "/dashboard", resource: "dashboard", action: "view" },
  { prefix: "/loja", resource: "stores", action: "list" },
  { prefix: "/gestao", resource: "team", action: "list" },
  { prefix: "/configuracoes", resource: "settings", action: "view" },
  { prefix: "/profile", resource: "profile", action: "view" },
];

const APP_ROUTE_RULES: Record<FrontendApp, RouteRule[]> = {
  "admin-console": ADMIN_ROUTE_RULES,
  "dealer-portal": DEALER_ROUTE_RULES,
  "public-site": [],
};

const APP_ROLE_RULES: Record<FrontendApp, Record<string, string[]>> = {
  "admin-console": {
    ADMIN: ["*:*"],
    COBRANCA: ["dashboard:view", "billing:*", "settings:view"],
    FINANCEIRO: ["dashboard:view", "billing:*", "settings:view"],
  },
  "dealer-portal": {
    ADMIN: ["*:*"],
    LOJISTA: [
      "dashboard:view",
      "profile:*",
      "settings:*",
      "simulations:create",
      "proposals:list",
      "proposals:show",
      "proposals:create",
      "proposals:edit",
      "documents:list",
      "documents:show",
      "documents:create",
    ],
    OPERADOR: [
      "dashboard:view",
      "profile:*",
      "stores:list",
      "stores:show",
      "simulations:create",
      "proposals:list",
      "proposals:show",
      "proposals:create",
      "proposals:edit",
      "proposals:changeStatus",
      "documents:list",
      "documents:show",
      "documents:create",
      "reports:view",
    ],
    GESTOR: [
      "dashboard:view",
      "profile:*",
      "settings:*",
      "stores:list",
      "stores:show",
      "team:list",
      "team:manage",
      "proposals:list",
      "proposals:show",
      "proposals:edit",
      "proposals:changeStatus",
      "documents:list",
      "documents:show",
      "reports:view",
    ],
    VENDEDOR: [
      "dashboard:view",
      "profile:*",
      "simulations:create",
      "proposals:list",
      "proposals:show",
      "proposals:create",
      "documents:list",
      "documents:show",
      "documents:create",
    ],
  },
  "public-site": {
    "*": ["*:*"],
  },
};

const normalizeRole = (role?: string | null) => `${role ?? ""}`.trim().toUpperCase();

const matchesPermission = (
  permissions: string[],
  resource: string,
  action: AccessAction,
) => {
  const exact = `${resource}:${action}`;
  return (
    permissions.includes("*:*") ||
    permissions.includes(exact) ||
    permissions.includes(`${resource}:*`)
  );
};

const passesAcl = (
  user: AuthorizationUser | null | undefined,
  action: AccessAction,
): boolean => {
  if (!user) return false;

  switch (action) {
    case "view":
    case "list":
    case "show":
      return user.canView !== false;
    case "create":
      return user.canCreate !== false;
    case "edit":
    case "manage":
      return user.canUpdate !== false;
    case "delete":
      return user.canDelete !== false;
    case "changeStatus":
      return user.canChangeProposalStatus !== false;
    default:
      return true;
  }
};

const passesAbac = (
  user: AuthorizationUser | null | undefined,
  params?: Record<string, unknown>,
): boolean => {
  if (!user || !params) return true;
  if (normalizeRole(user.role) === "ADMIN") return true;

  const ownerId = Number(params.ownerId ?? params.userId ?? NaN);
  if (Number.isFinite(ownerId) && Number(user.id) !== ownerId) {
    return false;
  }

  const dealerId = Number(params.dealerId ?? NaN);
  const allowedDealerIds = Array.isArray(user.allowedDealerIds)
    ? user.allowedDealerIds.map((value) => Number(value)).filter(Number.isFinite)
    : [];

  if (Number.isFinite(dealerId) && allowedDealerIds.length > 0) {
    return allowedDealerIds.includes(dealerId);
  }

  return true;
};

export const canAccess = (
  user: AuthorizationUser | null | undefined,
  request: AccessRequest,
): AccessDecision => {
  if (request.app === "public-site") {
    return { can: true };
  }

  if (!user) {
    return { can: false, reason: "Usuário não autenticado." };
  }

  const role = normalizeRole(user.role);
  const permissions =
    APP_ROLE_RULES[request.app][role] ??
    APP_ROLE_RULES[request.app]["*"] ??
    [];

  if (!permissions.length) {
    return { can: false, reason: "Perfil sem permissões configuradas." };
  }

  if (!matchesPermission(permissions, request.resource, request.action)) {
    return { can: false, reason: "Ação não permitida para este perfil." };
  }

  if (!passesAcl(user, request.action)) {
    return { can: false, reason: "Bloqueado pelas permissões finas do usuário." };
  }

  if (!passesAbac(user, request.params)) {
    return { can: false, reason: "Bloqueado pelas regras de escopo do recurso." };
  }

  return { can: true };
};

export const resolvePathAccess = (
  app: FrontendApp,
  pathname: string,
): Omit<AccessRequest, "app"> | null => {
  const rules = APP_ROUTE_RULES[app];
  const match = rules.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );

  if (!match) return null;

  return {
    resource: match.resource,
    action: match.action,
  };
};

export const canAccessPath = (
  user: AuthorizationUser | null | undefined,
  app: FrontendApp,
  pathname: string,
  params?: Record<string, unknown>,
): AccessDecision => {
  const resolved = resolvePathAccess(app, pathname);
  if (!resolved) return { can: true };

  return canAccess(user, {
    app,
    resource: resolved.resource,
    action: resolved.action,
    params,
  });
};

export function filterNavItemsByAccess<T extends BasicNavItem>(
  app: FrontendApp,
  user: AuthorizationUser | null | undefined,
  items: T[],
): T[] {
  return items
    .map((item) => {
      const allowedPath =
        !item.path || canAccessPath(user, app, item.path).can;

      const allowedSubItems = item.subItems?.filter((subItem: BasicNavSubItem) =>
        canAccessPath(user, app, subItem.path).can,
      );

      if (item.subItems) {
        if (!allowedSubItems || allowedSubItems.length === 0) {
          return null;
        }

        return {
          ...item,
          subItems: allowedSubItems,
        };
      }

      return allowedPath ? item : null;
    })
    .filter((item): item is T => item !== null);
}
