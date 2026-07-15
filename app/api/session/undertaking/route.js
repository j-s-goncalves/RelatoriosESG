import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getUserAuthorizedUndertakings } from "@/lib/db";

const Schema = z.object({ undertaking_id: z.number().int() });

export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = Schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  const { undertaking_id } = result.data;
  const authorized = await getUserAuthorizedUndertakings(session.user.id);
  if (!authorized.find((u) => u.id === undertaking_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("active_undertaking_id", String(undertaking_id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
