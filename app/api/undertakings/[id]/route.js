import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { updateUndertaking, deleteUndertaking } from "@/lib/db";

const NameSchema = z.object({ name: z.string().min(1) });

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt((await params).id, 10);
  const body = await request.json();
  const result = NameSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });
  const updated = await updateUndertaking(id, result.data.name);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt((await params).id, 10);
  await deleteUndertaking(id);
  return NextResponse.json({ ok: true });
}
