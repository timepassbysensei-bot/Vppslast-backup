import { useTranslation } from "react-i18next";

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex items-center gap-2 text-ink/70 py-6">
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 rounded-full border-2 border-navy border-t-transparent animate-spin"
      />
      <span>{label ?? t("common.loading")}</span>
    </div>
  );
}
