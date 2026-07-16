import { getAllDisclosures } from "@/lib/disclosureRegistry";

export const metadata = { title: "Divulgações — RelatoriosESG" };

const BLOCK_TYPE_LABELS = {
  mini_questionnaire:           "Checklist",
  numeric_metric:               "Métrica numérica",
  structured_table:             "Tabela fixa",
  repeatable_table:             "Tabela repetível",
  repeatable_table_with_totals: "Tabela repetível c/ totais",
  time_series_comparative:      "Série temporal",
};

export default function DisclosuresPage() {
  const disclosures = getAllDisclosures();

  return (
    <div style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.4rem" }}>Divulgações</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Seleccione um bloco de divulgação para editar.
      </p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem" }}>
        {disclosures.map((d) => (
          <li key={d.code} style={{
            marginBottom: "0.5rem", padding: "0.6rem 0.75rem",
            border: "1px solid #e8e8e8", borderRadius: "4px",
            display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <a href={`/disclosure/${d.code}`}
              style={{ textDecoration: "none", color: "#0070f3", fontWeight: 500, flexGrow: 1 }}>
              {d.short_label}
            </a>
            <span style={{
              fontSize: "0.75rem", color: "#888",
              background: "#f0f0f0", padding: "0.1rem 0.5rem", borderRadius: "3px",
            }}>
              {BLOCK_TYPE_LABELS[d.block_type] ?? d.block_type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
