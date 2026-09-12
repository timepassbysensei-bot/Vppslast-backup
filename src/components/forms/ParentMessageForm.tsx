import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { parentMessageForm, type ParentMessageForm } from "@/lib/schemas";
import { callPublic, FunctionError } from "@/lib/functions";
import { useClasses } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import { TextInput, TextArea, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Turnstile } from "@/components/Turnstile";

export function ParentMessageFormComponent() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: classData } = useClasses();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParentMessageForm>({ resolver: zodResolver(parentMessageForm) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await callPublic("submit-parent-message", { ...values, turnstileToken: token });
      setDone(true);
      reset();
    } catch (err) {
      setServerError(err instanceof FunctionError ? err.message : t("forms.genericError"));
    }
  });

  if (done) {
    return <StatusMessage kind="success">{t("forms.parentSuccess")}</StatusMessage>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card p-4">
      <h2 className="text-lg font-bold mb-3">{t("forms.parentTitle")}</h2>
      <TextInput label={t("forms.studentName")} error={errors.student_name?.message} {...register("student_name")} />
      <TextInput label={t("forms.senderName")} error={errors.sender_name?.message} {...register("sender_name")} />
      <TextInput label={t("forms.phone")} inputMode="tel" error={errors.phone?.message} {...register("phone")} />
      <Select label={t("common.class")} error={errors.class_code?.message} defaultValue="" {...register("class_code")}>
        <option value="" disabled>
          {t("common.selectClass")}
        </option>
        {(classData?.classes ?? []).map((c) => (
          <option key={c.code} value={c.code}>
            {pickText(c.name_en, c.name_hi, lang).value}
          </option>
        ))}
      </Select>
      <TextInput label={`${t("common.section")} (${t("common.optional")})`} error={errors.section?.message} {...register("section")} />
      <TextArea label={t("forms.message")} error={errors.message?.message} {...register("message")} />
      <Checkbox label={t("forms.consentParent")} error={errors.consent?.message} {...register("consent")} />

      <Turnstile onToken={setToken} />

      {serverError ? <StatusMessage kind="error">{serverError}</StatusMessage> : null}

      <div className="mt-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("forms.sending") : t("common.submit")}
        </Button>
      </div>
    </form>
  );
}
