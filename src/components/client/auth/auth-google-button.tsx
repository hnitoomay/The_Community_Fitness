import { Button } from "@/components/ui/button";

import { AuthGoogleIcon } from "./auth-google-icon";

interface AuthGoogleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading: boolean;
}

export function AuthGoogleButton({
  onClick,
  disabled = false,
  loading,
}: AuthGoogleButtonProps) {
  return (
    <Button
      variant="secondary"
      size="lg"
      className="h-14 w-full rounded-[1.25rem] border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-none hover:bg-zinc-50"
      aria-label="Continue with Google"
      onClick={onClick}
      disabled={disabled}
      leadingIcon={<AuthGoogleIcon />}
    >
      {loading ? "Redirecting to Google..." : "Continue with Google"}
    </Button>
  );
}
