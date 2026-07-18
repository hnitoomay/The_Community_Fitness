import { Activity, CheckCircle2, Sparkles } from "lucide-react";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { MobileFormField } from "@/components/client/mobile-form-field";
import { PrimaryMobileButton } from "@/components/client/primary-mobile-button";
import { SectionIntro } from "@/components/shared/section-intro";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";

interface ClientRoutePreviewProps {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
}

export function ClientRoutePreview({
  eyebrow,
  title,
  description,
  cta,
}: ClientRoutePreviewProps) {
  return (
    <ClientPage>
      <SectionIntro eyebrow={eyebrow} title={title} description={description} />
      <ClientCard className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge>Mock Data</Badge>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Mobile-first foundation in place
            </h2>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[rgba(214,31,44,0.12)] text-[var(--color-primary)]">
            <Sparkles className="size-5" />
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl bg-[var(--color-muted-bg)] p-4">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <CheckCircle2 className="size-4 text-[var(--color-success)]" />
            Shared design tokens and input states are active.
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <Activity className="size-4 text-[var(--color-primary)]" />
            Touch-first cards, spacing, and safe-area padding are applied.
          </div>
        </div>
      </ClientCard>
      <ClientCard className="space-y-4">
        <MobileFormField
          label="Example field"
          hint="Validation, disabled, and focus states are wired for the final forms."
        >
          <Input placeholder="Mock input" />
        </MobileFormField>
        <RadioGroup
          name={`goal-${title}`}
          defaultValue="steady"
          options={[
            {
              label: "Steady progress",
              value: "steady",
              description: "Balanced weekly training and meals.",
            },
            {
              label: "Aggressive cut",
              value: "cut",
              description: "Higher structure and tighter nutrition control.",
            },
          ]}
        />
        <Checkbox
          label="Keep the plan equipment-aware"
          description="Final AI generation will only use eligible gym equipment later."
          defaultChecked
        />
      </ClientCard>
      <PrimaryMobileButton>{cta}</PrimaryMobileButton>
    </ClientPage>
  );
}
