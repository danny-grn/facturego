"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation";
import { translateAuthError } from "@/lib/auth-errors";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: translateAuthError(error.message) };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/dashboard");
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { company_name: parsed.data.companyName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({ company_name: parsed.data.companyName })
      .eq("id", data.user.id);
  }

  if (!data.session) {
    return {
      success: true,
      message: "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
