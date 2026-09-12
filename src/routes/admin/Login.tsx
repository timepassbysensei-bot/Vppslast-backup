import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  email: z.string().trim().email("Enter a valid email.").max(160),
  password: z.string().min(1, "Required").max(200),
});
type Form = z.infer<typeof schema>;

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, session } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (session) navigate("/admin/pending", { replace: true });
  }, [session, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await signIn(values.email, values.password);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    navigate("/admin/pending", { replace: true });
  });

  return (
    <AuthShell title={t("auth.loginTitle")}>
      <Seo title={t("auth.loginTitle")} noindex path="/admin/login" />
      {!isSupabaseConfigured ? <StatusMessage kind="error">{t("auth.notConfigured")}</StatusMessage> : null}
      <form onSubmit={onSubmit} noValidate className="card p-4 mt-2">
        <TextInput label={t("auth.email")} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <TextInput
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {serverError ? <StatusMessage kind="error">{serverError}</StatusMessage> : null}
        <div className="mt-3">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {t("auth.login")}
          </Button>
        </div>
      </form>
      <p className="text-center text-sm mt-3">
        {t("auth.noAccount")}{" "}
        <Link to="/admin/signup" className="text-navy-600 underline">
          {t("auth.goSignup")}
        </Link>
      </p>
    </AuthShell>
  );
}
