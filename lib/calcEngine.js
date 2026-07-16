/**
 * Fase 5 — Motor de Cálculo (secção 6.1 da descrição do projecto)
 *
 * Regras:
 * - Toda a lógica de cálculo vive aqui (backend), nunca no frontend.
 * - compute() é stateless: recebe definition + content, devolve { derived }.
 * - Os valores derivados nunca são input directo do utilizador.
 */

// ── Funções de cálculo por disclosure ────────────────────────────────────────

/**
 * B3_GHG — Emissões GEE por Âmbito (RepeatableTableWithTotals)
 * Campos derivados: total_tco2e
 */
function calcB3Ghg(content) {
  const rows = content.rows ?? [];
  const total_tco2e = rows.reduce((sum, row) => {
    const val = row.values?.tco2e;
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
  return { total_tco2e };
}

/**
 * B8_WORKERS — Caracterização da Força de Trabalho (StructuredTable)
 * Campos derivados: total_{col_code} para cada coluna numérica.
 * Soma todas as linhas de cada coluna numérica.
 */
function calcB8Workers(content, definition) {
  const rows = definition.rows ?? [];
  const numericCols = (definition.columns ?? []).filter((c) => c.value_type === "numeric");
  const derived = {};
  for (const col of numericCols) {
    derived[`total_${col.col_code}`] = rows.reduce((sum, row) => {
      const val = content.cells?.[`${row.row_code}::${col.col_code}`];
      return sum + (typeof val === "number" ? val : 0);
    }, 0);
  }
  return derived;
}

/**
 * B7_WASTE — Resíduos (RepeatableTable com coluna numérica)
 * Campos derivados: total_quantity
 */
function calcB7Waste(content) {
  const rows = content.rows ?? [];
  const total_quantity = rows.reduce((sum, row) => {
    const val = row.values?.quantity;
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
  return { total_quantity };
}

// ── Registry ──────────────────────────────────────────────────────────────────

const CALC_REGISTRY = {
  B3_GHG:    (content, definition) => calcB3Ghg(content, definition),
  B8_WORKERS:(content, definition) => calcB8Workers(content, definition),
  B7_WASTE:  (content, definition) => calcB7Waste(content, definition),
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * compute(definition, content) → { derived: Record<string, number> }
 *
 * Devolve sempre um objecto com chave `derived`.
 * Se não houver função de cálculo para este disclosure, devolve `derived: {}`.
 */
export function compute(definition, content) {
  const fn = CALC_REGISTRY[definition.code];
  if (!fn) return { derived: {} };
  return { derived: fn(content, definition) };
}

/**
 * hasCalc(code) → boolean
 * Indica se existe lógica de cálculo registada para o disclosure.
 */
export function hasCalc(code) {
  return Object.prototype.hasOwnProperty.call(CALC_REGISTRY, code);
}
