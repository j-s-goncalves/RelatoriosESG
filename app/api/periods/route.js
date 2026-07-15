import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionAndUndertaking } from "@/lib/session";
import { getPeriods, createPeriod, cloneBlocksToPeriod } from "@/lib/db";

const CreatePeriodSchema = z.object({
  label: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clone_from_period_id: z.number().int().nullable().default(null),
});

export async function GET() {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });

  const periods = await getPeriods(undertaking.id);
  return NextResponse.json(periods);
}

export async function POST(request) {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });

  const body = await request.json();
  const result = CreatePeriodSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  const { label, start_date, end_date, clone_from_period_id } = result.data;
  const period = await createPeriod(undertaking.id, { label, start_date, end_date });

  if (clone_from_period_id) {
    await cloneBlocksToPeriod(clone_from_period_id, period.id, undertaking.id);
  }

  return NextResponse.json(period, { status: 201 });
}
