import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import {
  LayoutDashboard,
  ClipboardList,
  Users2,
  Building2,
  BadgeCheck,
  ShieldCheck,
  UserCog,
  FileText,
  Receipt,
  PlusCircle,
} from "lucide-react";

export const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard />,
    name: "Painel Administrativo",
    subItems: [
      {
        name: "Visao Geral",
        path: "/visao-geral",
        pro: false,
        icon: <LayoutDashboard size={16} />
      },
    ],
  },
  {
    icon: <ClipboardList />,
    name: "Gestão de Propostas",
    subItems: [
      {
        name: "Esteira de Propostas",
        path: "/esteira-de-propostas",
        pro: false,
        icon: <ClipboardList size={16} />
      },
      {
        name: "Simulador",
        path: "/simulacao/novo",
        pro: false,
        icon: <FileText size={16} />
      },
    ],
  },
  {
    icon: <Users2 />,
    name: "Gestão de usuarios",
    subItems: [
      {
        name: "Cadastrar Vendedor",
        path: "/vendedores",
        pro: false,
        icon: <UserCog size={16} />
      },
      {
        name: "Cadastrar Operadores",
        path: "/operadores",
        pro: false,
        icon: <ShieldCheck size={16} />
      },
      {
        name: "Cadastrar Gestores",
        path: "/gestores",
        pro: false,
        icon: <BadgeCheck size={16} />
      },
    ],
  },
  {
    name: "Gestão de Lojas",
    icon: <Building2 />,
    subItems: [
      {
        name: "Cadastrar Lojas",
        path: "/logistas",
        pro: false,
        icon: <Building2 size={16} />
      },
    ],
  },
    {
  name: "Gestão de Cobranças",
  icon: <Receipt />,
  subItems: [
    {
      name: "Contratos",
      path: "/cobrancas",
      pro: false,
      icon: <PlusCircle size={16} />
    },
  ],
}
];
