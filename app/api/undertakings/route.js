import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getUndertakings, createUndertaking } from "@/lib/db";

const NameSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const undertakings = await getUndertakings();
  return NextResponse.json(undertakings);
}

export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = NameSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });
  const undertaking = await createUndertaking(result.data.name);
  return NextResponse.json(undertaking, { status: 201 });
}
