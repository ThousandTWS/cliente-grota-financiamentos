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
  Bot,
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
  /*
    {
  name: "Gestão de Cobranças",
  icon: <Receipt />,
  subItems: [
    {
      name: "Criar Cobrança",
      path: "/cobrancas/criar",
      pro: false,
      icon: <PlusCircle size={16} />
    },
    {
      name: "Lista de Cobranças",
      path: "/cobrancas",
      pro: false,
      icon: <List size={16} />
    },
    {
      name: "Cobranças Pendentes",
      path: "/cobrancas/pendentes",
      pro: false,
      icon: <Clock size={16} />
    },
    {
      name: "Cobranças Pagas",
      path: "/cobrancas/pagas",
      pro: false,
      icon: <CheckCircle size={16} />
    },
    {
      name: "Cobranças em Atraso",
      path: "/cobrancas/atrasadas",
      pro: false,
      icon: <AlertCircle size={16} />
    },
    {
      name: "Inadimplência",
      path: "/cobrancas/inadimplencia",
      pro: false,
      icon: <TrendingDown size={16} />
    },
    {
      name: "Relatórios",
      path: "/cobrancas/relatorios",
      pro: false,
      icon: <BarChart3 size={16} />
    }
  ],
}
  */


];
