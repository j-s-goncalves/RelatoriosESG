import { NextResponse } from "next/server";
import { z } from "zod";
import { getBlock, upsertBlock } from "@/lib/db";
import { emptyB8 } from "@/lib/b8Definition";

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
  const data = await getBlock("B8");
  return NextResponse.json(data ?? emptyB8());
}

export async function PUT(request) {
  const body = await request.json();
  const result = MiniQuestionnaireSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 422 });
  }
  await upsertBlock("B8", result.data);
  return NextResponse.json({ ok: true });
}
