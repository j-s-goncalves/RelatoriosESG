import { NextResponse } from "next/server";
import { z } from "zod";
import { getBlockFull, transitionBlockState } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

const TRANSITIONS = {
  submit: { from: "elaboracao", to: "aprovacao" },
  approve: { from: "aprovacao", to: "aprovado" },
  reject: { from: "aprovacao", to: "elaboracao" },
};

const Schema = z.object({ action: z.enum(["submit", "approve", "reject"]) });

export async function POST(request) {
  const { session, undertaking, period } = await getSessionContext();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });
  if (!period) return NextResponse.json({ error: "No active period" }, { status: 400 });

  const body = await request.json();
  const result = Schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });

  const { action } = result.data;
  const transition = TRANSITIONS[action];

  const block = await getBlockFull(period.id, "B8");
  const currentState = block?.state ?? "elaboracao";

  if (currentState !== transition.from) {
    return NextResponse.json(
      { error: `Cannot ${action} a block in state '${currentState}'.` },
      { status: 409 }
    );
  }

  await transitionBlockState(period.id, "B8", transition.to);
  return NextResponse.json({ ok: true, state: transition.to });
}
