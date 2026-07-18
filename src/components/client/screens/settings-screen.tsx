"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { MobileFormField } from "@/components/client/mobile-form-field";
import { SettingRow } from "@/components/client/setting-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientSession } from "@/components/client/client-session-provider";

interface SettingsScreenProps {
  hasCredentialAccount: boolean;
}

type PasswordErrorMap = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

export function SettingsScreen({ hasCredentialAccount }: SettingsScreenProps) {
  const router = useRouter();
  const { logout } = useClientSession();
  const [activePanel, setActivePanel] = useState<"password" | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrorMap>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordPending, setIsPasswordPending] = useState(false);

  const passwordPanelDescription = useMemo(
    () =>
      hasCredentialAccount
        ? "Update the password used by your email sign-in account."
        : "This account signs in with Google. Password change is not available.",
    [hasCredentialAccount],
  );

  const handleLogout = async () => {
    setLogoutError(null);

    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("Unable to sign out right now.");
    }
  };

  const handleChangePassword = async () => {
    const nextErrors: PasswordErrorMap = {};
    setPasswordMessage(null);
    setPasswordError(null);

    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = "Enter your current password.";
    }

    if (!passwordForm.newPassword.trim()) {
      nextErrors.newPassword = "Enter a new password.";
    } else if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = "New password must be at least 8 characters.";
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = "New passwords do not match.";
    }

    setPasswordErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsPasswordPending(true);

    try {
      const result = await authClient.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setPasswordError(result.error.message || "Unable to change your password right now.");
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setPasswordMessage("Password updated successfully.");
    } catch {
      setPasswordError("Unable to change your password right now.");
    } finally {
      setIsPasswordPending(false);
    }
  };

  return (
    <ClientAuthGate>
      <ClientShell title="Account Settings" subtitle="Manage your profile, password, and sign-in session.">
        <ClientPage className="space-y-4 pb-24">
          {logoutError ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {logoutError}
            </p>
          ) : null}

          <div className="space-y-3">
            <SettingRow
              label="Edit Profile"
              description="Update your stable personal profile information."
              onClick={() => router.push("/settings/profile")}
            />
            <SettingRow
              label="Change Password"
              description={
                hasCredentialAccount
                  ? "Update the password for your email sign-in account."
                  : "Password changes are available only for email/password accounts."
              }
              onClick={() => {
                setActivePanel("password");
                setPasswordMessage(null);
                setPasswordError(null);
              }}
            />
            <SettingRow
              label="Logout"
              description="Sign out of your authenticated account on this device."
              destructive
              onClick={handleLogout}
            />
          </div>

          {activePanel === "password" ? (
            <ClientCard className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Change Password</h2>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {passwordPanelDescription}
                </p>
              </div>

              {passwordMessage ? (
                <p className="rounded-2xl border border-[rgba(21,128,61,0.18)] bg-[rgba(21,128,61,0.08)] px-4 py-3 text-sm text-[var(--color-success)]">
                  {passwordMessage}
                </p>
              ) : null}

              {passwordError ? (
                <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
                  {passwordError}
                </p>
              ) : null}

              {hasCredentialAccount ? (
                <div className="space-y-4">
                  <MobileFormField
                    label="Current Password"
                    error={passwordErrors.currentPassword}
                  >
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      disabled={isPasswordPending}
                    />
                  </MobileFormField>
                  <MobileFormField label="New Password" error={passwordErrors.newPassword}>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      disabled={isPasswordPending}
                    />
                  </MobileFormField>
                  <MobileFormField
                    label="Confirm New Password"
                    error={passwordErrors.confirmPassword}
                  >
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      disabled={isPasswordPending}
                    />
                  </MobileFormField>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setActivePanel(null)}
                      disabled={isPasswordPending}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleChangePassword}
                      loading={isPasswordPending}
                    >
                      {isPasswordPending ? "Updating..." : "Change Password"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="rounded-2xl bg-[var(--color-muted-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    This account signs in with Google. Password change is not available.
                  </p>
                  <Button type="button" variant="secondary" className="w-full" onClick={() => setActivePanel(null)}>
                    Close
                  </Button>
                </div>
              )}
            </ClientCard>
          ) : null}
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
