import { Helmet } from "react-helmet-async";
import type { SchoolSettings } from "@/lib/types";
import { canonicalUrl, env } from "@/lib/env";

// EducationalOrganization JSON-LD containing ONLY confirmed, non-blank settings.
// Unknown properties are omitted — never fabricated.
export function SchoolJsonLd({ settings, logoUrl }: { settings: SchoolSettings | null | undefined; logoUrl?: string | null }) {
  if (!settings || !settings.name_en) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: settings.name_en,
  };
  if (env.siteUrl) data.url = canonicalUrl("/");
  if (settings.phone) data.telephone = settings.phone;
  if (settings.email) data.email = settings.email;
  if (settings.address_en) {
    data.address = { "@type": "PostalAddress", streetAddress: settings.address_en };
  }
  if (logoUrl) data.logo = logoUrl;

  const social = Object.values(settings.social_links ?? {}).filter((v) => typeof v === "string" && v.length > 0);
  if (social.length > 0) data.sameAs = social;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
