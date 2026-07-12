import { getBlock } from "@/lib/db";
import { emptyB8 } from "@/lib/b8Definition";
import { renderXhtml } from "@/lib/xhtml";

export async function GET() {
  const data = await getBlock("B8");
  const questionnaire = data ?? emptyB8();
  const xhtml = renderXhtml(questionnaire);
  return new Response(xhtml, {
    headers: { "Content-Type": "application/xhtml+xml" },
  });
}
