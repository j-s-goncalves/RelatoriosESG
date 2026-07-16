import { flattenItems } from "./blockTypes.js";

// ── XML escape ────────────────────────────────────────────────────────────────

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Shared wrapper ────────────────────────────────────────────────────────────

function wrapXhtml(definition, bodyHtml) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>${esc(definition.title)}</title></head>
  <body>
    <h1>${esc(definition.title)}</h1>
${bodyHtml}
  </body>
</html>`;
}

function confidentialBody() {
  return `    <p><em>Omitido por razões de confidencialidade.</em></p>`;
}

// ── Per-block-type renderers ──────────────────────────────────────────────────

function renderMiniQuestionnaire(definition, content) {
  if (content.omitido_por_confidencialidade) return confidentialBody();

  const items = flattenItems(definition.items);
  const answerMap = Object.fromEntries(
    (content.answers ?? []).map((a) => [a.item_code, a])
  );

  const rows = items.map((item) => {
    const answer = answerMap[item.item_code] ?? {};
    const value = answer.value ?? "—";
    const specify =
      item.allows_specify && answer.value === "YES" ? (answer.specify ?? "") : "";
    return `      <tr><td>${esc(item.label)}</td><td>${esc(value)}</td><td>${esc(specify)}</td></tr>`;
  });

  return `    <table border="1" cellpadding="4" cellspacing="0">
      <thead>
        <tr><th>Item</th><th>Valor</th><th>Especificação</th></tr>
      </thead>
      <tbody>
${rows.join("\n")}
      </tbody>
    </table>`;
}

function renderNumericMetric(definition, content) {
  if (content.omitido_por_confidencialidade) return confidentialBody();

  const unit = definition.unit ?? content.unit ?? "";
  const value = content.value != null ? esc(content.value) : "—";
  const note = content.note
    ? `\n    <p><em>${esc(content.note)}</em></p>`
    : "";

  return `    <p><strong>${value}</strong>${unit ? ` ${esc(unit)}` : ""}</p>${note}`;
}

function renderStructuredTable(definition, content) {
  if (content.omitido_por_confidencialidade) return confidentialBody();

  const rows = definition.rows ?? [];
  const cols = definition.columns ?? [];
  const cells = content.cells ?? {};

  const headerCells =
    `<th>&#160;</th>` +
    cols
      .map(
        (c) =>
          `<th>${esc(c.label)}${c.unit ? ` (${esc(c.unit)})` : ""}</th>`
      )
      .join("");

  const bodyRows = rows.map((row) => {
    const dataCells = cols
      .map((col) => {
        const key = `${row.row_code}::${col.col_code}`;
        return `<td>${esc(cells[key] ?? "—")}</td>`;
      })
      .join("");
    return `      <tr><td><strong>${esc(row.label)}</strong></td>${dataCells}</tr>`;
  });

  return `    <table border="1" cellpadding="4" cellspacing="0">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>
${bodyRows.join("\n")}
      </tbody>
    </table>`;
}

function renderRepeatableTable(definition, content, withTotals) {
  if (content.omitido_por_confidencialidade) return confidentialBody();

  const cols = definition.columns ?? [];
  const rows = content.rows ?? [];

  const headerCells = cols
    .map(
      (c) => `<th>${esc(c.label)}${c.unit ? ` (${esc(c.unit)})` : ""}</th>`
    )
    .join("");

  const bodyRows = rows.map((row) => {
    const dataCells = cols
      .map((col) => `<td>${esc(row.values?.[col.col_code] ?? "—")}</td>`)
      .join("");
    return `      <tr>${dataCells}</tr>`;
  });

  let totalsRow = "";
  if (withTotals && rows.length > 0) {
    const numericCols = cols.filter((c) => c.value_type === "numeric");
    const totals = {};
    for (const col of numericCols) {
      totals[col.col_code] = rows.reduce((sum, row) => {
        const v = row.values?.[col.col_code];
        return sum + (typeof v === "number" ? v : 0);
      }, 0);
    }
    const totalCells = cols
      .map((col, i) =>
        i === 0
          ? `<td><strong>Total</strong></td>`
          : `<td>${totals[col.col_code] != null ? esc(totals[col.col_code]) : ""}</td>`
      )
      .join("");
    totalsRow = `\n      <tr style="font-weight:bold">${totalCells}</tr>`;
  }

  return `    <table border="1" cellpadding="4" cellspacing="0">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>
${bodyRows.join("\n")}${totalsRow}
      </tbody>
    </table>`;
}

function renderTimeSeries(definition, content) {
  if (content.omitido_por_confidencialidade) return confidentialBody();

  const unit = definition.unit ?? content.unit ?? "";
  const entries = content.entries ?? [];

  const rows = entries.map(
    (e) =>
      `      <tr><td>${esc(e.period_label || "—")}</td><td>${esc(e.value ?? "—")}</td></tr>`
  );

  return `    <table border="1" cellpadding="4" cellspacing="0">
      <thead>
        <tr><th>Período</th><th>Valor${unit ? ` (${esc(unit)})` : ""}</th></tr>
      </thead>
      <tbody>
${rows.join("\n")}
      </tbody>
    </table>`;
}

function renderNarrative(definition, content) {
  if (content.omitido_por_confidencialidade) return confidentialBody();
  if (!content.text?.trim()) return `    <p><em>Não preenchido</em></p>`;
  const escaped = content.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  return `    ${paragraphs}`;
}

// ── Public entry points ───────────────────────────────────────────────────────

export function renderBody(definition, content) {
  switch (definition.block_type) {
    case "mini_questionnaire":
      return renderMiniQuestionnaire(definition, content);
    case "numeric_metric":
      return renderNumericMetric(definition, content);
    case "structured_table":
      return renderStructuredTable(definition, content);
    case "repeatable_table":
      return renderRepeatableTable(definition, content, false);
    case "repeatable_table_with_totals":
      return renderRepeatableTable(definition, content, true);
    case "time_series_comparative":
      return renderTimeSeries(definition, content);
    case "narrative":
      return renderNarrative(definition, content);
    default:
      return `    <p>Unknown block type: ${esc(definition.block_type)}</p>`;
  }
}

export function renderXhtml(definition, content) {
  return wrapXhtml(definition, renderBody(definition, content));
}
