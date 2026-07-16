/**
 * Fase 5 — Dados de referência de combustíveis (seed data)
 *
 * Fonte: IPCC 2006 Guidelines for National Greenhouse Gas Inventories,
 *        Volume 2 (Energy), Tabelas 1.2, 2.2 e Anexo 2.
 *        Referência de implementação: EFRAG VSME Digital Template v1.3.0,
 *        sheet "Fuel Conversion Parameters".
 *
 * NCV = Net Calorific Value (Poder Calorífico Inferior)
 * CO2 factor em tCO2e/GJ (inclui CO2 + CH4 + N2O convertidos a CO2e via GWP AR5)
 * Biomassa: factor = 0 (emissões biogénicas não contadas no Scope 1 pelo GHG Protocol)
 */

export const PARAM_VERSION = "EFRAG_VSME_v1.3.0";

/**
 * @typedef {Object} FuelEntry
 * @property {string}       fuel_code            - Identificador único (maiúsculas)
 * @property {string}       fuel_name            - Nome em português
 * @property {"solid"|"liquid"|"gas"} state      - Estado da matéria
 * @property {boolean}      renewable_typical    - Renovável por defeito?
 * @property {number}       ncv_mj_per_kg        - NCV em MJ/kg
 * @property {number|null}  ncv_mj_per_m3        - NCV em MJ/m³ (gases)
 * @property {number|null}  density_kg_per_litre - Densidade em kg/L (líquidos)
 * @property {number|null}  density_kg_per_m3    - Densidade em kg/m³ (gases)
 * @property {number}       co2_factor_tco2e_per_gj - Factor de emissão em tCO2e/GJ
 */

/** @type {FuelEntry[]} */
export const FUEL_REFERENCE = [
  // ── Gases ──────────────────────────────────────────────────────────────────

  {
    fuel_code: "NATURAL_GAS",
    fuel_name: "Gás Natural",
    state: "gas",
    renewable_typical: false,
    ncv_mj_per_kg: 48.0,
    ncv_mj_per_m3: 34.0,       // valor típico; varia por composição
    density_kg_per_litre: null,
    density_kg_per_m3: 0.717,  // a 15 °C, 1 atm
    co2_factor_tco2e_per_gj: 0.0561,
  },
  {
    fuel_code: "LPG",
    fuel_name: "GPL (Gás de Petróleo Liquefeito)",
    state: "liquid",           // armazenado e medido como líquido
    renewable_typical: false,
    ncv_mj_per_kg: 47.3,
    ncv_mj_per_m3: null,
    density_kg_per_litre: 0.550,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0631,
  },
  {
    fuel_code: "BIOGAS",
    fuel_name: "Biogás",
    state: "gas",
    renewable_typical: true,
    ncv_mj_per_kg: 23.4,
    ncv_mj_per_m3: 20.0,       // ~50–60% CH4 típico
    density_kg_per_litre: null,
    density_kg_per_m3: 1.15,
    co2_factor_tco2e_per_gj: 0.0,  // biogénico
  },
  {
    fuel_code: "BIOMETHANE",
    fuel_name: "Biometano",
    state: "gas",
    renewable_typical: true,
    ncv_mj_per_kg: 48.0,
    ncv_mj_per_m3: 34.0,
    density_kg_per_litre: null,
    density_kg_per_m3: 0.717,
    co2_factor_tco2e_per_gj: 0.0,  // biogénico
  },

  // ── Líquidos ───────────────────────────────────────────────────────────────

  {
    fuel_code: "DIESEL",
    fuel_name: "Gasóleo (Diesel)",
    state: "liquid",
    renewable_typical: false,
    ncv_mj_per_kg: 43.0,
    ncv_mj_per_m3: null,
    density_kg_per_litre: 0.835,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0741,
  },
  {
    fuel_code: "PETROL",
    fuel_name: "Gasolina",
    state: "liquid",
    renewable_typical: false,
    ncv_mj_per_kg: 44.3,
    ncv_mj_per_m3: null,
    density_kg_per_litre: 0.745,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0693,
  },
  {
    fuel_code: "FUEL_OIL_HEAVY",
    fuel_name: "Fuel Óleo Pesado",
    state: "liquid",
    renewable_typical: false,
    ncv_mj_per_kg: 40.4,
    ncv_mj_per_m3: null,
    density_kg_per_litre: 0.960,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0774,
  },
  {
    fuel_code: "KEROSENE",
    fuel_name: "Querosene",
    state: "liquid",
    renewable_typical: false,
    ncv_mj_per_kg: 44.1,
    ncv_mj_per_m3: null,
    density_kg_per_litre: 0.800,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0715,
  },
  {
    fuel_code: "BIODIESEL",
    fuel_name: "Biodiesel (FAME)",
    state: "liquid",
    renewable_typical: true,
    ncv_mj_per_kg: 37.0,
    ncv_mj_per_m3: null,
    density_kg_per_litre: 0.880,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0,  // biogénico
  },

  // ── Sólidos ────────────────────────────────────────────────────────────────

  {
    fuel_code: "ANTHRACITE",
    fuel_name: "Carvão Antracite",
    state: "solid",
    renewable_typical: false,
    ncv_mj_per_kg: 26.7,
    ncv_mj_per_m3: null,
    density_kg_per_litre: null,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0982,
  },
  {
    fuel_code: "COAL_BITUMINOUS",
    fuel_name: "Carvão Betuminoso",
    state: "solid",
    renewable_typical: false,
    ncv_mj_per_kg: 25.8,
    ncv_mj_per_m3: null,
    density_kg_per_litre: null,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0946,
  },
  {
    fuel_code: "LIGNITE",
    fuel_name: "Lenhite (Carvão Castanho)",
    state: "solid",
    renewable_typical: false,
    ncv_mj_per_kg: 11.9,
    ncv_mj_per_m3: null,
    density_kg_per_litre: null,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.1015,
  },
  {
    fuel_code: "WOOD_PELLETS",
    fuel_name: "Pellets de Madeira",
    state: "solid",
    renewable_typical: true,
    ncv_mj_per_kg: 17.0,
    ncv_mj_per_m3: null,
    density_kg_per_litre: null,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0,  // biogénico
  },
  {
    fuel_code: "WOOD_CHIPS",
    fuel_name: "Aparas de Madeira",
    state: "solid",
    renewable_typical: true,
    ncv_mj_per_kg: 10.5,
    ncv_mj_per_m3: null,
    density_kg_per_litre: null,
    density_kg_per_m3: null,
    co2_factor_tco2e_per_gj: 0.0,  // biogénico
  },
];

// Mapa indexado por fuel_code para acesso O(1)
export const FUEL_MAP = Object.fromEntries(
  FUEL_REFERENCE.map((f) => [f.fuel_code, f])
);
