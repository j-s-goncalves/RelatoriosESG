import { getBlock } from "@/lib/db";
import { renderXhtml } from "@/lib/xhtml";
import { getSessionContext } from "@/lib/session";
import { getDisclosure } from "@/lib/disclosureRegistry";
import { emptyContent } from "@/lib/blockTypes";

export async function GET(_req, { params }) {
  const { code } = await params;
  const definition = getDisclosure(code);
  if (!definition) return new Response("Unknown disclosure code", { status: 404 });

  const { session, undertaking, period } = await getSessionContext();
  if (!session)     return new Response("Unauthorized", { status: 401 });
  if (!undertaking) return new Response("No active undertaking", { status: 400 });
  if (!period)      return new Response("No active period", { status: 400 });

  const data = await getBlock(period.id, code);
  const xhtml = renderXhtml(definition, data ?? emptyContent(definition));
  return new Response(xhtml, { headers: { "Content-Type": "application/xhtml+xml" } });
}
