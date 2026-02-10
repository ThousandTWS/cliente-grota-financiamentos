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
  Car,
  Megaphone,
  Users,
  Calculator,
  BarChart3,
  Settings,
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
  },

  {
  name: "Marketplace",
  icon: <ClipboardList />,
  subItems: [
    {
      name: "Dashboard da Loja",
      path: "/marketplace/dashboard",
      icon: <LayoutDashboard size={16} />,
      pro: false
    },
    {
      name: "Veículos",
      path: "/marketplace/veiculos",
      icon: <Car size={16} />,
      pro: false
    },
    {
      name: "Anúncios",
      path: "/marketplace/anuncios",
      icon: <Megaphone size={16} />,
      pro: false
    },
    {
      name: "Leads da Loja",
      path: "/marketplace/leads",
      icon: <Users size={16} />,
      pro: false
    },
    {
      name: "Propostas",
      path: "/marketplace/propostas",
      icon: <FileText size={16} />,
      pro: false
    },
    {
      name: "Simulações de Financiamento",
      path: "/marketplace/simulacoes",
      icon: <Calculator size={16} />,
      pro: false
    },
    {
      name: "Parceiros & Lojas",
      path: "/marketplace/parceiros",
      icon: <Building2 size={16} />,
      pro: false
    },
    {
      name: "Relatórios",
      path: "/marketplace/relatorios",
      icon: <BarChart3 size={16} />,
      pro: false
    },
    {
      name: "Configurações da Loja",
      path: "/marketplace/configuracoes",
      icon: <Settings size={16} />,
      pro: false
    }
  ]
}

];
