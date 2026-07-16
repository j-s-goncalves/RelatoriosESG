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
 * B3_GHG — Emissões GEE por Âmbito (StructuredTable com linhas fixas)
 * Campos derivados: total_tco2e
 */
function calcB3Ghg(content, definition) {
  const rows = definition.rows ?? [];
  const total_tco2e = rows.reduce((sum, row) => {
    const val = content.cells?.[`${row.row_code}::tco2e`];
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
  return { total_tco2e };
}

/**
 * B3_GHG_SCOPE3 — Âmbito 3: 15 categorias GHG Protocol (MiniQuestionnaire numérico)
 * Campos derivados: total_tco2e
 */
function calcB3GhgScope3(content) {
  const total_tco2e = (content.answers ?? []).reduce((sum, a) => {
    return sum + (typeof a.value === "number" ? a.value : 0);
  }, 0);
  return { total_tco2e };
}

/**
 * B3_ENERGY_BREAKDOWN — Desagregação do Consumo de Energia (StructuredTable)
 * Campos derivados: total_mwh
 */
function calcB3EnergyBreakdown(content, definition) {
  const rows = definition.rows ?? [];
  const total_mwh = rows.reduce((sum, row) => {
    const val = content.cells?.[`${row.row_code}::mwh`];
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
  return { total_mwh };
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
 * B7_WASTE — Resíduos (RepeatableTableWithTotals com coluna quantity_ton)
 * Campos derivados: total_quantity_ton
 */
function calcB7Waste(content) {
  const rows = content.rows ?? [];
  const total_quantity_ton = rows.reduce((sum, row) => {
    const val = row.values?.quantity_ton;
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
  return { total_quantity_ton };
}

/**
 * B8_REMUNERATION — Diferença salarial por género (StructuredTable)
 * Campo derivado: pay_gap_pct — diferença remuneratória em % (método: (homens - mulheres) / homens × 100)
 */
function calcB8Remuneration(content) {
  const men_val   = content.cells?.["men::median_annual_eur"];
  const women_val = content.cells?.["women::median_annual_eur"];
  if (typeof men_val !== "number" || typeof women_val !== "number" || men_val === 0) {
    return {};
  }
  const pay_gap_pct = Math.round(((men_val - women_val) / men_val) * 10000) / 100;
  return { pay_gap_pct };
}

// ── Registry ──────────────────────────────────────────────────────────────────

const CALC_REGISTRY = {
  B3_GHG:              (content, definition, context) => calcB3Ghg(content, definition, context),
  B3_GHG_SCOPE3:       (content, definition, context) => calcB3GhgScope3(content, definition, context),
  B3_ENERGY_BREAKDOWN: (content, definition, context) => calcB3EnergyBreakdown(content, definition, context),
  C5_WORKERS:          (content, definition, context) => calcB8Workers(content, definition, context),
  B7_WASTE:            (content, definition, context) => calcB7Waste(content, definition, context),
  B8_REMUNERATION:     (content, definition, context) => calcB8Remuneration(content, definition, context),
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * compute(definition, content) → { derived: Record<string, number> }
 *
 * Devolve sempre um objecto com chave `derived`.
 * Se não houver função de cálculo para este disclosure, devolve `derived: {}`.
 */
export function compute(definition, content, context = {}) {
  const fn = CALC_REGISTRY[definition.code];
  if (!fn) return { derived: {} };
  return { derived: fn(content, definition, context) };
}

/**
 * hasCalc(code) → boolean
 * Indica se existe lógica de cálculo registada para o disclosure.
 */
export function hasCalc(code) {
  return Object.prototype.hasOwnProperty.call(CALC_REGISTRY, code);
}
