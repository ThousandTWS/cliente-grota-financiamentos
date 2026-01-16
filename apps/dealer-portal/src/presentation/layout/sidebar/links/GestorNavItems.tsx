
import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import {
    ClipboardCheck,
    ClipboardList,
    FileText,
    LayoutDashboard,
    PieChart,
    Settings,
    Store,
    Users,
} from "lucide-react";

export const gestorNavItems: NavItem[] = [
    {
        name: "Desempenho",
        icon: <LayoutDashboard />,
        path: "/dashboard",
    },
    {
        name: "Minha Loja",
        icon: <Store />,
        path: "/loja",
    },
    {
        name: "Equipe",
        icon: <Users />,
        subItems: [
            { name: "Vendedores", path: "/gestao", icon: <Users size={16} /> },
        ]
    },
    {
        name: "Propostas",
        icon: <ClipboardList />,
        subItems: [
            { name: "Esteira", path: "/gestao/propostas", pro: false, icon: <ClipboardCheck size={16} /> },
        ],
    },
];

export const gestorOthersItems: NavItem[] = [
    {
        name: "Relatorios",
        icon: <PieChart />,
        path: "/gestor/relatorios",
    },
    {
        name: "Documentos",
        icon: <FileText />,
        path: "/documentos",
    },
    {
        name: "Configuracoes",
        icon: <Settings />,
        path: "/gestor/configuracoes",
    },
];
