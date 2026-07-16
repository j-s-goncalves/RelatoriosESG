import { BLOCK_TYPES } from "./blockTypes.js";

/**
 * Disclosure Definition Registry
 *
 * Cada entrada é um objecto JS simples e serializável (sem Zod, sem funções).
 * A forma depende do block_type — ver blockTypes.js para esquemas Zod.
 */

const DISCLOSURES = [
  // ── B1_PERIOD_METRICS: Métricas de período (StructuredTable) ─────────────────
  {
    code: "B1_PERIOD_METRICS",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "B1 — Métricas do Período de Reporte",
    short_label: "B1 — Métricas",
    rows: [
      { row_code: "headcount",    label: "Nº de empregados (effectivo no final do período)" },
      { row_code: "fte",          label: "Nº de empregados (ETI médio anual)" },
      { row_code: "turnover_eur", label: "Volume de negócios (EUR)" },
      { row_code: "balance_eur",  label: "Balanço total (EUR)" },
    ],
    columns: [
      { col_code: "value", label: "Valor", value_type: "numeric", unit: null, default_value: null },
    ],
    meta_fields: [
      { field_code: "reporting_basis",  label: "Base de relato",    options: ["individual", "consolidada"] },
      { field_code: "selected_module",  label: "Módulo seleccionado", options: ["basico", "basico_abrangente"] },
    ],
  },

  // ── B2: Práticas, políticas e futuras iniciativas (Narrative) ────────────────
  {
    code: "B2_POLICIES",
    block_type: BLOCK_TYPES.NARRATIVE,
    title: "B2 — Práticas, Políticas e Futuras Iniciativas",
    short_label: "B2 — Políticas",
    text_label: "Descrição de práticas, políticas (públicas ou não), futuras iniciativas e targets de sustentabilidade",
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

  // ── B3_ENERGY_BREAKDOWN: Desagregação do Consumo de Energia (StructuredTable) ─
  {
    code: "B3_ENERGY_BREAKDOWN",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B3 — Desagregação do Consumo de Energia",
    short_label: "B3 — Energia (detalhe)",
    rows: [
      { row_code: "renewable_self",  label: "Energia renovável — autoprodução" },
      { row_code: "renewable_grid",  label: "Energia renovável — rede (com garantia de origem)" },
      { row_code: "nonrenewable",    label: "Energia não renovável" },
    ],
    columns: [
      { col_code: "mwh", label: "MWh", value_type: "numeric", unit: "MWh", default_value: null },
    ],
  },

  // ── B3_GHG: Emissões GEE por Âmbito (StructuredTable com linhas fixas) ───────
  {
    code: "B3_GHG",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B3 — Emissões de Gases de Efeito de Estufa",
    short_label: "B3 — GEE",
    rows: [
      { row_code: "scope1",     label: "Âmbito 1 — Emissões directas" },
      { row_code: "scope2_loc", label: "Âmbito 2 — Emissões indirectas (localização)" },
      { row_code: "scope2_mkt", label: "Âmbito 2 — Emissões indirectas (mercado)" },
    ],
    columns: [
      { col_code: "tco2e", label: "tCO₂e", value_type: "numeric", unit: "tCO2e", default_value: null },
    ],
  },

  // ── B3_GHG_SCOPE3: Âmbito 3 — 15 categorias GHG Protocol (MiniQuestionnaire) ─
  {
    code: "B3_GHG_SCOPE3",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "VSME B3 — Âmbito 3: Emissões Indirectas de GEE",
    short_label: "B3 — Âmbito 3",
    items: [
      { node_type: "item", item_code: "cat01_purchased_goods",      label: "Cat. 1 — Bens e serviços adquiridos",                    value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat02_capital_goods",        label: "Cat. 2 — Bens de capital",                               value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat03_fuel_energy",          label: "Cat. 3 — Combustível e energia (não incluídos em A1/A2)", value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat04_upstream_transport",   label: "Cat. 4 — Transporte e distribuição (upstream)",           value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat05_waste",                label: "Cat. 5 — Resíduos gerados nas operações",                value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat06_business_travel",      label: "Cat. 6 — Deslocações em negócios",                       value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat07_employee_commuting",   label: "Cat. 7 — Deslocações casa-trabalho dos trabalhadores",   value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat08_upstream_leased",      label: "Cat. 8 — Activos arrendados (upstream)",                 value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat09_downstream_transport", label: "Cat. 9 — Transporte e distribuição (downstream)",        value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat10_processing",           label: "Cat. 10 — Processamento de produtos vendidos",           value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat11_use_of_sold",          label: "Cat. 11 — Utilização de produtos vendidos",              value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat12_eol_sold",             label: "Cat. 12 — Tratamento de fim de vida dos produtos",       value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat13_downstream_leased",    label: "Cat. 13 — Activos arrendados (downstream)",              value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat14_franchises",           label: "Cat. 14 — Franquias",                                   value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
      { node_type: "item", item_code: "cat15_investments",          label: "Cat. 15 — Investimentos",                               value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
    ],
  },

  // ── B4_POLLUTION: Poluição (RepeatableTableWithTotals) ───────────────────────
  {
    code: "B4_POLLUTION",
    block_type: BLOCK_TYPES.REPEATABLE_TABLE_WITH_TOTALS,
    title: "VSME B4 — Poluição",
    short_label: "B4 — Poluição",
    columns: [
      { col_code: "pollutant",   label: "Poluente",        value_type: "text",    unit: null, default_value: "" },
      { col_code: "medium",      label: "Meio receptor",   value_type: "text",    unit: null, default_value: "" },
      { col_code: "quantity_kg", label: "Quantidade (kg)", value_type: "numeric", unit: "kg", default_value: null },
    ],
  },

  // ── B5_BIODIVERSITY: Biodiversidade (Narrative) ───────────────────────────────
  {
    code: "B5_BIODIVERSITY",
    block_type: BLOCK_TYPES.NARRATIVE,
    title: "VSME B5 — Biodiversidade",
    short_label: "B5 — Biodiversidade",
    text_label: "Descrição dos impactos significativos na biodiversidade e medidas de mitigação adoptadas",
  },

  // ── B5_LAND_USE: Uso do Solo (NumericMetric) ──────────────────────────────────
  {
    code: "B5_LAND_USE",
    block_type: BLOCK_TYPES.NUMERIC_METRIC,
    title: "VSME B5 — Uso do Solo",
    short_label: "B5 — Uso do Solo",
    unit: "m²",
  },

  // ── B6_WATER: Captação Total de Água (NumericMetric) ─────────────────────────
  {
    code: "B6_WATER",
    block_type: BLOCK_TYPES.NUMERIC_METRIC,
    title: "B6 — Captação Total de Água",
    short_label: "B6 — Água",
    unit: "m³",
  },

  // ── B7_PRINCIPLES: Economia circular (Narrative) ──────────────────────────────
  {
    code: "B7_PRINCIPLES",
    block_type: BLOCK_TYPES.NARRATIVE,
    title: "B7 — Princípios de Economia Circular",
    short_label: "B7 — Economia Circular",
    text_label: "Descrição da aplicação de princípios de economia circular (reutilização, reparação, reciclagem, etc.)",
  },

  // ── B7_WASTE: Resíduos (RepeatableTableWithTotals) ───────────────────────────
  {
    code: "B7_WASTE",
    block_type: BLOCK_TYPES.REPEATABLE_TABLE_WITH_TOTALS,
    title: "VSME B7 — Resíduos",
    short_label: "B7 — Resíduos",
    columns: [
      { col_code: "waste_type",   label: "Tipo de resíduo",      value_type: "text",    unit: null,        default_value: "" },
      { col_code: "hazardous",    label: "Perigoso",             value_type: "text",    unit: null,        default_value: "Não" },
      { col_code: "quantity_ton", label: "Quantidade (ton)",      value_type: "numeric", unit: "toneladas", default_value: null },
      { col_code: "destination",  label: "Destino / Tratamento", value_type: "text",    unit: null,        default_value: "" },
    ],
  },

  // ── B7_MATERIALS: Materiais (StructuredTable) ─────────────────────────────────
  {
    code: "B7_MATERIALS",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B7 — Materiais",
    short_label: "B7 — Materiais",
    rows: [
      { row_code: "total_materials",    label: "Total de materiais utilizados" },
      { row_code: "recycled_materials", label: "dos quais: materiais reciclados/reutilizados" },
    ],
    columns: [
      { col_code: "tonnes",       label: "Toneladas",   value_type: "numeric", unit: "ton", default_value: null },
      { col_code: "pct_renewable", label: "% renovável", value_type: "numeric", unit: "%",  default_value: null },
    ],
  },

  // ── B8_CONTRACTS: Tipos de contrato e horário de trabalho (StructuredTable) ──
  {
    code: "B8_CONTRACTS",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B8 — Tipos de Contrato e Horário de Trabalho",
    short_label: "B8 — Contratos",
    rows: [
      { row_code: "permanent", label: "Contrato permanente / sem termo" },
      { row_code: "temporary", label: "Contrato a prazo / temporário" },
      { row_code: "full_time", label: "Tempo inteiro" },
      { row_code: "part_time", label: "Tempo parcial" },
    ],
    columns: [
      { col_code: "headcount", label: "Efectivo",    value_type: "numeric", unit: null, default_value: null },
      { col_code: "pct_total", label: "% do total",  value_type: "numeric", unit: "%",  default_value: null },
    ],
  },

  // ── B8_REMUNERATION: Remuneração e diferença salarial por género ──────────────
  {
    code: "B8_REMUNERATION",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B8 — Remuneração e Diferença Salarial por Género",
    short_label: "B8 — Remuneração",
    rows: [
      { row_code: "men",   label: "Homens" },
      { row_code: "women", label: "Mulheres" },
    ],
    columns: [
      { col_code: "median_annual_eur", label: "Remuneração anual mediana", value_type: "numeric", unit: "EUR", default_value: null },
    ],
  },

  // ── B9_TURNOVER: Rotatividade — admissões e saídas (StructuredTable) ──────────
  {
    code: "B9_TURNOVER",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B9 — Rotatividade: Admissões e Saídas",
    short_label: "B9 — Rotatividade",
    rows: [
      { row_code: "hires",      label: "Admissões no período" },
      { row_code: "departures", label: "Saídas no período" },
    ],
    columns: [
      { col_code: "headcount",     label: "Número",                 value_type: "numeric", unit: null, default_value: null },
      { col_code: "pct_workforce", label: "% da força de trabalho", value_type: "numeric", unit: "%",  default_value: null },
    ],
  },

  // ── B9_DIVERSITY: Diversidade etária e de género (StructuredTable) ────────────
  {
    code: "B9_DIVERSITY",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B9 — Diversidade Etária e de Género",
    short_label: "B9 — Diversidade",
    rows: [
      { row_code: "under_30",      label: "Menos de 30 anos" },
      { row_code: "between_30_50", label: "Entre 30 e 50 anos" },
      { row_code: "over_50",       label: "Mais de 50 anos" },
    ],
    columns: [
      { col_code: "men",   label: "Homens",  value_type: "numeric", unit: null, default_value: null },
      { col_code: "women", label: "Mulheres", value_type: "numeric", unit: null, default_value: null },
      { col_code: "total", label: "Total",    value_type: "numeric", unit: null, default_value: null },
    ],
  },

  // ── B10_SAFETY: Acidentes e lesões laborais (StructuredTable) ─────────────────
  {
    code: "B10_SAFETY",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "VSME B10 — Saúde e Segurança: Acidentes e Lesões",
    short_label: "B10 — Acidentes",
    rows: [
      { row_code: "fatalities",          label: "Óbitos por acidente de trabalho" },
      { row_code: "serious_injuries",    label: "Lesões graves" },
      { row_code: "recordable_injuries", label: "Lesões registáveis (total)" },
      { row_code: "days_lost",           label: "Dias perdidos por lesão" },
    ],
    columns: [
      { col_code: "employees",     label: "Trabalhadores por conta de outrem", value_type: "numeric", unit: null, default_value: null },
      { col_code: "non_employees", label: "Trabalhadores não assalariados",     value_type: "numeric", unit: null, default_value: null },
    ],
  },

  // ── B10_HEALTH_POLICY: Política de SST (MiniQuestionnaire) ───────────────────
  {
    code: "B10_HEALTH_POLICY",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "VSME B10 — Política de Saúde e Segurança no Trabalho",
    short_label: "B10 — Política SST",
    items: [
      {
        node_type: "item",
        item_code: "has_osh_policy",
        label: "A empresa dispõe de uma política de Saúde e Segurança no Trabalho (SST)?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "item",
        item_code: "covers_mental_health",
        label: "A política abrange saúde mental?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "item",
        item_code: "covers_ergonomics",
        label: "A política abrange ergonomia e prevenção de lesões músculo-esqueléticas?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "item",
        item_code: "has_worker_reps",
        label: "Existem representantes dos trabalhadores para SST formalmente designados?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
    ],
  },

  // ── B11_CORRUPTION: Corrupção e suborno (MiniQuestionnaire) ─────────────────
  {
    code: "B11_CORRUPTION",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "B11 — Convicções e Coimas por Corrupção e Suborno",
    short_label: "B11 — Corrupção",
    items: [
      {
        node_type: "item",
        item_code: "has_convictions",
        label: "A empresa registou convicções ou coimas por corrupção ou suborno no período de reporte?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "has_convictions",
        condition_value: "YES",
        children: [
          {
            node_type: "item",
            item_code: "num_convictions",
            label: "Número de convicções",
            value_type: "numeric",
            unit: null,
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "total_fines_eur",
            label: "Montante total de coimas (EUR)",
            value_type: "numeric",
            unit: "EUR",
            allows_specify: false,
            default_value: null,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÓDULO ABRANGENTE — C1–C9
  // ═══════════════════════════════════════════════════════════════════════════════

  // ── C1_BUSINESS: Modelo de negócio (Narrative) ────────────────────────────────
  {
    code: "C1_BUSINESS",
    block_type: BLOCK_TYPES.NARRATIVE,
    title: "C1 — Modelo de Negócio e Relações de Negócio",
    short_label: "C1 — Modelo de Negócio",
    text_label: "Descrição de produtos/serviços, mercados e relações de negócio principais",
  },

  // ── C1_SUSTAINABILITY: Estratégia de sustentabilidade (Narrative) ─────────────
  {
    code: "C1_SUSTAINABILITY",
    block_type: BLOCK_TYPES.NARRATIVE,
    title: "C1 — Estratégia de Sustentabilidade",
    short_label: "C1 — Sustentabilidade",
    text_label: "Elementos da estratégia da empresa ligados à sustentabilidade (se existirem iniciativas específicas)",
  },

  // ── C2_POLICIES: Complemento de B2 (Narrative) ────────────────────────────────
  {
    code: "C2_POLICIES",
    block_type: BLOCK_TYPES.NARRATIVE,
    title: "C2 — Práticas e Políticas (complemento de B2)",
    short_label: "C2 — Políticas (detalhe)",
    text_label: "Descrição detalhada de cada prática/política reportada em B2, incluindo targets, nível hierárquico responsável (opcional) e progressos",
  },

  // ── C3_GHG_TARGETS: Targets de redução de GHG (MiniQuestionnaire) ────────────
  {
    code: "C3_GHG_TARGETS",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C3 — Targets de Redução de GHG",
    short_label: "C3 — Targets GHG",
    items: [
      {
        node_type: "item",
        item_code: "has_ghg_targets",
        label: "A empresa definiu targets de redução de emissões de GHG?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "has_ghg_targets",
        condition_value: "YES",
        children: [
          { node_type: "item", item_code: "base_year",            label: "Ano base",                        value_type: "numeric", unit: null,    allows_specify: false, default_value: null },
          { node_type: "item", item_code: "base_value_tco2e",     label: "Emissões no ano base (tCO₂e)",   value_type: "numeric", unit: "tCO2e", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "target_year",          label: "Ano alvo",                        value_type: "numeric", unit: null,    allows_specify: false, default_value: null },
          { node_type: "item", item_code: "target_pct_reduction", label: "Redução alvo (%)",                value_type: "numeric", unit: "%",     allows_specify: false, default_value: null },
          { node_type: "item", item_code: "scope1_share_pct",     label: "Peso Âmbito 1 no target (%)",    value_type: "numeric", unit: "%",     allows_specify: false, default_value: null },
          { node_type: "item", item_code: "scope2_share_pct",     label: "Peso Âmbito 2 no target (%)",    value_type: "numeric", unit: "%",     allows_specify: false, default_value: null },
          { node_type: "item", item_code: "scope3_share_pct",     label: "Peso Âmbito 3 no target (%)",    value_type: "numeric", unit: "%",     allows_specify: false, default_value: null },
        ],
      },
    ],
  },

  // ── C3_TRANSITION: Plano de transição climática (MiniQuestionnaire) ───────────
  {
    code: "C3_TRANSITION",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C3 — Plano de Transição Climática",
    short_label: "C3 — Transição Climática",
    items: [
      {
        node_type: "item",
        item_code: "high_climate_impact_sector",
        label: "A empresa opera num sector de alto impacto climático (conforme Anexo I do standard)?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "high_climate_impact_sector",
        condition_value: "YES",
        children: [
          {
            node_type: "item",
            item_code: "has_transition_plan",
            label: "A empresa dispõe de um plano de transição climática?",
            value_type: "boolean",
            allows_specify: false,
            default_value: null,
          },
          {
            node_type: "item",
            item_code: "transition_plan_description",
            label: "Descrição do estado de implementação / data prevista de adopção se o plano ainda não existir",
            value_type: "boolean",
            allows_specify: true,
            default_value: null,
          },
        ],
      },
    ],
  },

  // ── C4_CLIMATE_RISKS: Riscos e eventos climáticos (MiniQuestionnaire) ──────────
  {
    code: "C4_CLIMATE_RISKS",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C4 — Riscos Climáticos",
    short_label: "C4 — Riscos Climáticos",
    items: [
      {
        node_type: "item",
        item_code: "has_climate_risks",
        label: "A empresa identificou riscos ou eventos climáticos materialmente relevantes?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "has_climate_risks",
        condition_value: "YES",
        children: [
          { node_type: "item", item_code: "physical_risks",     label: "Riscos físicos (perigos climáticos agudos e crónicos)",           value_type: "boolean", allows_specify: true, default_value: null },
          { node_type: "item", item_code: "transition_risks",   label: "Riscos de transição (políticas, tecnologia, mercado)",             value_type: "boolean", allows_specify: true, default_value: null },
          { node_type: "item", item_code: "adaptation_actions", label: "Acções de adaptação e mitigação implementadas ou planeadas",       value_type: "boolean", allows_specify: true, default_value: null },
          { node_type: "item", item_code: "risk_level_high",    label: "O nível de risco geral é classificado como alto?",                value_type: "boolean", allows_specify: false, default_value: null },
        ],
      },
    ],
  },

  // ── C5_WORKERS: Características adicionais da força de trabalho (StructuredTable) ─
  {
    code: "C5_WORKERS",
    block_type: BLOCK_TYPES.STRUCTURED_TABLE,
    title: "C5 — Características Adicionais da Força de Trabalho",
    short_label: "C5 — Trabalhadores",
    rows: [
      { row_code: "employees",      label: "Trabalhadores por conta de outrem" },
      { row_code: "self_employed",  label: "Trabalhadores independentes" },
      { row_code: "agency_workers", label: "Trabalhadores cedidos por agência" },
    ],
    columns: [
      { col_code: "headcount", label: "Efectivo",   value_type: "numeric", unit: null, default_value: null },
      { col_code: "fte",       label: "ETI",         value_type: "numeric", unit: null, default_value: null },
      { col_code: "pct_total", label: "% do total", value_type: "numeric", unit: "%",  default_value: null },
    ],
  },

  // ── C6_HUMAN_RIGHTS: Código de Conduta e Direitos Humanos ────────────────────
  // MiniQuestionnaire com ConditionalSection: sub-perguntas só aparecem quando
  // code_of_conduct = YES
  {
    code: "C6_HUMAN_RIGHTS",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C6 — Código de Conduta e Direitos Humanos",
    short_label: "C6 — Código de Conduta",
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

  // ── C7_HR_INCIDENTS: Incidentes de direitos humanos (MiniQuestionnaire) ────────
  {
    code: "C7_HR_INCIDENTS",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C7 — Incidentes de Direitos Humanos",
    short_label: "C7 — Incidentes DH",
    items: [
      {
        node_type: "item",
        item_code: "incidents_own_workforce",
        label: "Registaram-se incidentes confirmados de direitos humanos na própria força de trabalho no período de reporte?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "incidents_own_workforce",
        condition_value: "YES",
        children: [
          { node_type: "item", item_code: "incident_child_labour",   label: "Trabalho infantil",                                       value_type: "boolean", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "incident_forced_labour",  label: "Trabalho forçado",                                        value_type: "boolean", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "incident_trafficking",    label: "Tráfico de seres humanos",                                value_type: "boolean", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "incident_discrimination", label: "Discriminação",                                           value_type: "boolean", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "incident_other",          label: "Outros incidentes",                                       value_type: "boolean", allows_specify: true,  default_value: null },
          { node_type: "item", item_code: "actions_taken",           label: "Acções tomadas em resposta aos incidentes identificados", value_type: "boolean", allows_specify: true,  default_value: null },
        ],
      },
      {
        node_type: "item",
        item_code: "incidents_value_chain",
        label: "Incidentes envolvendo trabalhadores na cadeia de valor?",
        value_type: "boolean",
        allows_specify: true,
        default_value: null,
      },
      {
        node_type: "item",
        item_code: "incidents_communities",
        label: "Incidentes envolvendo comunidades afectadas?",
        value_type: "boolean",
        allows_specify: true,
        default_value: null,
      },
      {
        node_type: "item",
        item_code: "incidents_consumers",
        label: "Incidentes envolvendo consumidores e utilizadores finais?",
        value_type: "boolean",
        allows_specify: true,
        default_value: null,
      },
    ],
  },

  // ── C8_REVENUES: Receitas de actividades específicas (MiniQuestionnaire) ──────
  // Nota: rev_fossil_fuels_total_pct (carvão+petróleo+gás) e critérios de exclusão
  // de benchmarks UE são campos calculados no backend — não são input manual.
  {
    code: "C8_REVENUES",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C8 — Receitas de Actividades Específicas e Exclusão de Benchmarks UE",
    short_label: "C8 — Receitas / Benchmarks",
    items: [
      {
        node_type: "item",
        item_code: "applies",
        label: "A empresa aufere receitas de actividades sujeitas a critérios de exclusão de benchmarks UE?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "applies",
        condition_value: "YES",
        children: [
          { node_type: "item", item_code: "rev_controversial_weapons_pct", label: "Receitas de armas controversas (% do turnover)",          value_type: "numeric", unit: "%", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "rev_tobacco_pct",               label: "Receitas de tabaco (% do turnover)",                      value_type: "numeric", unit: "%", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "rev_coal_pct",                  label: "Receitas de extracção/produção de carvão (% do turnover)", value_type: "numeric", unit: "%", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "rev_oil_pct",                   label: "Receitas de petróleo (% do turnover)",                    value_type: "numeric", unit: "%", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "rev_gas_pct",                   label: "Receitas de gás natural (% do turnover)",                 value_type: "numeric", unit: "%", allows_specify: false, default_value: null },
          { node_type: "item", item_code: "rev_chemicals_pct",             label: "Receitas de produção de químicos (% do turnover)",        value_type: "numeric", unit: "%", allows_specify: false, default_value: null },
        ],
      },
    ],
  },

  // ── C9_GOVERNANCE: Diversidade de género no órgão de governança (MiniQuestionnaire) ─
  // Nota: o rácio de género (membros femininos / total * 100) é campo calculado no backend.
  {
    code: "C9_GOVERNANCE",
    block_type: BLOCK_TYPES.MINI_QUESTIONNAIRE,
    title: "C9 — Diversidade de Género no Órgão de Governança",
    short_label: "C9 — Governança",
    items: [
      {
        node_type: "item",
        item_code: "has_governance_body",
        label: "A empresa tem um órgão de governança formalmente constituído?",
        value_type: "boolean",
        allows_specify: false,
        default_value: null,
      },
      {
        node_type: "conditional_section",
        condition_item_code: "has_governance_body",
        condition_value: "YES",
        children: [
          { node_type: "item", item_code: "members_men",   label: "Número de membros masculinos no órgão de governança",  value_type: "numeric", unit: null, allows_specify: false, default_value: null },
          { node_type: "item", item_code: "members_women", label: "Número de membros femininos no órgão de governança",   value_type: "numeric", unit: null, allows_specify: false, default_value: null },
        ],
      },
    ],
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
