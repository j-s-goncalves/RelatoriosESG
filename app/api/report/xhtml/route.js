import { getSessionContext } from "@/lib/session";
import { getBlocksForPeriod } from "@/lib/db";
import { getAllDisclosures } from "@/lib/disclosureRegistry";
import { emptyContent } from "@/lib/blockTypes";
import { renderBody } from "@/lib/xhtml";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * GET /api/report/xhtml
 * Exporta o relatório ESG completo (todos os disclosures do período activo) em XHTML.
 */
export async function GET() {
  const { session, undertaking, period } = await getSessionContext();
  if (!session)            return new Response("Não autorizado", { status: 401 });
  if (!undertaking || !period) return new Response("Sem contexto activo", { status: 400 });

  const blocks = await getBlocksForPeriod(period.id);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.questionnaire_code, b]));

  const disclosures = getAllDisclosures();

  const sections = disclosures.map((definition) => {
    const block   = blockMap[definition.code];
    const content = block?.content ?? emptyContent(definition);
    const body    = renderBody(definition, content);
    return `    <section>
      <h2>${esc(definition.title)}</h2>
${body}
    </section>`;
  }).join("\n");

  const doc = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Relatório ESG VSME — ${esc(undertaking.name)} — ${esc(period.label)}</title></head>
  <body>
    <h1>Relatório ESG VSME</h1>
    <p><strong>Empresa:</strong> ${esc(undertaking.name)}</p>
    <p><strong>Período:</strong> ${esc(period.label)}</p>
${sections}
  </body>
</html>`;

  return new Response(doc, {
    headers: { "Content-Type": "application/xhtml+xml; charset=utf-8" },
  });
}
