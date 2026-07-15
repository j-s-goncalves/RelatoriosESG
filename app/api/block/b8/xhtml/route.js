import { getBlock } from "@/lib/db";
import { emptyB8 } from "@/lib/b8Definition";
import { renderXhtml } from "@/lib/xhtml";
import { getSessionContext } from "@/lib/session";

export async function GET() {
  const { session, undertaking, period } = await getSessionContext();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!undertaking) return new Response("No active undertaking", { status: 400 });
  if (!period) return new Response("No active period", { status: 400 });

  const data = await getBlock(period.id, "B8");
  const xhtml = renderXhtml(data ?? emptyB8());
  return new Response(xhtml, { headers: { "Content-Type": "application/xhtml+xml" } });
}
