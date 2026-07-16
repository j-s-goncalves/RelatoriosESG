import { BLOCK_TYPES } from "./blockTypes.js";

/**
 * Disclosure Definition Registry
 *
 * Cada entrada é um objecto JS simples e serializável (sem Zod, sem funções).
 * A forma depende do block_type — ver blockTypes.js para esquemas Zod.
 */

const DISCLOSURES = [
  // ── B8: Código de Conduta e Direitos Humanos ─────────────────────────────────
  // MiniQuestionnaire com ConditionalSection: sub-perguntas só aparecem quando
  // code_of_conduct = YES
  {
    code: "B8",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "VSME B8 — Código de Conduta e Direitos Humanos",
    short_label: "B8 — Código de Conduta",
    items: [
      {
        node_type: "item",
        item_code: "code_of_conduct",
        label: "A empresa dispõe de um código de conduta ou de uma política em matéria de direitos humanos para os seus próprios trabalhadores?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "code_of_conduct",
        condition_value: "YES",
        children: [
          {
            node_type: "item",
            item_code: "covers_child_labour",
            label: "Abrange o trabalho infantil?",
            value_type: "boolean",
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "covers_forced_labour",
            label: "Abrange o trabalho forçado?",
            value_type: "boolean",
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "covers_human_trafficking",
            label: "Abrange o tráfico de seres humanos?",
            value_type: "boolean",
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "covers_discrimination",
            label: "Abrange a discriminação?",
            value_type: "boolean",
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "covers_accident_prevention",
            label: "Abrange a prevenção de acidentes?",
            value_type: "boolean",
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "covers_other",
            label: "Abrange outros temas?",
            value_type: "boolean",
            allows_specify: true,
            default_value: null,
          },
        ],
      },
      {
        node_type: "item",
        item_code: "complaints_mechanism",
        label: "A empresa dispõe de um mecanismo de tratamento de queixas para os seus próprios trabalhadores?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
    ],
  },

  // ── B3_ENERGY: Consumo Total de Energia (NumericMetric) ─────────────────────
  {
    code: "B3_ENERGY",
    block_type: BLOCK_TYPES.NUMERIC_METRIC,
    title: "VSME B3 — Consumo Total de Energia",
    short_label: "B3 — Energia",
    unit: "MWh",
    calculator: "fuel_converter",
  },

  // ── B8_WORKERS: Caracterização da Força de Trabalho (StructuredTable) ────────
  {
    code: "B8_WORKERS",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B8 — Caracterização da Força de Trabalho",
    short_label: "B8 — Trabalhadores",
    rows: [
      { row_code: "employees",      label: "Trabalhadores por conta de outrem" },
      { row_code: "self_employed",  label: "Trabalhadores independentes" },
      { row_code: "agency_workers", label: "Trabalhadores cedidos por agência" },
    ],
    columns: [
      { col_code: "headcount", label: "Efectivo",       value_type: "numeric", unit: null, default_value: null },
      { col_code: "fte",       label: "ETI",             value_type: "numeric", unit: null, default_value: null },
      { col_code: "pct_total", label: "% do total",     value_type: "numeric", unit: "%",  default_value: null },
    ],
  },

  // ── B7_WASTE: Resíduos (RepeatableTable) ────────────────────────────────────
  {
    code: "B7_WASTE",
    block_type: BLOCK_TYPES.REPEATABLE_TABLE,
    title: "VSME B7 — Resíduos",
    short_label: "B7 — Resíduos",
    columns: [
      { col_code: "waste_type", label: "Tipo de resíduo",       value_type: "text",    unit: null,       default_value: "" },
      { col_code: "quantity",   label: "Quantidade",            value_type: "numeric", unit: "toneladas", default_value: null },
      { col_code: "treatment",  label: "Método de tratamento",  value_type: "text",    unit: null,       default_value: "" },
    ],
  },

  // ── B3_GHG: Emissões GEE por Âmbito (RepeatableTableWithTotals) ─────────────
  {
    code: "B3_GHG",
    block_type: BLOCK_TYPES.REPEATABLE_TABLE_WITH_TOTALS,
    title: "VSME B3 — Emissões de Gases de Efeito de Estufa",
    short_label: "B3 — GEE",
    columns: [
      { col_code: "scope",  label: "Âmbito", value_type: "text",    unit: null,    default_value: "" },
      { col_code: "source", label: "Fonte",  value_type: "text",    unit: null,    default_value: "" },
      { col_code: "tco2e",  label: "tCO2e",  value_type: "numeric", unit: "tCO2e", default_value: null },
    ],
  },

  // ── B3_TIME: Evolução do Consumo de Energia (TimeSeriesComparative) ──────────
  {
    code: "B3_TIME",
    block_type: BLOCK_TYPES.TIME_SERIES_COMPARATIVE,
    title: "VSME B3 — Evolução do Consumo de Energia",
    short_label: "B3 — Tendência de Energia",
    unit: "MWh",
    value_label: "Consumo total de energia",
  },
];

// ── Accessors ─────────────────────────────────────────────────────────────────

const REGISTRY_MAP = Object.fromEntries(DISCLOSURES.map((d) => [d.code, d]));

export function getDisclosure(code) {
  return REGISTRY_MAP[code] ?? null;
}

export function getAllDisclosures() {
  return DISCLOSURES;
}
