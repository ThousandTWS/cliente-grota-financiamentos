export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canChangeProposalStatus?: boolean;
  allowedDealerIds?: number[];
  allowedDealersCount?: number;
}

const userServices = {
  async me(): Promise<AuthenticatedUser> {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Nao autenticado");
    }

    const { user } = (await response.json()) as { user: AuthenticatedUser };
    return user;
  },
};

export default userServices;
