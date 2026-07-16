import { getSessionContext } from "@/lib/session";
import { getBlocksForPeriod } from "@/lib/db";
import { getAllDisclosures } from "@/lib/disclosureRegistry";
import { renderIxbrlDocument } from "@/lib/ixbrl";

/**
 * GET /api/report/ixbrl
 * Exporta o relatório ESG completo em XHTML com marcação inline XBRL (iXBRL).
 * Critério de conclusão Fase 9: documento estruturalmente válido iXBRL,
 * sem ser fonte de verdade — gerado dinamicamente a partir dos blocos JSONB.
 */
export async function GET() {
  const { session, undertaking, period } = await getSessionContext();
  if (!session)                 return new Response("Não autorizado", { status: 401 });
  if (!undertaking || !period)  return new Response("Sem contexto activo", { status: 400 });

  const blocks = await getBlocksForPeriod(period.id);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.questionnaire_code, b]));

  const disclosures = getAllDisclosures();
  const doc = renderIxbrlDocument(disclosures, blockMap, undertaking, period);

  const filename = `vsme_${undertaking.name.replace(/\s+/g, "_")}_${period.label.replace(/\s+/g, "_")}.xhtml`;

  return new Response(doc, {
    headers: {
      "Content-Type": "application/xhtml+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
