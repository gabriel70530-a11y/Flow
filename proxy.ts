import { NextResponse, type NextRequest } from "next/server";
import { appOpen, isAppRoute } from "@/lib/site";

export function proxy(request: NextRequest) {
  if (appOpen() || !isAppRoute(request.nextUrl.pathname)) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}
