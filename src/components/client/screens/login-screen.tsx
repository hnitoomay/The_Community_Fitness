"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useClientSession } from "@/components/client/client-session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthDivider } from "../auth/auth-divider";
import { AuthField } from "../auth/auth-field";
import { AuthGoogleButton } from "../auth/auth-google-button";
import { AuthScreenShell } from "../auth/auth-screen-shell";

export function LoginScreen() {
  const router = useRouter();
  const { authLoading, isAuthenticated } = useClientSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/auth/continue");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError("Enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    setError(null);
    setInfo(null);
    setLoadingMode("email");
    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
      rememberMe,
    });

    setLoadingMode(null);

    if (result.error) {
      setError(result.error.message || "Unable to sign in right now.");
      return;
    }

    setPassword("");
    router.replace("/auth/continue");
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setLoadingMode("google");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/continue",
      newUserCallbackURL: "/auth/continue",
    });

    if (result.error) {
      setLoadingMode(null);
      setError(result.error.message || "Unable to continue with Google.");
    }
  };

  const emailHasError = Boolean(error?.toLowerCase().includes("email"));
  const passwordHasError = Boolean(error?.toLowerCase().includes("password"));
  const showGlobalError = Boolean(error) && !emailHasError && !passwordHasError;
  const isBusy = loadingMode !== null;

  return (
    <AuthScreenShell
      title=""
      subtitle="Glad to see you again. Let's reach your goals!"
    >
      <div className="space-y-4">
        <AuthField
          id="login-email"
          label="Email"
          error={emailHasError ? error ?? undefined : undefined}
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-14 rounded-[1.25rem] pl-11 text-sm"
              aria-label="Email address"
              aria-invalid={emailHasError || undefined}
              disabled={isBusy}
            />
          </div>
        </AuthField>

        <AuthField
          id="login-password"
          label="Password"
          error={passwordHasError ? error ?? undefined : undefined}
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="h-14 rounded-[1.25rem] px-11 text-sm"
              aria-label="Password"
              aria-invalid={passwordHasError || undefined}
              disabled={isBusy}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[var(--color-text-secondary)] transition hover:bg-zinc-100 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isBusy}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </AuthField>
      </div>

        {showGlobalError ? (
        <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
          {error}
        </p>
      ) : null}

      {info ? (
        <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {info}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            disabled={isBusy}
          />
          Remember this device
        </label>
        <button
          type="button"
          onClick={() =>
            setInfo("Forgot password is not available until email delivery is configured.")
          }
          className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
        >
          Forgot password?
        </button>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleSignIn}
          size="lg"
          className="h-14 w-full rounded-[1.25rem] bg-[linear-gradient(135deg,#d61f2c_0%,#b01722_100%)] text-base font-semibold text-white shadow-[0_10px_24px_rgba(214,31,44,0.24)] hover:opacity-95"
          disabled={isBusy}
        >
          {loadingMode === "email" ? "Signing In..." : "Sign In"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="h-14 w-full rounded-[1.25rem] border border-[var(--color-primary)] bg-white text-base font-semibold text-[var(--color-primary)] hover:bg-[rgba(214,31,44,0.04)]"
          disabled={isBusy}
          onClick={() => router.push("/signup")}
        >
          Sign Up
        </Button>
      </div>

      <div className="space-y-3 pt-1">
        <AuthDivider />
        <AuthGoogleButton
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          loading={loadingMode === "google"}
        />
      </div>
    </AuthScreenShell>
  );
}
