import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { getBlocksForPeriod } from "@/lib/db";
import { getAllDisclosures } from "@/lib/disclosureRegistry";

/**
 * GET /api/report/status
 * Devolve o estado de todos os disclosures para o período activo.
 */
export async function GET() {
  const { session, undertaking, period } = await getSessionContext();
  if (!session)     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!undertaking) return NextResponse.json({ error: "No active undertaking" }, { status: 400 });
  if (!period)      return NextResponse.json({ error: "No active period" }, { status: 400 });

  const blocks = await getBlocksForPeriod(period.id);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.questionnaire_code, b]));

  const disclosures = getAllDisclosures();
  const statuses = disclosures.map((d) => {
    const block = blockMap[d.code];
    return {
      code:       d.code,
      title:      d.short_label,
      state:      block?.state      ?? "nao_iniciado",
      provenance: block?.provenance ?? null,
      updated_at: block?.updated_at ?? null,
    };
  });

  const counts = {
    total:        statuses.length,
    nao_iniciado: statuses.filter((s) => s.state === "nao_iniciado").length,
    elaboracao:   statuses.filter((s) => s.state === "elaboracao").length,
    aprovacao:    statuses.filter((s) => s.state === "aprovacao").length,
    aprovado:     statuses.filter((s) => s.state === "aprovado").length,
  };

  return NextResponse.json({ period, undertaking: { id: undertaking.id, name: undertaking.name }, counts, statuses });
}
