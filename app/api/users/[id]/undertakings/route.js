import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getUserAuthorizedUndertakings, setUserUndertakings } from "@/lib/db";

const IdsSchema = z.object({ undertaking_ids: z.array(z.number().int()) });

export async function GET(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt((await params).id, 10);
  const undertakings = await getUserAuthorizedUndertakings(id);
  return NextResponse.json(undertakings);
}

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt((await params).id, 10);
  const body = await request.json();
  const result = IdsSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });
  await setUserUndertakings(id, result.data.undertaking_ids);
  return NextResponse.json({ ok: true });
}
