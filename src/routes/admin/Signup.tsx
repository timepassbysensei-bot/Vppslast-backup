import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/layout/AuthShell";
import { TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/providers/AuthProvider";
import { isSupabaseConfigured } from "@/lib/env";

const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email("Enter a valid email.").max(160),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});
type Form = z.infer<typeof schema>;

export function Signup() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await signUp(values.full_name, values.email, values.password);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    setDone(true);
  });

  return (
    <AuthShell title={t("auth.signupTitle")}>
      <Seo title={t("auth.signupTitle")} noindex path="/admin/signup" />
      {!isSupabaseConfigured ? <StatusMessage kind="error">{t("auth.notConfigured")}</StatusMessage> : null}
      {done ? (
        <div className="card p-4">
          <StatusMessage kind="success">{t("auth.signupSuccess")}</StatusMessage>
          <div className="mt-3 flex gap-2">
            <Link to="/admin/pending" className="btn btn-primary">
              {t("auth.pendingTitle")}
            </Link>
            <Link to="/admin/login" className="btn btn-outline">
              {t("auth.goLogin")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} noValidate className="card p-4 mt-2">
            <TextInput label={t("auth.displayName")} autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
            <TextInput label={t("auth.email")} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <TextInput
              label={t("auth.password")}
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            {serverError ? <StatusMessage kind="error">{serverError}</StatusMessage> : null}
            <div className="mt-3">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {t("auth.submitRegistration")}
              </Button>
            </div>
          </form>
          <p className="text-center text-sm mt-3">
            {t("auth.haveAccount")}{" "}
            <Link to="/admin/login" className="text-navy-600 underline">
              {t("auth.goLogin")}
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
