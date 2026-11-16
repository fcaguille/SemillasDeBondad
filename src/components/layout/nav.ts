import { BarChart2, Clock, ScanQrCode, Sprout, User, Mail, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Center elevated action on mobile */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/impacto", label: "Impacto", icon: Sprout },
  { to: "/ranking", label: "Ranking", icon: BarChart2 },
  { to: "/escanear", label: "Escanear", icon: ScanQrCode, primary: true },
  { to: "/historial", label: "Historial", icon: Clock },
  { to: "/cuenta", label: "Cuenta", icon: User },
  { to: "/contacto", label: "Contacto", icon: Mail },
];
