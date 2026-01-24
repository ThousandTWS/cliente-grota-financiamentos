import { NextResponse } from "next/server";
import { adminApiFetch } from "../../_lib/admin-api";
import {
  clearAdminSession,
  getAdminSession,
  unauthorizedResponse,
} from "../../_lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await adminApiFetch("/auth/me", {
    session,
    retryOnAuthError: false,
  });

  if ("error" in result) {
    return result.error;
  }

  const profileResponse = result.response;
  if (!profileResponse.ok) {
    await clearAdminSession();
    return unauthorizedResponse();
  }

  const user = await profileResponse.json().catch(() => null);
  return NextResponse.json({ user });
}
