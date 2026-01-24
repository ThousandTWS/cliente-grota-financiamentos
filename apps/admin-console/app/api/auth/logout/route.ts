import { NextResponse } from "next/server";
import { adminApiFetch } from "../../_lib/admin-api";
import { clearAdminSession, getAdminSession } from "../../_lib/session";

export async function POST() {
  const session = await getAdminSession();

  if (session) {
    try {
      await adminApiFetch("/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `refresh_token=${session.refreshToken}; access_token=${session.accessToken}`,
        },
        session,
        retryOnAuthError: false,
      });
    } catch (error) {
      console.warn("[admin][auth] falha ao encerrar sessão no backend", error);
    }
  }

  await clearAdminSession();
  return NextResponse.json({ success: true });
}
