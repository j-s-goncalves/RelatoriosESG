import { z } from "zod";

// ── Block type constants ───────────────────────────────────────────────────────

export const BLOCK_TYPES = {
  MINI_QUESTIONNAIRE:          "mini_questionnaire",
  NUMERIC_METRIC:              "numeric_metric",
  STRUCTURED_TABLE:            "structured_table",
  REPEATABLE_TABLE:            "repeatable_table",
  REPEATABLE_TABLE_WITH_TOTALS:"repeatable_table_with_totals",
  TIME_SERIES_COMPARATIVE:     "time_series_comparative",
};

// ── Shared helper ─────────────────────────────────────────────────────────────

const withConfidentiality = (shape) =>
  z.object({ omitido_por_confidencialidade: z.boolean().default(false), ...shape });

// ── Content Zod schemas (shape stored as JSONB in DB) ─────────────────────────

export const MiniQuestionnaireContentSchema = withConfidentiality({
  questionnaire_code: z.string(),
  answers: z.array(
    z.object({
      item_code: z.string(),
      value: z.union([z.enum(["YES", "NO"]), z.number(), z.null()]).default(null),
      specify: z.string().nullable().default(null),
    })
  ),
});

export const NumericMetricContentSchema = withConfidentiality({
  value: z.number().nullable().default(null),
  unit: z.string().default(""),
  note: z.string().default(""),
  // Proveniência de cálculo — preenchido quando o valor resulta da calculadora de combustível.
  // Guarda inputs brutos (múltiplos combustíveis) + totais + versão dos parâmetros (spec §6.1).
  // Usa passthrough() para ser tolerante a versões anteriores do formato.
  _calc: z.object({}).passthrough().nullable().default(null),
});

export const StructuredTableContentSchema = withConfidentiality({
  // Flat map: "${row_code}::${col_code}" -> value
  cells: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).default({}),
});

export const RepeatableTableContentSchema = withConfidentiality({
  rows: z.array(
    z.object({
      row_id: z.string(),
      values: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).default({}),
    })
  ).default([]),
});

// Same JSONB shape as RepeatableTable — totals are computed at read/render time, not stored
export const RepeatableTableWithTotalsContentSchema = RepeatableTableContentSchema;

export const TimeSeriesComparativeContentSchema = withConfidentiality({
  unit: z.string().default(""),
  entries: z.array(
    z.object({
      entry_id: z.string(),
      period_label: z.string().default(""),
      value: z.number().nullable().default(null),
    })
  ).default([]),
});

// ── Schema registry ───────────────────────────────────────────────────────────

const CONTENT_SCHEMAS = {
  [BLOCK_TYPES.MINI_QUESTIONNAIRE]:           MiniQuestionnaireContentSchema,
  [BLOCK_TYPES.NUMERIC_METRIC]:               NumericMetricContentSchema,
  [BLOCK_TYPES.STRUCTURED_TABLE]:             StructuredTableContentSchema,
  [BLOCK_TYPES.REPEATABLE_TABLE]:             RepeatableTableContentSchema,
  [BLOCK_TYPES.REPEATABLE_TABLE_WITH_TOTALS]: RepeatableTableWithTotalsContentSchema,
  [BLOCK_TYPES.TIME_SERIES_COMPARATIVE]:      TimeSeriesComparativeContentSchema,
};

export function getContentSchema(blockType) {
  const schema = CONTENT_SCHEMAS[blockType];
  if (!schema) throw new Error(`getContentSchema: unknown block_type "${blockType}"`);
  return schema;
}

// ── flattenItems — walks MiniQuestionnaire item tree, returns only leaf items ──

export function flattenItems(nodes = []) {
  const result = [];
  for (const node of nodes) {
    if (node.node_type === "conditional_section") {
      result.push(...flattenItems(node.children));
    } else {
      result.push(node);
    }
  }
  return result;
}

// ── emptyContent — returns a valid empty content object for a given definition ─

export function emptyContent(definition) {
  const { block_type, code } = definition;

  switch (block_type) {
    case BLOCK_TYPES.MINI_QUESTIONNAIRE:
      return MiniQuestionnaireContentSchema.parse({
        questionnaire_code: code,
        answers: flattenItems(definition.items).map((item) => ({
          item_code: item.item_code,
          value: item.default_value ?? null,
          specify: null,
        })),
      });

    case BLOCK_TYPES.NUMERIC_METRIC:
      return NumericMetricContentSchema.parse({ unit: definition.unit ?? "" });

    case BLOCK_TYPES.STRUCTURED_TABLE:
      return StructuredTableContentSchema.parse({ cells: {} });

    case BLOCK_TYPES.REPEATABLE_TABLE:
      return RepeatableTableContentSchema.parse({ rows: [] });

    case BLOCK_TYPES.REPEATABLE_TABLE_WITH_TOTALS:
      return RepeatableTableWithTotalsContentSchema.parse({ rows: [] });

    case BLOCK_TYPES.TIME_SERIES_COMPARATIVE:
      return TimeSeriesComparativeContentSchema.parse({ unit: definition.unit ?? "" });

    default:
      throw new Error(`emptyContent: unknown block_type "${block_type}"`);
  }
}

// ── computeTotals — sums numeric columns for RepeatableTableWithTotals ─────────
// Returns { col_code -> number } for every numeric column in the definition.

export function computeTotals(definition, rows) {
  const numericCols = (definition.columns ?? []).filter(
    (c) => c.value_type === "numeric"
  );
  const totals = {};
  for (const col of numericCols) {
    totals[col.col_code] = (rows ?? []).reduce((sum, row) => {
      const val = row.values?.[col.col_code];
      return sum + (typeof val === "number" ? val : 0);
    }, 0);
  }
  return totals;
}
