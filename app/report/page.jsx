import { getSessionContext } from "@/lib/session";
import { getBlocksForPeriod } from "@/lib/db";
import { getAllDisclosures } from "@/lib/disclosureRegistry";
import { summarizeCompleteness, validateCross, getRequiredCodes } from "@/lib/completeness";

export const metadata = { title: "Relatório — RelatoriosESG" };

const STATE_CONFIG = {
  nao_iniciado: { label: "Não iniciado", color: "#999",    bg: "#f5f5f5" },
  elaboracao:   { label: "Elaboração",   color: "#555",    bg: "#f0f0f0" },
  aprovacao:    { label: "Ag. aprovação",color: "#8a6000", bg: "#fff8e1" },
  aprovado:     { label: "Aprovado",     color: "#1a6e1a", bg: "#e8f5e9" },
};

function Badge({ state }) {
  const s = STATE_CONFIG[state] ?? STATE_CONFIG.nao_iniciado;
  return (
    <span style={{
      padding: "0.15rem 0.5rem", borderRadius: "3px",
      fontSize: "0.75rem", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

export default async function ReportPage() {
  const { session, undertaking, period } = await getSessionContext();

  if (!session) {
    return <div style={{ margin: "2rem", fontFamily: "sans-serif" }}>Não autenticado.</div>;
  }
  if (!undertaking) {
    return <div style={{ margin: "2rem", fontFamily: "sans-serif" }}>Sem empresa activa.</div>;
  }
  if (!period) {
    return (
      <div style={{ margin: "2rem", fontFamily: "sans-serif" }}>
        Sem período activo. <a href="/periods">Criar período</a>
      </div>
    );
  }

  const blocks = await getBlocksForPeriod(period.id);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.questionnaire_code, b]));
  const disclosures = getAllDisclosures();

  // Completude e validação cruzada (Fase 8)
  const completeness = summarizeCompleteness(disclosures, blockMap);
  const completenessMap = Object.fromEntries(completeness.map((c) => [c.code, c]));
  const { warnings } = validateCross(blockMap);

  const b1Content = blockMap["B1_PERIOD_METRICS"]?.content;
  const headcount      = b1Content?.cells?.["headcount::value"] ?? null;
  const selectedModule = b1Content?.meta?.["selected_module"]   ?? null;
  const requiredCodes  = getRequiredCodes(headcount, selectedModule);

  const statuses = disclosures.map((d) => ({
    ...d,
    state:      blockMap[d.code]?.state      ?? "nao_iniciado",
    updated_at: blockMap[d.code]?.updated_at ?? null,
    completeness: completenessMap[d.code],
    required: requiredCodes.size === 0 || requiredCodes.has(d.code),
  }));

  const counts = {
    aprovado:     statuses.filter((s) => s.state === "aprovado").length,
    aprovacao:    statuses.filter((s) => s.state === "aprovacao").length,
    elaboracao:   statuses.filter((s) => s.state === "elaboracao").length,
    nao_iniciado: statuses.filter((s) => s.state === "nao_iniciado").length,
  };
  const pctAprovado = Math.round((counts.aprovado / statuses.length) * 100);

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>Relatório ESG VSME</h1>
      <p style={{ color: "#666", fontSize: "0.9rem", marginTop: 0 }}>
        {undertaking.name} · {period.label}
      </p>

      {/* Progress summary */}
      <div style={{
        display: "flex", gap: "1rem", flexWrap: "wrap",
        margin: "1.25rem 0",
        padding: "0.75rem 1rem",
        background: "#f8f9fa", border: "1px solid #e8e8e8", borderRadius: "4px",
      }}>
        <span style={{ fontSize: "1.5rem", fontWeight: 700, color: pctAprovado === 100 ? "#1a6e1a" : "#333" }}>
          {pctAprovado}%
        </span>
        <div style={{ fontSize: "0.85rem", color: "#555", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          <span><strong>{counts.aprovado}</strong> aprovados</span>
          <span><strong>{counts.aprovacao}</strong> ag. aprovação</span>
          <span><strong>{counts.elaboracao}</strong> em elaboração</span>
          <span><strong>{counts.nao_iniciado}</strong> não iniciados</span>
        </div>
        <div style={{ marginLeft: "auto", alignSelf: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            <a
              href="/api/report/xhtml"
              style={{
                padding: "0.4rem 0.9rem", borderRadius: "4px",
                background: "#0070f3", color: "#fff",
                textDecoration: "none", fontSize: "0.85rem", textAlign: "center",
              }}
            >
              Exportar XHTML
            </a>
            <a
              href="/api/report/ixbrl"
              style={{
                padding: "0.4rem 0.9rem", borderRadius: "4px",
                background: "#1a6e1a", color: "#fff",
                textDecoration: "none", fontSize: "0.85rem", textAlign: "center",
              }}
            >
              Exportar iXBRL
            </a>
          </div>
        </div>
      </div>

      {/* Avisos de validação cruzada */}
      {warnings.length > 0 && (
        <div style={{
          margin: "1rem 0", padding: "0.75rem 1rem",
          background: "#fff8e1", border: "1px solid #f5c518", borderRadius: "4px",
          fontSize: "0.85rem",
        }}>
          <strong style={{ color: "#8a6000" }}>Inconsistências detectadas</strong>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.25rem" }}>
            {warnings.map((w, i) => (
              <li key={i} style={{ color: "#5a3e00", marginBottom: "0.2rem" }}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclosure list */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem", border: "1px solid #ddd" }}>Divulgação</th>
            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem", border: "1px solid #ddd", whiteSpace: "nowrap" }}>Completude</th>
            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem", border: "1px solid #ddd", whiteSpace: "nowrap" }}>Estado</th>
            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem", border: "1px solid #ddd", whiteSpace: "nowrap" }}>Última actualização</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((s) => {
            const cStatus = s.completeness?.status ?? "nao_iniciado";
            const cConfig = {
              completo:     { label: "Completo",     color: "#1a6e1a", bg: "#e8f5e9" },
              incompleto:   { label: "Incompleto",   color: "#8a4000", bg: "#fff3e0" },
              nao_iniciado: { label: "Não iniciado", color: "#888",    bg: "#f5f5f5" },
            }[cStatus] ?? { label: "—", color: "#888", bg: "#f5f5f5" };
            return (
              <tr key={s.code} style={{ borderBottom: "1px solid #eee", opacity: s.required ? 1 : 0.6 }}>
                <td style={{ padding: "0.4rem 0.6rem", border: "1px solid #eee" }}>
                  <a href={`/disclosure/${s.code}`} style={{ color: "#0070f3", textDecoration: "none" }}>
                    {s.short_label}
                  </a>
                  {!s.required && (
                    <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", color: "#bbb" }}>voluntário</span>
                  )}
                </td>
                <td style={{ padding: "0.4rem 0.6rem", border: "1px solid #eee" }}>
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 600,
                    color: cConfig.color, background: cConfig.bg,
                    padding: "0.1rem 0.45rem", borderRadius: "3px",
                  }}>
                    {cConfig.label}
                  </span>
                </td>
                <td style={{ padding: "0.4rem 0.6rem", border: "1px solid #eee" }}>
                  <Badge state={s.state} />
                </td>
                <td style={{ padding: "0.4rem 0.6rem", border: "1px solid #eee", color: "#888", fontSize: "0.8rem" }}>
                  {s.updated_at
                    ? new Date(s.updated_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
