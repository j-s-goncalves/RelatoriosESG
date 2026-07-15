import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionAndUndertaking } from "@/lib/session";
import { getPeriods } from "@/lib/db";

const Schema = z.object({ period_id: z.number().int() });

export async function POST(request) {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });

  const body = await request.json();
  const result = Schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  const periods = await getPeriods(undertaking.id);
  if (!periods.find((p) => p.id === result.data.period_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("active_period_id", String(result.data.period_id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
