import { notFound } from "next/navigation";
import { getDisclosure } from "@/lib/disclosureRegistry";
import DisclosureEditor from "@/components/DisclosureEditor";

export async function generateMetadata({ params }) {
  const { code } = await params;
  const def = getDisclosure(code);
  return { title: def ? `${def.short_label} — RelatoriosESG` : "Not Found" };
}

export default async function DisclosurePage({ params }) {
  const { code } = await params;
  const definition = getDisclosure(code);
  if (!definition) notFound();

  // definition is a plain JS object — safe to serialise as prop to Client Component
  return <DisclosureEditor definition={definition} />;
}
