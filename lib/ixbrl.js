/**
 * Fase 9 — Geração de saída iXBRL (inline XBRL)
 *
 * Gera um documento XHTML com marcação inline XBRL para as disclosures VSME.
 * Conceitos no namespace vsme: (sem taxonomia XBRL publicada para VSME 2026 —
 * a taxonomia EFRAG é referência para fase posterior).
 *
 * Valores numéricos → <ix:nonFraction>
 * Valores texto/booleano → <ix:nonNumeric>
 * Blocos sem conceito mapeado (RepeatableTable, TimeSeries) → XHTML simples sem tags ix:
 * (iXBRL permite mistura de conteúdo marcado e não marcado no mesmo documento)
 */

import { flattenItems, emptyContent } from "./blockTypes.js";
import { renderBody } from "./xhtml.js";

// ── Contextos e unidades ──────────────────────────────────────────────────────

const CTX_DURATION = "ctx_period";  // duração: start_date → end_date
const CTX_INSTANT  = "ctx_end";     // instante: end_date (balanço, efectivos)

// ── Mapa de conceitos VSME ────────────────────────────────────────────────────
// Chave: "DISCLOSURE_CODE::field_key"
//   StructuredTable    → "CODIGO::row_code::col_code"
//   NumericMetric      → "CODIGO::value"
//   MiniQuestionnaire  → "CODIGO::item_code"
// Valor: { concept, unitRef, decimals?, ctx, numeric }

const CONCEPT_MAP = {
  // ── B1 — Métricas do período ───────────────────────────────────────────────
  "B1_PERIOD_METRICS::headcount::value":    { concept: "NumberOfEmployeesAtPeriodEnd",    unitRef: null,      decimals: "0", ctx: CTX_INSTANT,  numeric: true  },
  "B1_PERIOD_METRICS::fte::value":          { concept: "AverageNumberOfEmployeesFTE",      unitRef: null,      decimals: "2", ctx: CTX_DURATION, numeric: true  },
  "B1_PERIOD_METRICS::turnover_eur::value": { concept: "NetRevenue",                       unitRef: "u_EUR",   decimals: "2", ctx: CTX_DURATION, numeric: true  },
  "B1_PERIOD_METRICS::balance_eur::value":  { concept: "TotalBalanceSheet",                unitRef: "u_EUR",   decimals: "2", ctx: CTX_INSTANT,  numeric: true  },

  // ── B3 — Energia ──────────────────────────────────────────────────────────
  "B3_ENERGY::value":                          { concept: "TotalEnergyConsumptionMWh",             unitRef: "u_MWh",   decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_ENERGY_BREAKDOWN::renewable_self::mwh":  { concept: "RenewableEnergySelfProducedMWh",        unitRef: "u_MWh",   decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_ENERGY_BREAKDOWN::renewable_grid::mwh":  { concept: "RenewableEnergyFromGridMWh",            unitRef: "u_MWh",   decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_ENERGY_BREAKDOWN::nonrenewable::mwh":    { concept: "NonRenewableEnergyConsumptionMWh",      unitRef: "u_MWh",   decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG::scope1::tco2e":                     { concept: "Scope1GHGEmissionsTCO2e",               unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG::scope2_loc::tco2e":                 { concept: "Scope2LocationBasedGHGEmissionsTCO2e",  unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG::scope2_mkt::tco2e":                 { concept: "Scope2MarketBasedGHGEmissionsTCO2e",    unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── B3 — Âmbito 3 (15 categorias GHG Protocol) ────────────────────────────
  "B3_GHG_SCOPE3::cat01_purchased_goods":      { concept: "Scope3Cat01PurchasedGoodsServicesTCO2e",    unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat02_capital_goods":        { concept: "Scope3Cat02CapitalGoodsTCO2e",              unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat03_fuel_energy":          { concept: "Scope3Cat03FuelAndEnergyRelatedTCO2e",      unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat04_upstream_transport":   { concept: "Scope3Cat04UpstreamTransportTCO2e",         unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat05_waste":                { concept: "Scope3Cat05WasteGeneratedTCO2e",            unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat06_business_travel":      { concept: "Scope3Cat06BusinessTravelTCO2e",            unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat07_employee_commuting":   { concept: "Scope3Cat07EmployeeCommutingTCO2e",         unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat08_upstream_leased":      { concept: "Scope3Cat08UpstreamLeasedAssetsTCO2e",      unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat09_downstream_transport": { concept: "Scope3Cat09DownstreamTransportTCO2e",       unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat10_processing":           { concept: "Scope3Cat10ProcessingSoldProductsTCO2e",    unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat11_use_of_sold":          { concept: "Scope3Cat11UseOfSoldProductsTCO2e",         unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat12_eol_sold":             { concept: "Scope3Cat12EndOfLifeSoldProductsTCO2e",     unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat13_downstream_leased":    { concept: "Scope3Cat13DownstreamLeasedAssetsTCO2e",    unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat14_franchises":           { concept: "Scope3Cat14FranchisesTCO2e",                unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B3_GHG_SCOPE3::cat15_investments":          { concept: "Scope3Cat15InvestmentsTCO2e",               unitRef: "u_tCO2e", decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── B5 ───────────────────────────────────────────────────────────────────
  "B5_LAND_USE::value": { concept: "TotalLandUseM2", unitRef: "u_m2", decimals: "0", ctx: CTX_INSTANT, numeric: true },

  // ── B6 ───────────────────────────────────────────────────────────────────
  "B6_WATER::value": { concept: "TotalWaterWithdrawalM3", unitRef: "u_m3", decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── B8 — Contratos e horário ──────────────────────────────────────────────
  "B8_CONTRACTS::permanent::headcount": { concept: "NumberOfPermanentEmployees", unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "B8_CONTRACTS::temporary::headcount": { concept: "NumberOfTemporaryEmployees", unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "B8_CONTRACTS::full_time::headcount": { concept: "NumberOfFullTimeEmployees",  unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "B8_CONTRACTS::part_time::headcount": { concept: "NumberOfPartTimeEmployees",  unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },

  // ── B8 — Remuneração ──────────────────────────────────────────────────────
  "B8_REMUNERATION::men::median_annual_eur":   { concept: "MedianAnnualRemunerationMenEUR",   unitRef: "u_EUR", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "B8_REMUNERATION::women::median_annual_eur": { concept: "MedianAnnualRemunerationWomenEUR", unitRef: "u_EUR", decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── B9 ───────────────────────────────────────────────────────────────────
  "B9_TURNOVER::hires::headcount":      { concept: "NumberOfNewHiresDuringPeriod",   unitRef: null, decimals: "0", ctx: CTX_DURATION, numeric: true },
  "B9_TURNOVER::departures::headcount": { concept: "NumberOfDeparturesDuringPeriod", unitRef: null, decimals: "0", ctx: CTX_DURATION, numeric: true },
  "B9_DIVERSITY::under_30::men":        { concept: "NumberOfMaleEmployeesUnder30",    unitRef: null, decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "B9_DIVERSITY::under_30::women":      { concept: "NumberOfFemaleEmployeesUnder30",  unitRef: null, decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "B9_DIVERSITY::between_30_50::men":   { concept: "NumberOfMaleEmployees30To50",     unitRef: null, decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "B9_DIVERSITY::between_30_50::women": { concept: "NumberOfFemaleEmployees30To50",   unitRef: null, decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "B9_DIVERSITY::over_50::men":         { concept: "NumberOfMaleEmployeesOver50",     unitRef: null, decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "B9_DIVERSITY::over_50::women":       { concept: "NumberOfFemaleEmployeesOver50",   unitRef: null, decimals: "0", ctx: CTX_INSTANT,  numeric: true },

  // ── B10 ──────────────────────────────────────────────────────────────────
  "B10_SAFETY::fatalities::employees":          { concept: "WorkRelatedFatalitiesEmployees",         unitRef: null, decimals: "0", ctx: CTX_DURATION, numeric: true },
  "B10_SAFETY::serious_injuries::employees":    { concept: "SeriousWorkRelatedInjuriesEmployees",    unitRef: null, decimals: "0", ctx: CTX_DURATION, numeric: true },
  "B10_SAFETY::recordable_injuries::employees": { concept: "RecordableWorkRelatedInjuriesEmployees", unitRef: null, decimals: "0", ctx: CTX_DURATION, numeric: true },
  "B10_SAFETY::days_lost::employees":           { concept: "DaysLostDueToWorkRelatedInjuries",       unitRef: null, decimals: "0", ctx: CTX_DURATION, numeric: true },

  // ── B11 ──────────────────────────────────────────────────────────────────
  "B11_CORRUPTION::has_convictions": { concept: "HasCorruptionOrBriberyConvictions", ctx: CTX_DURATION, numeric: false },
  "B11_CORRUPTION::num_convictions": { concept: "NumberOfCorruptionConvictions",     unitRef: null,    decimals: "0", ctx: CTX_DURATION, numeric: true },
  "B11_CORRUPTION::total_fines_eur": { concept: "TotalCorruptionFinesEUR",           unitRef: "u_EUR", decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── C3 — Targets GHG ─────────────────────────────────────────────────────
  "C3_GHG_TARGETS::base_year":            { concept: "GHGTargetBaseYear",            unitRef: null,      decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "C3_GHG_TARGETS::base_value_tco2e":     { concept: "GHGTargetBaseValueTCO2e",      unitRef: "u_tCO2e", decimals: "2", ctx: CTX_INSTANT,  numeric: true },
  "C3_GHG_TARGETS::target_year":          { concept: "GHGTargetYear",                unitRef: null,      decimals: "0", ctx: CTX_INSTANT,  numeric: true },
  "C3_GHG_TARGETS::target_pct_reduction": { concept: "GHGTargetReductionPercentage", unitRef: "u_pct",   decimals: "2", ctx: CTX_INSTANT,  numeric: true },
  "C3_GHG_TARGETS::scope1_share_pct":     { concept: "GHGTargetScope1SharePct",      unitRef: "u_pct",   decimals: "2", ctx: CTX_INSTANT,  numeric: true },
  "C3_GHG_TARGETS::scope2_share_pct":     { concept: "GHGTargetScope2SharePct",      unitRef: "u_pct",   decimals: "2", ctx: CTX_INSTANT,  numeric: true },
  "C3_GHG_TARGETS::scope3_share_pct":     { concept: "GHGTargetScope3SharePct",      unitRef: "u_pct",   decimals: "2", ctx: CTX_INSTANT,  numeric: true },

  // ── C5 — Trabalhadores adicionais ─────────────────────────────────────────
  "C5_WORKERS::employees::headcount":      { concept: "NumberOfEmployeesHeadcount",         unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "C5_WORKERS::self_employed::headcount":  { concept: "NumberOfSelfEmployedWorkers",        unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "C5_WORKERS::agency_workers::headcount": { concept: "NumberOfAgencyWorkers",              unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "C5_WORKERS::employees::fte":            { concept: "NumberOfEmployeesFTE",               unitRef: null, decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── C6 — Direitos humanos (boolean) ──────────────────────────────────────
  "C6_HUMAN_RIGHTS::code_of_conduct":           { concept: "HasCodeOfConductOrHumanRightsPolicy", ctx: CTX_DURATION, numeric: false },
  "C6_HUMAN_RIGHTS::covers_child_labour":       { concept: "PolicyCoversChildLabour",              ctx: CTX_DURATION, numeric: false },
  "C6_HUMAN_RIGHTS::covers_forced_labour":      { concept: "PolicyCoversForcedLabour",             ctx: CTX_DURATION, numeric: false },
  "C6_HUMAN_RIGHTS::covers_human_trafficking":  { concept: "PolicyCoversHumanTrafficking",         ctx: CTX_DURATION, numeric: false },
  "C6_HUMAN_RIGHTS::covers_discrimination":     { concept: "PolicyCoversDiscrimination",           ctx: CTX_DURATION, numeric: false },
  "C6_HUMAN_RIGHTS::covers_accident_prevention":{ concept: "PolicyCoversAccidentPrevention",       ctx: CTX_DURATION, numeric: false },
  "C6_HUMAN_RIGHTS::complaints_mechanism":      { concept: "HasComplaintsMechanismForWorkers",     ctx: CTX_DURATION, numeric: false },

  // ── C8 — Receitas de actividades específicas ──────────────────────────────
  "C8_REVENUES::rev_controversial_weapons_pct": { concept: "RevenueFromControversialWeaponsPct", unitRef: "u_pct", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "C8_REVENUES::rev_tobacco_pct":               { concept: "RevenueFromTobaccoPct",              unitRef: "u_pct", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "C8_REVENUES::rev_coal_pct":                  { concept: "RevenueFromCoalExtractionPct",       unitRef: "u_pct", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "C8_REVENUES::rev_oil_pct":                   { concept: "RevenueFromOilPct",                  unitRef: "u_pct", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "C8_REVENUES::rev_gas_pct":                   { concept: "RevenueFromNaturalGasPct",           unitRef: "u_pct", decimals: "2", ctx: CTX_DURATION, numeric: true },
  "C8_REVENUES::rev_chemicals_pct":             { concept: "RevenueFromChemicalProductionPct",   unitRef: "u_pct", decimals: "2", ctx: CTX_DURATION, numeric: true },

  // ── C9 — Governança ───────────────────────────────────────────────────────
  "C9_GOVERNANCE::members_men":   { concept: "NumberOfMaleMembersOfGovernanceBody",   unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
  "C9_GOVERNANCE::members_women": { concept: "NumberOfFemaleMembersOfGovernanceBody", unitRef: null, decimals: "0", ctx: CTX_INSTANT, numeric: true },
};

// Concepts para campos de narrativa (bloco inteiro → um ix:nonNumeric)
const NARRATIVE_CONCEPTS = {
  "B2_POLICIES":       "PoliciesPracticesAndFutureInitiatives",
  "B5_BIODIVERSITY":   "BiodiversityImpactsDescription",
  "B7_PRINCIPLES":     "CircularEconomyPrinciplesDescription",
  "C1_BUSINESS":       "BusinessModelAndRelationships",
  "C1_SUSTAINABILITY": "SustainabilityStrategyDescription",
  "C2_POLICIES":       "PoliciesDetailedDescription",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapNonFraction(rawValue, meta) {
  const unitAttr     = meta.unitRef ? ` unitRef="${meta.unitRef}"` : ' unitRef="u_pure"';
  const decimalsAttr = meta.decimals != null ? ` decimals="${meta.decimals}"` : "";
  return `<ix:nonFraction name="vsme:${esc(meta.concept)}" contextRef="${meta.ctx}"${unitAttr}${decimalsAttr} format="ixt:num-dot-decimal">${esc(rawValue)}</ix:nonFraction>`;
}

function wrapNonNumeric(rawValue, meta) {
  return `<ix:nonNumeric name="vsme:${esc(meta.concept)}" contextRef="${meta.ctx}">${esc(rawValue)}</ix:nonNumeric>`;
}

/**
 * maybeWrap(disclosureCode, fieldKey, rawValue) → string
 * Envolve o valor com a tag ix: adequada, se existir mapeamento de conceito.
 * Devolve o valor escapado sem tag se não houver mapeamento ou valor nulo.
 */
function maybeWrap(disclosureCode, fieldKey, rawValue) {
  if (rawValue === null || rawValue === undefined) return "—";
  const meta = CONCEPT_MAP[`${disclosureCode}::${fieldKey}`];
  if (!meta) return esc(rawValue);
  return meta.numeric
    ? wrapNonFraction(rawValue, meta)
    : wrapNonNumeric(rawValue, meta);
}

// ── Renderers com marcação ix: ─────────────────────────────────────────────

function renderStructuredTableIx(code, definition, content) {
  if (content.omitido_por_confidencialidade) {
    return `    <p><em>Omitido por razões de confidencialidade.</em></p>`;
  }
  const rows  = definition.rows ?? [];
  const cols  = definition.columns ?? [];
  const cells = content.cells ?? {};

  const header = `<th>&#160;</th>` + cols.map(
    (c) => `<th>${esc(c.label)}${c.unit ? ` (${esc(c.unit)})` : ""}</th>`
  ).join("");

  const bodyRows = rows.map((row) => {
    const dataCells = cols.map((col) => {
      const key    = `${row.row_code}::${col.col_code}`;
      const rawVal = cells[key] ?? null;
      return `<td>${maybeWrap(code, key, rawVal)}</td>`;
    }).join("");
    return `      <tr><td><strong>${esc(row.label)}</strong></td>${dataCells}</tr>`;
  });

  return `    <table border="1" cellpadding="4" cellspacing="0">
      <thead><tr>${header}</tr></thead>
      <tbody>
${bodyRows.join("\n")}
      </tbody>
    </table>`;
}

function renderNumericMetricIx(code, definition, content) {
  if (content.omitido_por_confidencialidade) {
    return `    <p><em>Omitido por razões de confidencialidade.</em></p>`;
  }
  const unit      = definition.unit ?? content.unit ?? "";
  const rawVal    = content.value ?? null;
  const displayed = maybeWrap(code, "value", rawVal);
  const note      = content.note ? `\n    <p><em>${esc(content.note)}</em></p>` : "";
  return `    <p><strong>${displayed}</strong>${unit ? ` ${esc(unit)}` : ""}</p>${note}`;
}

function renderMiniQuestionnaireIx(code, definition, content) {
  if (content.omitido_por_confidencialidade) {
    return `    <p><em>Omitido por razões de confidencialidade.</em></p>`;
  }
  const items     = flattenItems(definition.items);
  const answerMap = Object.fromEntries((content.answers ?? []).map((a) => [a.item_code, a]));

  const rows = items.map((item) => {
    const answer    = answerMap[item.item_code] ?? {};
    const rawVal    = answer.value ?? null;
    const displayed = maybeWrap(code, item.item_code, rawVal);
    const specify   = item.allows_specify && answer.value === "YES" ? (answer.specify ?? "") : "";
    return `      <tr><td>${esc(item.label)}</td><td>${displayed}</td><td>${esc(specify)}</td></tr>`;
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

function renderNarrativeIx(code, definition, content) {
  if (content.omitido_por_confidencialidade) {
    return `    <p><em>Omitido por razões de confidencialidade.</em></p>`;
  }
  const text = content.text?.trim() ?? "";
  if (!text) return `    <p><em>Não preenchido</em></p>`;

  const escaped    = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n\n+/).map((p) => p.replace(/\n/g, "<br/>")).join("</p>\n    <p>");
  const inner      = `<p>${paragraphs}</p>`;

  const concept = NARRATIVE_CONCEPTS[code];
  if (concept) {
    return `    <ix:nonNumeric name="vsme:${esc(concept)}" contextRef="${CTX_DURATION}">${inner}</ix:nonNumeric>`;
  }
  return `    ${inner}`;
}

/**
 * renderBodyWithIx(definition, content) → string
 *
 * Como renderBody() em xhtml.js mas com marcação ix: onde existem conceitos mapeados.
 * RepeatableTable e TimeSeries não têm mapeamento de conceito (linhas dinâmicas)
 * — caem para o renderer XHTML simples do xhtml.js.
 */
export function renderBodyWithIx(definition, content) {
  const code = definition.code;
  switch (definition.block_type) {
    case "mini_questionnaire":
      return renderMiniQuestionnaireIx(code, definition, content);
    case "numeric_metric":
      return renderNumericMetricIx(code, definition, content);
    case "structured_table":
      return renderStructuredTableIx(code, definition, content);
    case "narrative":
      return renderNarrativeIx(code, definition, content);
    // RepeatableTable e TimeSeries: sem conceitos por linha → XHTML simples (válido em iXBRL)
    default:
      return renderBody(definition, content);
  }
}

// ── Documento iXBRL completo ──────────────────────────────────────────────────

/**
 * renderIxbrlDocument(disclosures, blockMap, undertaking, period) → string
 *
 * Gera o documento XHTML/iXBRL completo com:
 * - Namespaces ix:, xbrli:, vsme:
 * - <ix:header> com dois contextos (duração e instante) e unidades de medida
 * - Secções por disclosure, com valores marcados com ix: onde há mapeamento
 */
export function renderIxbrlDocument(disclosures, blockMap, undertaking, period) {
  // Datas para os contextos XBRL
  const startDate = period.start_date
    ? new Date(period.start_date).toISOString().slice(0, 10)
    : "1900-01-01";
  const endDate = period.end_date
    ? new Date(period.end_date).toISOString().slice(0, 10)
    : "1900-12-31";

  // Identificador da entidade (placeholder — produção usaria LEI de B1/mestre)
  const entityId = esc(undertaking.name);

  const header = `  <ix:header>
    <ix:hidden>
      <xbrli:context id="${CTX_DURATION}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://esrs.efrag.org/vsme/entity-name">${entityId}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:startDate>${startDate}</xbrli:startDate>
          <xbrli:endDate>${endDate}</xbrli:endDate>
        </xbrli:period>
      </xbrli:context>
      <xbrli:context id="${CTX_INSTANT}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://esrs.efrag.org/vsme/entity-name">${entityId}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:instant>${endDate}</xbrli:instant>
        </xbrli:period>
      </xbrli:context>
      <xbrli:unit id="u_EUR"><xbrli:measure>iso4217:EUR</xbrli:measure></xbrli:unit>
      <xbrli:unit id="u_MWh"><xbrli:measure>vsme:MWh</xbrli:measure></xbrli:unit>
      <xbrli:unit id="u_tCO2e"><xbrli:measure>vsme:tCO2e</xbrli:measure></xbrli:unit>
      <xbrli:unit id="u_m2"><xbrli:measure>vsme:m2</xbrli:measure></xbrli:unit>
      <xbrli:unit id="u_m3"><xbrli:measure>vsme:m3</xbrli:measure></xbrli:unit>
      <xbrli:unit id="u_pct"><xbrli:measure>xbrli:pure</xbrli:measure></xbrli:unit>
      <xbrli:unit id="u_pure"><xbrli:measure>xbrli:pure</xbrli:measure></xbrli:unit>
    </ix:hidden>
    <ix:references/>
  </ix:header>`;

  const sections = disclosures.map((definition) => {
    const block   = blockMap[definition.code];
    const content = block?.content ?? emptyContent(definition);
    const body    = renderBodyWithIx(definition, content);
    return `    <section>
      <h2>${esc(definition.title)}</h2>
${body}
    </section>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:ixt="http://www.xbrl.org/inlineXBRL/transformation/2022-02-16"
      xmlns:xbrli="http://www.xbrl.org/2003/instance"
      xmlns:iso4217="http://www.xbrl.org/2003/iso4217"
      xmlns:vsme="http://esrs.efrag.org/vsme/2026">
  <head>
    <title>Relatório ESG VSME — ${esc(undertaking.name)} — ${esc(period.label)}</title>
${header}
  </head>
  <body>
    <h1>Relatório ESG VSME</h1>
    <p><strong>Empresa:</strong> ${esc(undertaking.name)}</p>
    <p><strong>Período:</strong> ${esc(period.label)} (${startDate} a ${endDate})</p>
${sections}
  </body>
</html>`;
}
