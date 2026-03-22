import arcjet, { detectBot, fixedWindow, shield } from "@arcjet/next";
import { isSpoofedBot } from "@arcjet/inspect";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "../../packages/auth/src";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SCOPE,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

const ARCJET_KEY = process.env.ARCJET_KEY;
const aj = ARCJET_KEY
  ? arcjet({
      key: ARCJET_KEY,
      rules: [
        detectBot({
          mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
          // Block all bots except the following
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
            // Uncomment to allow these other common bot categories
            // See the full list at https://arcjet.com/bot-list
            //"CATEGORY:MONITOR", // Uptime monitoring services
            //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
          ],
        }),
        fixedWindow({
          mode: "LIVE",
          window: "60s",
          max: 60,
        }),
        shield({
          mode: "LIVE",
        }),
      ],
    })
  : null;

const SESSION_SECRET = getAdminSessionSecret();
const PUBLIC_ROUTES = ["/", "/cadastro", "/esqueci-senha", "/verificacao-token"];
const DASHBOARD_ROUTE = "/visao-geral";

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  if (aj) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: "No bots allowed", reason: decision.reason },
          { status: 403 },
        );
      } else {
        return NextResponse.json(
          { error: "Forbidden", reason: decision.reason },
          { status: 403 },
        );
      }
    }

    // Paid Arcjet accounts include additional verification checks using IP data.
    // Verification isn't always possible, so we recommend checking the decision
    // separately.
    // https://docs.arcjet.com/bot-protection/reference#bot-verification
    if (decision.results.some(isSpoofedBot)) {
      return NextResponse.json(
        { error: "Forbidden", reason: decision.reason },
        { status: 403 },
      );
    }
  }

  const sessionValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await decryptSession(sessionValue, SESSION_SECRET);
  const isAuthenticated =
    !!session && session.scope === ADMIN_SESSION_SCOPE && !!session.userId;

  const pathname = request.nextUrl.pathname;
  const publicRoute = isPublicPath(pathname);

  if (!isAuthenticated && !publicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthenticated && publicRoute) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  // PERMISSÕES: Todos os usuários autenticados (ADMIN e outros roles)
  // podem acessar todas as rotas protegidas, incluindo criação de fichas
  // Não há restrição por role neste proxy
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
