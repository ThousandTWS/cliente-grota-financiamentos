
import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import {
    BadgeDollarSign,
    Calculator,
    ClipboardCheck,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Link2,
    Store,
} from "lucide-react";

export const operadorNavItems: NavItem[] = [
    {
        name: "Operacao",
        icon: <LayoutDashboard />,
        path: "/operacao",
    },
    {
        name: "Minhas Lojas",
        icon: <Store />,
        subItems: [
            { name: "Lojas vinculadas", path: "/minhas-lojas", icon: <Store size={16} /> },
        ]
    },
    {
        name: "Financiamentos",
        icon: <BadgeDollarSign />,
        subItems: [
            { name: "Nova Simulacao", path: "/simulacao", pro: false, icon: <Calculator size={16} /> },
        ],
    },
    {
        name: "Propostas",
        icon: <ClipboardList />,
        subItems: [
            { name: "Minha Esteira", path: "/esteira-propostas", pro: false, icon: <ClipboardCheck size={16} /> },
            { name: "Link do Cliente", path: "/propostas/link-cliente", pro: false, icon: <Link2 size={16} /> },
        ],
    },
];

export const operadorOthersItems: NavItem[] = [
    {
        name: "Relatorios",
        icon: <FileText />,
        path: "/operador/relatorios",
    },
];
