import {
  CalendarDays,
  HeartPulse,
  History,
  Home,
  Salad,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ClientDrawerLink, NavigationItem } from "@/types/navigation";

export const clientBottomNavigation: NavigationItem[] = [
  { id: "home", href: "/home", label: "Home", icon: Home },
  {
    id: "workout",
    href: "/calendar",
    label: "Workout",
    icon: CalendarDays,
    matchPaths: ["/calendar", "/workout"],
  },
  {
    id: "nutrition",
    href: "/calendar",
    label: "Nutrition",
    icon: Salad,
    matchPaths: ["/workout"],
  },
  { id: "history", href: "/history", label: "History", icon: History, matchPaths: ["/history"] },
  {
    id: "account",
    href: "/settings",
    label: "Account",
    icon: UserRound,
    matchPaths: ["/settings", "/profile"],
  },
];

export const clientDrawerLinks: ClientDrawerLink[] = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/assessment", label: "Assessment", icon: Sparkles },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Account Setting", icon: Settings },
  { action: "logout", label: "Logout", icon: HeartPulse },
];
