/**
 * Fase 5 — Motor de conversão de combustível (secção 6.1 da spec)
 *
 * Converte uma quantidade de combustível (em qualquer unidade suportada)
 * para GJ, MWh e tCO2e, usando os dados de referência de fuelReference.js.
 *
 * Toda a lógica vive aqui (backend). O módulo não usa APIs Node-only,
 * pelo que pode ser importado em componentes client Next.js via getFuelOptions().
 */

import { FUEL_MAP, FUEL_REFERENCE, PARAM_VERSION } from "./fuelReference.js";

// ── Unidades suportadas por estado da matéria ─────────────────────────────────

export const UNITS_BY_STATE = {
  solid:  ["kg", "tonne"],
  liquid: ["litre", "kg", "tonne"],
  gas:    ["m3", "kg", "tonne"],
};

// ── Conversão principal ───────────────────────────────────────────────────────

/**
 * Converte uma quantidade de combustível para energia e emissões.
 *
 * @param {string} fuelCode  - Código do combustível (ex: "DIESEL")
 * @param {number} quantity  - Quantidade na unidade especificada
 * @param {string} inputUnit - Unidade: "kg" | "tonne" | "litre" | "m3" | "GJ" | "MWh" | "kWh"
 * @returns {{ gj: number, mwh: number, tco2e: number, param_version: string }}
 * @throws {Error} se o fuelCode ou inputUnit forem inválidos
 */
export function convertFuel(fuelCode, quantity, inputUnit) {
  const fuel = FUEL_MAP[fuelCode];
  if (!fuel) throw new Error(`Combustível desconhecido: "${fuelCode}"`);
  if (typeof quantity !== "number" || quantity < 0) {
    throw new Error("Quantidade inválida");
  }

  let gj;

  switch (inputUnit) {
    // ── Unidades de massa ────────────────────────────────────────────────────
    case "kg":
      gj = (quantity * fuel.ncv_mj_per_kg) / 1000;
      break;

    case "tonne":
      gj = (quantity * 1000 * fuel.ncv_mj_per_kg) / 1000;
      break;

    // ── Unidades de volume (líquidos) ────────────────────────────────────────
    case "litre": {
      if (fuel.density_kg_per_litre == null) {
        throw new Error(`Combustível "${fuel.fuel_name}" não suporta entrada em litros`);
      }
      const kg = quantity * fuel.density_kg_per_litre;
      gj = (kg * fuel.ncv_mj_per_kg) / 1000;
      break;
    }

    // ── Unidades de volume (gases) ───────────────────────────────────────────
    case "m3": {
      if (fuel.ncv_mj_per_m3 != null) {
        // Via NCV volumétrico (mais preciso para gases)
        gj = (quantity * fuel.ncv_mj_per_m3) / 1000;
      } else if (fuel.density_kg_per_m3 != null) {
        // Via densidade → massa → NCV mássico
        const kg = quantity * fuel.density_kg_per_m3;
        gj = (kg * fuel.ncv_mj_per_kg) / 1000;
      } else {
        throw new Error(`Combustível "${fuel.fuel_name}" não suporta entrada em m³`);
      }
      break;
    }

    // ── Unidades de energia (entrada directa) ────────────────────────────────
    case "GJ":
      gj = quantity;
      break;

    case "MWh":
      gj = quantity * 3.6;
      break;

    case "kWh":
      gj = quantity * 0.0036;
      break;

    default:
      throw new Error(`Unidade desconhecida: "${inputUnit}"`);
  }

  const mwh   = gj / 3.6;
  const tco2e = gj * fuel.co2_factor_tco2e_per_gj;

  return {
    gj:            round(gj, 6),
    mwh:           round(mwh, 6),
    tco2e:         round(tco2e, 6),
    param_version: PARAM_VERSION,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function round(value, decimals) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

/**
 * Lista de combustíveis para dropdown.
 * Seguro para importar em componentes client (sem APIs Node-only).
 *
 * @returns {{ fuel_code: string, fuel_name: string, state: string }[]}
 */
export function getFuelOptions() {
  return FUEL_REFERENCE.map(({ fuel_code, fuel_name, state }) => ({
    fuel_code,
    fuel_name,
    state,
  }));
}
