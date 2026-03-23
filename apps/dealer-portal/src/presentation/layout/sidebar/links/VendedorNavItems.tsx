import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import {
  BadgeDollarSign,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Link2,
} from "lucide-react";

export const vendedorNavItems: NavItem[] = [
  {
    name: "Minha Operacao",
    icon: <LayoutDashboard />,
    path: "/minhas-operacoes",
  },
  {
    name: "Financiamentos",
    icon: <BadgeDollarSign />,
    subItems: [
      {
        name: "Simulador",
        path: "/simulacao-vendedor",
        pro: false,
        icon: <Calculator size={16} />,
      },
    ],
  },
  {
    name: "Propostas",
    icon: <ClipboardList />,
    subItems: [
      {
        name: "Minhas Propostas",
        path: "/minhas-propostas",
        pro: false,
        icon: <ClipboardCheck size={16} />,
      },
      {
        name: "Link do Cliente",
        path: "/propostas/link-cliente",
        pro: false,
        icon: <Link2 size={16} />,
      },
    ],
  },
];

export const vendedorOthersItems: NavItem[] = [];
