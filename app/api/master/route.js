import { NextResponse } from "next/server";
import { getMasterCurrent, createMasterVersion } from "@/lib/db";
import { getSessionAndUndertaking } from "@/lib/session";
import { UndertakingMasterSchema, emptyMaster } from "@/lib/masterDefinition";

export async function GET() {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });

  const row = await getMasterCurrent(undertaking.id);
  return NextResponse.json({
    content: row?.content ?? emptyMaster(),
    valid_from: row?.valid_from ?? null,
    version_id: row?.id ?? null,
  });
}

export async function PUT(request) {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });

  const body = await request.json();
  const result = UndertakingMasterSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  const row = await createMasterVersion(undertaking.id, result.data);
  return NextResponse.json({ ok: true, version_id: row.id, valid_from: row.valid_from });
}
