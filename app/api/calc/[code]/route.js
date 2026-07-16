import { NextResponse } from "next/server";
import { getDisclosure } from "@/lib/disclosureRegistry";
import { getContentSchema } from "@/lib/blockTypes";
import { compute } from "@/lib/calcEngine";

/**
 * POST /api/calc/[code]
 *
 * Endpoint stateless de cálculo/preview (Fase 5, secção 6.1).
 * Recebe o content bruto, valida com Zod, calcula campos derivados e devolve-os.
 * Nunca persiste nada.
 */
export async function POST(request, { params }) {
  const { code } = await params;

  const definition = getDisclosure(code);
  if (!definition) {
    return NextResponse.json({ error: "Unknown disclosure code" }, { status: 404 });
  }

  const body = await request.json();
  const schema = getContentSchema(definition.block_type);
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 422 });
  }

  const { derived } = compute(definition, result.data);
  return NextResponse.json({ derived });
}
