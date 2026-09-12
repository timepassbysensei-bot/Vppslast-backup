import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea, Select } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { useSettings } from "@/hooks/public";
import { useSaveSettings } from "@/hooks/principal";
import type { Facility, SchoolSettings } from "@/lib/types";

type Draft = Partial<SchoolSettings>;

export function SettingsManager() {
  const { t } = useTranslation();
  const { data, isLoading } = useSettings();
  const save = useSaveSettings();
  const [draft, setDraft] = useState<Draft>({});
  const [social, setSocial] = useState<Record<string, string>>({});
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setDraft(data);
    setSocial((data.social_links as Record<string, string>) ?? {});
    setFacilities(data.facilities ?? []);
  }, [data]);

  const set = (patch: Draft) => setDraft((d) => ({ ...d, ...patch }));

  async function submit(): Promise<void> {
    if (!data) return;
    setMsg(null);
    await save.mutateAsync({
      id: data.id,
      name_en: draft.name_en ?? null,
      name_hi: draft.name_hi ?? null,
      tagline_en: draft.tagline_en ?? null,
      tagline_hi: draft.tagline_hi ?? null,
      address_en: draft.address_en ?? null,
      address_hi: draft.address_hi ?? null,
      phone: draft.phone ?? null,
      email: draft.email ?? null,
      office_hours_en: draft.office_hours_en ?? null,
      office_hours_hi: draft.office_hours_hi ?? null,
      established_year: draft.established_year ?? null,
      principal_name: draft.principal_name ?? null,
      affiliation_en: draft.affiliation_en ?? null,
      affiliation_hi: draft.affiliation_hi ?? null,
      affiliation_number: draft.affiliation_number ?? null,
      intro_en: draft.intro_en ?? null,
      intro_hi: draft.intro_hi ?? null,
      about_en: draft.about_en ?? null,
      about_hi: draft.about_hi ?? null,
      mission_en: draft.mission_en ?? null,
      mission_hi: draft.mission_hi ?? null,
      vision_en: draft.vision_en ?? null,
      vision_hi: draft.vision_hi ?? null,
      principal_message_en: draft.principal_message_en ?? null,
      principal_message_hi: draft.principal_message_hi ?? null,
      privacy_contact: draft.privacy_contact ?? null,
      map_url: draft.map_url ?? null,
      admission_mode: draft.admission_mode ?? "closed",
      default_language: draft.default_language ?? "en",
      social_links: Object.fromEntries(Object.entries(social).filter(([, v]) => v && v.trim())),
      facilities: facilities.filter((f) => f.name_en.trim()),
    });
    setMsg(t("principal.settingsSaved"));
  }

  if (isLoading || !data) return <Card><Spinner /></Card>;

  const socialKeys = ["facebook", "instagram", "youtube", "website"];

  return (
    <Card>
      <SectionHeading>{t("principal.settings")}</SectionHeading>
      <p className="text-sm text-ink/60 mb-3">Leave a field blank if the information is not yet confirmed.</p>
      <div className="grid gap-3">
        <TextInput label="School name (English)" value={draft.name_en ?? ""} onChange={(e) => set({ name_en: e.target.value })} />
        <TextInput label="School name (Hindi)" value={draft.name_hi ?? ""} onChange={(e) => set({ name_hi: e.target.value })} />
        <TextInput label="Tagline (English)" value={draft.tagline_en ?? ""} onChange={(e) => set({ tagline_en: e.target.value })} />
        <TextInput label="Tagline (Hindi)" value={draft.tagline_hi ?? ""} onChange={(e) => set({ tagline_hi: e.target.value })} />
        <TextArea label="Address (English)" value={draft.address_en ?? ""} onChange={(e) => set({ address_en: e.target.value })} rows={2} />
        <TextArea label="Address (Hindi)" value={draft.address_hi ?? ""} onChange={(e) => set({ address_hi: e.target.value })} rows={2} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Phone" value={draft.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          <TextInput label="Email" value={draft.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <TextInput label="Office hours (English)" value={draft.office_hours_en ?? ""} onChange={(e) => set({ office_hours_en: e.target.value })} />
        <TextInput label="Office hours (Hindi)" value={draft.office_hours_hi ?? ""} onChange={(e) => set({ office_hours_hi: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Established year" value={draft.established_year ?? ""} onChange={(e) => set({ established_year: e.target.value })} />
          <TextInput label="Principal name" value={draft.principal_name ?? ""} onChange={(e) => set({ principal_name: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Affiliation (English)" value={draft.affiliation_en ?? ""} onChange={(e) => set({ affiliation_en: e.target.value })} />
          <TextInput label="Affiliation number" value={draft.affiliation_number ?? ""} onChange={(e) => set({ affiliation_number: e.target.value })} />
        </div>
        <TextArea label="Homepage intro (English)" value={draft.intro_en ?? ""} onChange={(e) => set({ intro_en: e.target.value })} rows={2} />
        <TextArea label="Homepage intro (Hindi)" value={draft.intro_hi ?? ""} onChange={(e) => set({ intro_hi: e.target.value })} rows={2} />
        <TextArea label="About (English)" value={draft.about_en ?? ""} onChange={(e) => set({ about_en: e.target.value })} />
        <TextArea label="About (Hindi)" value={draft.about_hi ?? ""} onChange={(e) => set({ about_hi: e.target.value })} />
        <TextArea label="Mission (English)" value={draft.mission_en ?? ""} onChange={(e) => set({ mission_en: e.target.value })} rows={2} />
        <TextArea label="Mission (Hindi)" value={draft.mission_hi ?? ""} onChange={(e) => set({ mission_hi: e.target.value })} rows={2} />
        <TextArea label="Vision (English)" value={draft.vision_en ?? ""} onChange={(e) => set({ vision_en: e.target.value })} rows={2} />
        <TextArea label="Vision (Hindi)" value={draft.vision_hi ?? ""} onChange={(e) => set({ vision_hi: e.target.value })} rows={2} />
        <TextArea label="Principal's message (English)" value={draft.principal_message_en ?? ""} onChange={(e) => set({ principal_message_en: e.target.value })} />
        <TextArea label="Principal's message (Hindi)" value={draft.principal_message_hi ?? ""} onChange={(e) => set({ principal_message_hi: e.target.value })} />
        <TextInput label="Privacy contact" value={draft.privacy_contact ?? ""} onChange={(e) => set({ privacy_contact: e.target.value })} />
        <TextInput label="Map URL" value={draft.map_url ?? ""} onChange={(e) => set({ map_url: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Admission mode" value={draft.admission_mode ?? "closed"} onChange={(e) => set({ admission_mode: e.target.value as "open" | "closed" })}>
            <option value="closed">closed</option>
            <option value="open">open</option>
          </Select>
          <Select label="Default language" value={draft.default_language ?? "en"} onChange={(e) => set({ default_language: e.target.value as "en" | "hi" })}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </Select>
        </div>

        <fieldset className="border border-ink/10 rounded-card p-3">
          <legend className="font-semibold px-1">Social links</legend>
          {socialKeys.map((k) => (
            <TextInput key={k} label={k} value={social[k] ?? ""} onChange={(e) => setSocial((s) => ({ ...s, [k]: e.target.value }))} />
          ))}
        </fieldset>

        <fieldset className="border border-ink/10 rounded-card p-3">
          <legend className="font-semibold px-1">{t("home.facilities")}</legend>
          {facilities.map((f, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end mb-2">
              <TextInput label="Name (English)" value={f.name_en} onChange={(e) => setFacilities((arr) => arr.map((x, j) => (j === i ? { ...x, name_en: e.target.value } : x)))} />
              <TextInput label="Name (Hindi)" value={f.name_hi ?? ""} onChange={(e) => setFacilities((arr) => arr.map((x, j) => (j === i ? { ...x, name_hi: e.target.value } : x)))} />
              <Button variant="outline" className="mb-3" onClick={() => setFacilities((arr) => arr.filter((_, j) => j !== i))}>
                {t("common.delete")}
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setFacilities((arr) => [...arr, { key: `f_${Date.now()}`, name_en: "", name_hi: "" }])}>
            + {t("common.create")}
          </Button>
        </fieldset>

        {msg ? <StatusMessage kind="success">{msg}</StatusMessage> : null}
        <div>
          <Button disabled={save.isPending} onClick={() => void submit()}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
