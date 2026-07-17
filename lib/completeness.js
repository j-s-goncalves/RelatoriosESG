/**
 * Fase 8 — Validação, completude e obrigatoriedade condicional
 *
 * Módulo puramente funcional (sem I/O). Todas as funções recebem os dados
 * já carregados e devolvem resultados síncronos.
 */

import { BLOCK_TYPES } from "./blockTypes.js";

// ── checkCompleteness ─────────────────────────────────────────────────────────

/**
 * checkCompleteness(definition, content) → { complete: boolean, missing: string[] }
 *
 * Verifica se todos os campos obrigatórios do bloco estão preenchidos.
 * Respeita ConditionalSections — sub-itens só são obrigatórios se a condição
 * da secção-pai estiver activa.
 *
 * Regra: omitido_por_confidencialidade → sempre "completo" (a omissão é a resposta).
 */
export function checkCompleteness(definition, content) {
  if (!content) return { complete: false, missing: ["(sem dados)"] };
  if (content.omitido_por_confidencialidade) return { complete: true, missing: [] };

  switch (definition.block_type) {
    case BLOCK_TYPES.MINI_QUESTIONNAIRE:
      return _checkMiniQuestionnaire(definition, content);
    case BLOCK_TYPES.NUMERIC_METRIC:
      return _checkNumericMetric(content);
    case BLOCK_TYPES.STRUCTURED_TABLE:
      return _checkStructuredTable(definition, content);
    case BLOCK_TYPES.REPEATABLE_TABLE:
    case BLOCK_TYPES.REPEATABLE_TABLE_WITH_TOTALS:
      return _checkRepeatableTable(content);
    case BLOCK_TYPES.TIME_SERIES_COMPARATIVE:
      return _checkTimeSeries(content);
    case BLOCK_TYPES.NARRATIVE:
      return _checkNarrative(content);
    default:
      return { complete: false, missing: ["Tipo de bloco desconhecido"] };
  }
}

function _checkMiniQuestionnaire(definition, content) {
  const answers = content.answers ?? [];
  const answerMap = Object.fromEntries(answers.map((a) => [a.item_code, a]));
  const missing = [];

  function visitNodes(nodes) {
    for (const node of nodes) {
      if (node.node_type === "conditional_section") {
        const parentAnswer = answerMap[node.condition_item_code];
        // Só visita sub-itens se a condição estiver activa
        if (parentAnswer?.value === node.condition_value) {
          visitNodes(node.children);
        }
      } else {
        const answer = answerMap[node.item_code];
        if (answer == null || answer.value === null || answer.value === undefined) {
          missing.push(node.label);
        }
      }
    }
  }

  visitNodes(definition.items ?? []);
  return { complete: missing.length === 0, missing };
}

function _checkNumericMetric(content) {
  if (content.value === null || content.value === undefined) {
    return { complete: false, missing: ["Valor"] };
  }
  return { complete: true, missing: [] };
}

function _checkStructuredTable(definition, content) {
  const cells = content.cells ?? {};
  const missing = [];
  const rows = definition.rows ?? [];
  // Apenas colunas numéricas são obrigatórias (texto pode ser vazio)
  const numericCols = (definition.columns ?? []).filter((c) => c.value_type === "numeric");

  for (const row of rows) {
    for (const col of numericCols) {
      const key = `${row.row_code}::${col.col_code}`;
      const val = cells[key];
      if (val === null || val === undefined) {
        missing.push(`${row.label} — ${col.label}`);
      }
    }
  }
  return { complete: missing.length === 0, missing };
}

function _checkRepeatableTable(content) {
  // Tabela repetível: completa se tiver pelo menos uma linha
  if ((content.rows ?? []).length === 0) {
    return { complete: false, missing: ["(sem linhas)"] };
  }
  return { complete: true, missing: [] };
}

function _checkTimeSeries(content) {
  if ((content.entries ?? []).length === 0) {
    return { complete: false, missing: ["(sem entradas)"] };
  }
  return { complete: true, missing: [] };
}

function _checkNarrative(content) {
  if (!content.text || content.text.trim().length === 0) {
    return { complete: false, missing: ["Texto"] };
  }
  return { complete: true, missing: [] };
}

// ── getRequiredCodes ──────────────────────────────────────────────────────────

/**
 * getRequiredCodes(headcount, selectedModule) → Set<string>
 *
 * Devolve os códigos de disclosure obrigatórios, conforme Anexo II do standard
 * e o módulo seleccionado em B1.
 *
 * Regras:
 * - Módulo Básico (B1–B11): sempre obrigatório.
 * - Módulo Abrangente (C1–C9): só obrigatório se selectedModule === "basico_abrangente".
 * - C6_HUMAN_RIGHTS: voluntário para empresas com ≤ 10 empregados (Anexo II).
 */
export function getRequiredCodes(headcount, selectedModule) {
  const basicCodes = new Set([
    "B1_PERIOD_METRICS", "B2_POLICIES",
    "B3_ENERGY", "B3_ENERGY_BREAKDOWN", "B3_GHG", "B3_GHG_SCOPE3",
    "B4_POLLUTION", "B5_BIODIVERSITY", "B5_LAND_USE",
    "B6_WATER",
    "B7_PRINCIPLES", "B7_WASTE", "B7_WASTE_TOTALS", "B7_MATERIALS",
    // B7_MATERIALS_DETAIL: voluntário (só se gate = Sim)
    "B8_CONTRACTS", "B8_GENDER", "B8_COUNTRIES",
    "B9_SAFETY",
    "B10_REMUNERATION", "B10_CONDITIONS",
    "B11_CORRUPTION",
    // B10_HEALTH_POLICY: informação adicional (não obrigatório)
    // B9_DIVERSITY: informação adicional (não obrigatório)
  ]);

  if (selectedModule !== "basico_abrangente") return basicCodes;

  const comprehensiveCodes = new Set([
    ...basicCodes,
    "C1_BUSINESS", "C1_SUSTAINABILITY",
    "C2_POLICIES",
    "C3_GHG_TARGETS", "C3_TRANSITION",
    "C4_CLIMATE_RISKS",
    "C5_WORKERS", "C5_TURNOVER",
    "C7_HR_INCIDENTS",
    "C8_REVENUES",
    "C9_GOVERNANCE",
  ]);

  // C6 é voluntário para empresas com ≤ 10 empregados (Anexo II)
  if (typeof headcount === "number" && headcount > 10) {
    comprehensiveCodes.add("C6_HUMAN_RIGHTS");
  }

  return comprehensiveCodes;
}

// ── validateCross ─────────────────────────────────────────────────────────────

/**
 * validateCross(blockMap) → { warnings: Array<{ codes: string[], message: string }> }
 *
 * Validações cruzadas entre disclosures.
 * blockMap: { [code]: { content, state, ... } }
 */
export function validateCross(blockMap) {
  const warnings = [];

  const b1Content  = blockMap["B1_PERIOD_METRICS"]?.content;
  const b8cContent = blockMap["B8_CONTRACTS"]?.content;
  const b9dContent = blockMap["B9_DIVERSITY"]?.content;

  const b1Headcount = b1Content?.cells?.["headcount::value"];

  // B8_CONTRACTS: soma permanente + temporário deve igualar headcount de B1
  if (typeof b1Headcount === "number" && b8cContent) {
    const permanent = b8cContent.cells?.["permanent::headcount"];
    const temporary = b8cContent.cells?.["temporary::headcount"];
    if (typeof permanent === "number" && typeof temporary === "number") {
      const b8Total = permanent + temporary;
      if (b8Total !== b1Headcount) {
        warnings.push({
          codes: ["B1_PERIOD_METRICS", "B8_CONTRACTS"],
          message: `Total de contratos em B8 (${b8Total.toLocaleString("pt-PT")}) não coincide com o nº de empregados em B1 (${b1Headcount.toLocaleString("pt-PT")}).`,
        });
      }
    }
  }

  // B9_DIVERSITY: soma por género/idade deve igualar headcount de B1
  if (typeof b1Headcount === "number" && b9dContent) {
    const cells = b9dContent.cells ?? {};
    const totalMen   = (cells["under_30::men"]   ?? 0) + (cells["between_30_50::men"]   ?? 0) + (cells["over_50::men"]   ?? 0);
    const totalWomen = (cells["under_30::women"] ?? 0) + (cells["between_30_50::women"] ?? 0) + (cells["over_50::women"] ?? 0);
    const b9Total = totalMen + totalWomen;
    if (b9Total > 0 && b9Total !== b1Headcount) {
      warnings.push({
        codes: ["B1_PERIOD_METRICS", "B9_DIVERSITY"],
        message: `Total de efectivos por género/idade em B9 (${b9Total.toLocaleString("pt-PT")}) não coincide com o nº de empregados em B1 (${b1Headcount.toLocaleString("pt-PT")}).`,
      });
    }
  }

  return { warnings };
}

// ── summarizeCompleteness ─────────────────────────────────────────────────────

/**
 * summarizeCompleteness(disclosures, blockMap) →
 *   Array<{ code, complete, missing, status: "completo"|"incompleto"|"nao_iniciado" }>
 *
 * Calcula o estado de completude de todos os disclosures.
 * status:
 *   "nao_iniciado" — sem bloco na DB
 *   "incompleto"   — bloco existe mas tem campos em falta
 *   "completo"     — todos os campos obrigatórios preenchidos
 */
export function summarizeCompleteness(disclosures, blockMap) {
  return disclosures.map((definition) => {
    const block = blockMap[definition.code];
    if (!block) {
      return { code: definition.code, complete: false, missing: [], status: "nao_iniciado" };
    }
    const { complete, missing } = checkCompleteness(definition, block.content);
    return {
      code: definition.code,
      complete,
      missing,
      status: complete ? "completo" : "incompleto",
    };
  });
}
