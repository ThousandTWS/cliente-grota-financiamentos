export type SessionScope = "client" | "logista" | "admin";

export interface SessionPayload {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  scope: SessionScope;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
