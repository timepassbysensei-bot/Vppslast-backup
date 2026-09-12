import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignedFileLink } from "@/components/SignedFileLink";
import { useInternalNotices, useMarkNoticeRead } from "@/hooks/staff";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";

export function PrincipalBoard() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useInternalNotices();
  const markRead = useMarkNoticeRead();
  const readIds = new Set(data?.readIds ?? []);

  return (
    <Card>
      <SectionHeading>{t("teacher.principalBoard")}</SectionHeading>
      {isLoading ? (
        <Spinner />
      ) : (data?.notices ?? []).length === 0 ? (
        <EmptyState>{t("teacher.noInternalNotices")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data?.notices ?? []).map((n) => {
            const read = readIds.has(n.id);
            return (
              <li key={n.id} className="border border-ink/10 rounded-card p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                  <span className="badge">{t("common.priority")}: {n.priority}</span>
                  <span>{formatDate(n.created_at, lang)}</span>
                  {read ? <span className="badge text-success border-success/40">{t("teacher.markedRead")}</span> : null}
                </div>
                <h3 className="font-semibold text-navy mt-1">{n.title}</h3>
                <p className="text-sm text-ink/80 whitespace-pre-line">{n.content}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.attachment_bucket && n.attachment_path ? (
                    <SignedFileLink kind="internal_notice" recordId={n.id} />
                  ) : null}
                  {!read ? (
                    <Button variant="outline" className="px-3 py-1 text-sm" disabled={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
                      {t("teacher.markRead")}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
