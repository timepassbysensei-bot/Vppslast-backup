import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAudit } from "@/hooks/principal";

export function AuditViewer() {
  const { t } = useTranslation();
  const { data, isLoading } = useAudit();
  const [actionFilter, setActionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (r) =>
          (!actionFilter || r.action.toLowerCase().includes(actionFilter.toLowerCase())) &&
          (!typeFilter || (r.content_type ?? "").toLowerCase().includes(typeFilter.toLowerCase())),
      ),
    [data, actionFilter, typeFilter],
  );

  return (
    <Card>
      <SectionHeading>{t("principal.audit")}</SectionHeading>
      <div className="grid gap-2 sm:grid-cols-2 mb-3">
        <label className="block">
          <span className="field-label">{t("principal.auditAction")}</span>
          <input className="field-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{t("principal.auditType")}</span>
          <input className="field-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
        </label>
      </div>
      {isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState>{t("principal.noAudit")}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-ink/10">
                <th className="p-2">{t("principal.auditWhen")}</th>
                <th className="p-2">{t("principal.auditAction")}</th>
                <th className="p-2">{t("principal.auditType")}</th>
                <th className="p-2">{t("principal.auditActor")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/5">
                  <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">{r.action}</td>
                  <td className="p-2">{r.content_type ?? ""}</td>
                  <td className="p-2">{r.actor_role ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
