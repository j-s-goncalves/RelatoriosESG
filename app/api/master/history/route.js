import { NextResponse } from "next/server";
import { getMasterHistory } from "@/lib/db";
import { getSessionAndUndertaking } from "@/lib/session";

export async function GET() {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });

  const history = await getMasterHistory(undertaking.id);
  return NextResponse.json(history);
}
