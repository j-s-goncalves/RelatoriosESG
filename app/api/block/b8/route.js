import { NextResponse } from "next/server";
import { z } from "zod";
import { getBlockFull, upsertBlock } from "@/lib/db";
import { emptyB8 } from "@/lib/b8Definition";
import { getSessionContext } from "@/lib/session";

const ChecklistAnswerSchema = z.object({
  item_code: z.string(),
  value: z.enum(["YES", "NO"]).nullable().default(null),
  specify: z.string().nullable().default(null),
});

const MiniQuestionnaireSchema = z.object({
  questionnaire_code: z.string(),
  answers: z.array(ChecklistAnswerSchema),
});

export async function GET() {
  const { session, undertaking, period } = await getSessionContext();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });
  if (!period) return NextResponse.json({ error: "No active period" }, { status: 400 });

  const block = await getBlockFull(period.id, "B8");
  return NextResponse.json({
    ...(block?.content ?? emptyB8()),
    _meta: {
      state: block?.state ?? "elaboracao",
      provenance: block?.provenance ?? "novo",
    },
  });
}

export async function PUT(request) {
  const { session, undertaking, period } = await getSessionContext();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });
  if (!period) return NextResponse.json({ error: "No active period" }, { status: 400 });

  const block = await getBlockFull(period.id, "B8");
  if (block && block.state !== "elaboracao") {
    return NextResponse.json({ error: "Block is not editable in current state." }, { status: 409 });
  }

  const body = await request.json();
  const result = MiniQuestionnaireSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  await upsertBlock(undertaking.id, period.id, "B8", "mini_questionnaire", result.data);
  return NextResponse.json({ ok: true });
}
