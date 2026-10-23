import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/db/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    // Everything except static files, images and the inbound email webhook.
    "/((?!_next/static|_next/image|favicon.ico|api/inbound-email|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
