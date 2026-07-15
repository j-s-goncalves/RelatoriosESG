import { z } from "zod";

export const EntityIdentifierSchema = z.object({
  type: z.enum(["LEI", "NIF", "EUID", "OTHER"]).default("NIF"),
  value: z.string().default(""),
});

export const SubsidiarySchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  address: z.string().default(""),
});

export const SiteSchema = z.object({
  id: z.string(),
  address: z.string().default(""),
  postal_code: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default(""),
  gps_lat: z.number().nullable().default(null),
  gps_lon: z.number().nullable().default(null),
});

export const CertificationSchema = z.object({
  has_certification: z.boolean().default(false),
  description: z.string().default(""),
});

export const UndertakingMasterSchema = z.object({
  legal_name: z.string().default(""),
  entity_identifier: EntityIdentifierSchema.default({}),
  legal_form: z.string().default(""),
  // NACE codes validated as leaf nodes — reference data validation deferred to Fase 4
  nace_codes: z.array(z.string()).default([]),
  currency: z.string().default("EUR"),
  main_country: z.string().default(""),
  subsidiaries: z.array(SubsidiarySchema).default([]),
  sites: z.array(SiteSchema).default([]),
  sustainability_certifications: z.array(CertificationSchema).default([]),
});

export function emptyMaster() {
  return UndertakingMasterSchema.parse({});
}
