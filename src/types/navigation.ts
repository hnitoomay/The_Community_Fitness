import type { LucideIcon } from "lucide-react";

export type ClientNavigationId =
  | "home"
  | "workout"
  | "nutrition"
  | "history"
  | "account";

export interface NavigationItem {
  id: ClientNavigationId;
  href: string;
  label: string;
  icon: LucideIcon;
  matchPaths?: string[];
}

export interface ClientDrawerLink {
  href?: string;
  label: string;
  icon: LucideIcon;
  action?: "logout";
}
