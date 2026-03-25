"use client";

/**
 * Register page with Particles background and redesigned card.
 *
 * Depends on: lib/auth/client.ts, lib/validators/auth.schema.ts,
 *             ui/particles, react-hook-form, zod, next-intl
 * Used by: /register route
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";

import Particles from "@/components/ui/particles";
import { signUp } from "@/lib/auth/client";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth.schema";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      setServerError(result.error.message ?? "L'inscription a échoué");
      return;
    }

    router.push("/overview");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Particles background */}
      <div className="fixed inset-0 z-0">
        <Particles
          particleCount={80}
          particleColors={["#ffffff"]}
          speed={0.3}
        />
      </div>

      {/* Register card */}
      <div
        className="relative z-10 w-[380px] p-8"
        style={{
          background: "#111318",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center">
            <span className="text-3xl font-bold text-white">R</span>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-white text-center">
          {t('auth.register_title')}
        </h1>
        <p className="text-sm text-white/40 mt-1 text-center">
          {t('auth.register_subtitle')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {serverError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              {t('auth.name')}
            </label>
            <input
              type="text"
              placeholder="Jean Dupont"
              autoComplete="name"
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none px-3 py-2.5 text-sm transition-colors"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">{t('auth.email')}</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none px-3 py-2.5 text-sm transition-colors"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              {t('auth.password')}
            </label>
            <input
              type="password"
              placeholder="Au moins 8 caractères"
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none px-3 py-2.5 text-sm transition-colors"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              {t('auth.confirm_password')}
            </label>
            <input
              type="password"
              placeholder="Répétez votre mot de passe"
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none px-3 py-2.5 text-sm transition-colors"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-medium rounded-lg py-2.5 text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? t('auth.register_button') + "..." : t('auth.register_button')}
          </button>
        </form>

        <p className="text-center text-xs text-white/40 mt-6">
          {t('auth.already_account')}{" "}
          <Link href="/login" className="text-white/70 hover:text-white transition-colors">
            {t('auth.sign_in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
