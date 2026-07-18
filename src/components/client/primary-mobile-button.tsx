import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function PrimaryMobileButton(props: ComponentProps<typeof Button>) {
  return <Button size="lg" className="w-full rounded-2xl" {...props} />;
}
