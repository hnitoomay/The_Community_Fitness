"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useClientSession } from "@/components/client/client-session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthDivider } from "../auth/auth-divider";
import { AuthField } from "../auth/auth-field";
import { AuthGoogleButton } from "../auth/auth-google-button";
import { AuthScreenShell } from "../auth/auth-screen-shell";

const MIN_PASSWORD_LENGTH = 8;

export function SignupScreen() {
  const router = useRouter();
  const { authLoading, isAuthenticated } = useClientSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/auth/continue");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      setError("Enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoadingMode("email");
    const result = await authClient.signUp.email({
      name: fullName.trim(),
      email: email.trim(),
      password,
      callbackURL: "/auth/continue",
    });

    setLoadingMode(null);

    if (result.error) {
      setError(result.error.message || "Unable to create your account right now.");
      return;
    }

    router.replace("/auth/continue");
  };

  const handleGoogleSignUp = async () => {
    setError(null);
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

  const fullNameHasError = Boolean(error?.toLowerCase().includes("name"));
  const emailHasError = Boolean(error?.toLowerCase().includes("email"));
  const passwordHasError =
    Boolean(error?.toLowerCase().includes("password")) &&
    !error?.toLowerCase().includes("match");
  const confirmPasswordHasError = Boolean(error?.toLowerCase().includes("match"));
  const showGlobalError =
    Boolean(error) &&
    !fullNameHasError &&
    !emailHasError &&
    !passwordHasError &&
    !confirmPasswordHasError;
  const isBusy = loadingMode !== null;

  return (
    <AuthScreenShell
      title="Create Account"
      subtitle="Start your personalized fitness journey."
    >
      <div className="space-y-4">
        <AuthField
          id="signup-full-name"
          label="Full Name"
          error={fullNameHasError ? error ?? undefined : undefined}
        >
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="signup-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              className="h-14 rounded-[1.25rem] pl-11 text-sm"
              aria-label="Full name"
              aria-invalid={fullNameHasError || undefined}
              disabled={isBusy}
            />
          </div>
        </AuthField>

        <AuthField
          id="signup-email"
          label="Email"
          error={emailHasError ? error ?? undefined : undefined}
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="signup-email"
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
          id="signup-password"
          label="Password"
          error={passwordHasError ? error ?? undefined : undefined}
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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

        <AuthField
          id="signup-confirm-password"
          label="Confirm Password"
          error={confirmPasswordHasError ? error ?? undefined : undefined}
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className="h-14 rounded-[1.25rem] px-11 text-sm"
              aria-label="Confirm password"
              aria-invalid={confirmPasswordHasError || undefined}
              disabled={isBusy}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[var(--color-text-secondary)] transition hover:bg-zinc-100 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
              disabled={isBusy}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </AuthField>
      </div>

      {showGlobalError ? (
        <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button
          onClick={handleSignUp}
          size="lg"
          className="h-14 w-full rounded-[1.25rem] bg-[linear-gradient(135deg,#d61f2c_0%,#b01722_100%)] text-base font-semibold text-white shadow-[0_10px_24px_rgba(214,31,44,0.24)] hover:opacity-95"
          disabled={isBusy}
        >
          {loadingMode === "email" ? "Creating Account..." : "Sign Up"}
        </Button>
      </div>

      <div className="space-y-3 pt-1">
        <AuthDivider />
        <AuthGoogleButton
          onClick={handleGoogleSignUp}
          disabled={isBusy}
          loading={loadingMode === "google"}
        />
      </div>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
        >
          Sign In
        </Link>
      </p>
    </AuthScreenShell>
  );
}
