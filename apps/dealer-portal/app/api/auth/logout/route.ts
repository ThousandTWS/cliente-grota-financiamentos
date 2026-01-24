import { NextResponse } from "next/server";
import { dealerApiFetch } from "../../_lib/dealer-api";
import { clearLogistaSession, getLogistaSession } from "../../_lib/session";

export async function POST() {
  const session = await getLogistaSession();

  if (session) {
    try {
      await dealerApiFetch("/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `refresh_token=${session.refreshToken}; access_token=${session.accessToken}`,
        },
        session,
        retryOnAuthError: false,
      });
    } catch (error) {
      console.warn("[logista][auth] Falha ao chamar logout no backend:", error);
    }
  }

  await clearLogistaSession();
  return NextResponse.json({ success: true });
}
