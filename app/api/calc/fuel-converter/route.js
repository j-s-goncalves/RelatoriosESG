import { NextResponse } from "next/server";
import { z } from "zod";
import { convertFuel } from "@/lib/fuelConverter";

const RequestSchema = z.object({
  fuel_code: z.string().min(1),
  quantity:  z.number().positive(),
  unit:      z.enum(["kg", "tonne", "litre", "m3", "GJ", "MWh", "kWh"]),
});

/**
 * POST /api/calc/fuel-converter
 *
 * Endpoint stateless de conversão de combustível (Fase 5, secção 6.1).
 * Recebe { fuel_code, quantity, unit }, devolve { gj, mwh, tco2e, param_version }.
 * Nunca persiste nada.
 */
export async function POST(request) {
  const body = await request.json();
  const result = RequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 422 });
  }

  const { fuel_code, quantity, unit } = result.data;
  try {
    const converted = convertFuel(fuel_code, quantity, unit);
    return NextResponse.json(converted);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
