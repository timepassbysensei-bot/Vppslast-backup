import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea, Select, Checkbox } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { supabase } from "@/lib/supabase";
import { useSaveAlert } from "@/hooks/principal";
import type { AlertSeverity, EmergencyAlert } from "@/lib/types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EmergencyAlertManager() {
  const { t } = useTranslation();
  const save = useSaveAlert();
  const { data, isLoading } = useQuery({
    queryKey: ["alert_admin"],
    queryFn: async (): Promise<EmergencyAlert | null> => {
      const { data, error } = await supabase.from("emergency_alerts").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data as EmergencyAlert | null) ?? null;
    },
  });

  const [id, setId] = useState<string | undefined>(undefined);
  const [enabled, setEnabled] = useState(false);
  const [messageEn, setMessageEn] = useState("");
  const [messageHi, setMessageHi] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("info");
  const [link, setLink] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setId(data.id);
    setEnabled(data.enabled);
    setMessageEn(data.message_en ?? "");
    setMessageHi(data.message_hi ?? "");
    setSeverity(data.severity);
    setLink(data.link_url ?? "");
    setStartsAt(toLocalInput(data.starts_at));
    setEndsAt(toLocalInput(data.ends_at));
  }, [data]);

  async function submit(): Promise<void> {
    setMsg(null);
    await save.mutateAsync({
      id,
      enabled,
      message_en: messageEn.trim() || null,
      message_hi: messageHi.trim() || null,
      severity,
      link_url: link.trim() || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    });
    setMsg(t("principal.alertSaved"));
  }

  if (isLoading) return <Card><Spinner /></Card>;

  return (
    <Card>
      <SectionHeading>{t("principal.emergencyAlert")}</SectionHeading>
      <div className="grid gap-3">
        <Checkbox label={t("principal.alertEnabled")} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <TextArea label={`${t("teacher.contentEn")}`} value={messageEn} onChange={(e) => setMessageEn(e.target.value)} rows={2} />
        <TextArea label={`${t("teacher.contentHi")}`} value={messageHi} onChange={(e) => setMessageHi(e.target.value)} rows={2} />
        <Select label={t("principal.alertSeverity")} value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)}>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="critical">critical</option>
        </Select>
        <TextInput label={t("principal.alertLink")} value={link} onChange={(e) => setLink(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Start ({t("common.optional")})</span>
            <input type="datetime-local" className="field-input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">End ({t("common.optional")})</span>
            <input type="datetime-local" className="field-input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
        </div>
        {msg ? <StatusMessage kind="success">{msg}</StatusMessage> : null}
        <div>
          <Button disabled={save.isPending} onClick={() => void submit()}>
            {t("principal.saveAlert")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
