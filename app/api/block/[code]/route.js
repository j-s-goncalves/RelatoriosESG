import { NextResponse } from "next/server";
import { getBlockFull, upsertBlock } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { getDisclosure } from "@/lib/disclosureRegistry";
import { getContentSchema, emptyContent } from "@/lib/blockTypes";

export async function GET(_req, { params }) {
  const { code } = await params;
  const definition = getDisclosure(code);
  if (!definition) return NextResponse.json({ error: "Unknown disclosure code" }, { status: 404 });

  const { session, undertaking, period } = await getSessionContext();
  if (!session)     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });
  if (!period)      return NextResponse.json({ error: "No active period" }, { status: 400 });

  const block = await getBlockFull(period.id, code);
  return NextResponse.json({
    ...(block?.content ?? emptyContent(definition)),
    _meta: {
      state:      block?.state      ?? "elaboracao",
      provenance: block?.provenance ?? "novo",
    },
  });
}

export async function PUT(request, { params }) {
  const { code } = await params;
  const definition = getDisclosure(code);
  if (!definition) return NextResponse.json({ error: "Unknown disclosure code" }, { status: 404 });

  const { session, undertaking, period } = await getSessionContext();
  if (!session)     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });
  if (!period)      return NextResponse.json({ error: "No active period" }, { status: 400 });

  const existing = await getBlockFull(period.id, code);
  if (existing && existing.state !== "elaboracao") {
    return NextResponse.json({ error: "Block is not editable in current state." }, { status: 409 });
  }

  const body = await request.json();
  const schema = getContentSchema(definition.block_type);
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  await upsertBlock(undertaking.id, period.id, code, definition.block_type, result.data);
  return NextResponse.json({ ok: true });
}
