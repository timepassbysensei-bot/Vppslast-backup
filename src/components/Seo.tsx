import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { canonicalUrl } from "@/lib/env";

type Props = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  noindex?: boolean;
};

export function Seo({ title, description, path, image, noindex }: Props) {
  const { t } = useTranslation();
  const school = t("common.schoolName");
  const fullTitle = title ? `${title} — ${school}` : school;
  const desc = description ?? t("seo.defaultDescription");
  const canonical = path ? canonicalUrl(path) : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={school} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
    </Helmet>
  );
}
