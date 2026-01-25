import { 
    LayoutDashboard, 
    ClipboardList, 
    Users2, 
    Building2, 
    Receipt, 
    Settings, 
    FileText, 
    UserCog, 
    ShieldCheck, 
    BadgeCheck,
    MessageSquare,
    DollarSign,
    BarChart3,
    Files
} from "lucide-react";
import { SearchItem } from "../SearchItem";

export const searchItems: SearchItem[] = [
    {
        id: "dashboard",
        title: "Visão Geral",
        description: "Painel geral de métricas e status",
        icon: <LayoutDashboard className="size-4" />,
        href: "/visao-geral",
        group: "Navegação",
        keywords: ["home", "inicio", "dashboard", "painel", "resumo"]
    },
    {
        id: "esteira-propostas",
        title: "Esteira de Propostas",
        description: "Gestão e acompanhamento de propostas",
        icon: <ClipboardList className="size-4" />,
        href: "/esteira-de-propostas",
        group: "Propostas",
        keywords: ["propostas", "pedidos", "esteira", "vendas"]
    },
    {
        id: "simulador",
        title: "Simulador de Financiamento",
        description: "Realizar novas simulações",
        icon: <FileText className="size-4" />,
        href: "/simulacao/novo",
        group: "Propostas",
        keywords: ["simulacao", "calculo", "novo", "financiamento"]
    },
    {
        id: "vendedores",
        title: "Vendedores",
        description: "Gestão de vendedores cadastrados",
        icon: <UserCog className="size-4" />,
        href: "/vendedores",
        group: "Usuários",
        keywords: ["vendedor", "equipe", "cadastro"]
    },
    {
        id: "operadores",
        title: "Operadores",
        description: "Gestão de operadores do sistema",
        icon: <ShieldCheck className="size-4" />,
        href: "/operadores",
        group: "Usuários",
        keywords: ["operador", "suporte", "equipe"]
    },
    {
        id: "gestores",
        title: "Gestores",
        description: "Gestão de gerentes e diretores",
        icon: <BadgeCheck className="size-4" />,
        href: "/gestores",
        group: "Usuários",
        keywords: ["gestor", "gerente", "diretoria"]
    },
    {
        id: "lojas",
        title: "Lojas e Logistas",
        description: "Gerenciar unidades e parceiros",
        icon: <Building2 className="size-4" />,
        href: "/logistas",
        group: "Lojas",
        keywords: ["loja", "logista", "unidade", "parceiro"]
    },
    {
        id: "cobrancas",
        title: "Cobranças",
        description: "Gestão financeira e faturamento",
        icon: <Receipt className="size-4" />,
        href: "/cobrancas",
        group: "Financeiro",
        keywords: ["cobranca", "fatura", "pagamento", "boleto"]
    },
    {
        id: "comissoes",
        title: "Comissões",
        description: "Relatórios de comissionamento",
        icon: <DollarSign className="size-4" />,
        href: "/comissoes",
        group: "Financeiro",
        keywords: ["comissao", "pagamento", "remuneracao"]
    },
    {
        id: "relatorios",
        title: "Relatórios Gerais",
        description: "Exportação de dados e relatórios",
        icon: <BarChart3 className="size-4" />,
        href: "/relatorios",
        group: "Dados",
        keywords: ["relatorio", "exportar", "planilha", "pdf"]
    },
    {
        id: "ia-chat",
        title: "IA Chat",
        description: "Assistente inteligente",
        icon: <MessageSquare className="size-4" />,
        href: "/ia-chat",
        group: "Recursos",
        keywords: ["chat", "ia", "ajuda", "assistente"]
    },
    {
        id: "documentos",
        title: "Gestão de Documentos",
        description: "Arquivos e documentação",
        icon: <Files className="size-4" />,
        href: "/gestao-documentos",
        group: "Recursos",
        keywords: ["documento", "arquivo", "upload", "doc"]
    },
    {
        id: "configuracoes",
        title: "Configurações",
        description: "Ajustes e preferências do sistema",
        icon: <Settings className="size-4" />,
        href: "/configuracoes",
        group: "Sistema",
        keywords: ["configuracao", "ajuste", "perfil", "usuario"]
    }
];
