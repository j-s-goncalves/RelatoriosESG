import { getSessionContext } from "@/lib/session";
import { getAllDisclosures } from "@/lib/disclosureRegistry";
import { getBlocksForPeriod } from "@/lib/db";
import { emptyContent } from "@/lib/blockTypes";
import { summarizeCompleteness, getRequiredCodes } from "@/lib/completeness";

export const metadata = { title: "Divulgações — RelatoriosESG" };

const BLOCK_TYPE_LABELS = {
  mini_questionnaire:           "Checklist",
  numeric_metric:               "Métrica numérica",
  structured_table:             "Tabela fixa",
  repeatable_table:             "Tabela repetível",
  repeatable_table_with_totals: "Tabela repetível c/ totais",
  time_series_comparative:      "Série temporal",
  narrative:                    "Narrativa",
};

const COMPLETENESS_CONFIG = {
  completo:     { label: "Completo",     color: "#1a6e1a", bg: "#e8f5e9" },
  incompleto:   { label: "Incompleto",   color: "#8a4000", bg: "#fff3e0" },
  nao_iniciado: { label: "Não iniciado", color: "#777",    bg: "#f0f0f0" },
};

function CompletenessBadge({ status }) {
  const s = COMPLETENESS_CONFIG[status] ?? COMPLETENESS_CONFIG.nao_iniciado;
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600,
      color: s.color, background: s.bg,
      padding: "0.1rem 0.45rem", borderRadius: "3px",
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

export default async function DisclosuresPage() {
  const { session, undertaking, period } = await getSessionContext();

  const disclosures = getAllDisclosures();

  // Sem contexto: mostra lista simples sem completude
  if (!session || !undertaking || !period) {
    return (
      <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Divulgações</h1>
        {!session && <p style={{ color: "#c00", fontSize: "0.9rem" }}>Não autenticado.</p>}
        {session && !undertaking && <p style={{ color: "#888", fontSize: "0.9rem" }}>Sem empresa activa.</p>}
        {session && undertaking && !period && (
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            Sem período activo. <a href="/periods">Criar período</a>
          </p>
        )}
        <DisclosureList disclosures={disclosures} completenessMap={{}} requiredCodes={new Set()} />
      </div>
    );
  }

  const blocks = await getBlocksForPeriod(period.id);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.questionnaire_code, b]));

  // Lê headcount e módulo seleccionado de B1 para determinar obrigatoriedade
  const b1Content = blockMap["B1_PERIOD_METRICS"]?.content;
  const headcount     = b1Content?.cells?.["headcount::value"] ?? null;
  const selectedModule = b1Content?.meta?.["selected_module"] ?? null;
  const requiredCodes = getRequiredCodes(headcount, selectedModule);

  const completeness = summarizeCompleteness(disclosures, blockMap);
  const completenessMap = Object.fromEntries(completeness.map((c) => [c.code, c]));

  const counts = {
    completo:     completeness.filter((c) => c.status === "completo").length,
    incompleto:   completeness.filter((c) => c.status === "incompleto").length,
    nao_iniciado: completeness.filter((c) => c.status === "nao_iniciado").length,
  };

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.4rem" }}>Divulgações</h1>
      <p style={{ color: "#666", fontSize: "0.85rem", marginTop: 0 }}>
        {undertaking.name} · {period.label}
      </p>

      {/* Resumo de completude */}
      <div style={{
        display: "flex", gap: "1.5rem", flexWrap: "wrap",
        padding: "0.6rem 1rem", margin: "1rem 0",
        background: "#f8f9fa", border: "1px solid #e8e8e8", borderRadius: "4px",
        fontSize: "0.85rem",
      }}>
        <span style={{ color: "#1a6e1a" }}><strong>{counts.completo}</strong> completos</span>
        <span style={{ color: "#8a4000" }}><strong>{counts.incompleto}</strong> incompletos</span>
        <span style={{ color: "#777" }}><strong>{counts.nao_iniciado}</strong> não iniciados</span>
        <span style={{ color: "#333" }}>de <strong>{disclosures.length}</strong> total</span>
      </div>

      <DisclosureList disclosures={disclosures} completenessMap={completenessMap} requiredCodes={requiredCodes} />
    </div>
  );
}

function DisclosureList({ disclosures, completenessMap, requiredCodes }) {
  // Agrupa por módulo
  const basicDisclosures = disclosures.filter((d) => d.code.startsWith("B"));
  const comprehensiveDisclosures = disclosures.filter((d) => d.code.startsWith("C"));

  return (
    <div style={{ marginTop: "1rem" }}>
      <DisclosureSection
        title="Módulo Básico"
        items={basicDisclosures}
        completenessMap={completenessMap}
        requiredCodes={requiredCodes}
      />
      {comprehensiveDisclosures.length > 0 && (
        <DisclosureSection
          title="Módulo Abrangente"
          items={comprehensiveDisclosures}
          completenessMap={completenessMap}
          requiredCodes={requiredCodes}
        />
      )}
    </div>
  );
}

function DisclosureSection({ title, items, completenessMap, requiredCodes }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1rem", color: "#444", borderBottom: "1px solid #e0e0e0", paddingBottom: "0.3rem" }}>
        {title}
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((d) => {
          const c = completenessMap[d.code];
          const required = requiredCodes.size === 0 || requiredCodes.has(d.code);
          return (
            <li key={d.code} style={{
              marginBottom: "0.4rem", padding: "0.55rem 0.75rem",
              border: "1px solid #e8e8e8", borderRadius: "4px",
              display: "flex", alignItems: "center", gap: "0.75rem",
              opacity: required ? 1 : 0.65,
            }}>
              <a href={`/disclosure/${d.code}`}
                style={{ textDecoration: "none", color: "#0070f3", fontWeight: 500, flexGrow: 1, fontSize: "0.9rem" }}>
                {d.short_label}
              </a>
              {!required && (
                <span style={{ fontSize: "0.7rem", color: "#aaa", whiteSpace: "nowrap" }}>Voluntário</span>
              )}
              <span style={{
                fontSize: "0.72rem", color: "#aaa",
                background: "#f5f5f5", padding: "0.1rem 0.4rem", borderRadius: "3px",
                whiteSpace: "nowrap",
              }}>
                {BLOCK_TYPE_LABELS[d.block_type] ?? d.block_type}
              </span>
              {c && <CompletenessBadge status={c.status} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
