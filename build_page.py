import re

with open("apps/admin-console/app/(admin)/esteira-de-propostas/[proposalId]/historico/page.tsx", "r") as f:
    code = f.read()

# 1. Fix Imports
code = code.replace(
    'import { getAllLogistics } from "@/application/services/Logista/logisticService";',
    'import { fetchAllDealers } from "@/application/services/DealerServices/dealerService";'
)
code = code.replace(
    'import { getAllSellers } from "@/application/services/Seller/sellerService";',
    'import { fetchAllSellers } from "@/application/services/Sellers/sellerService";\nimport userServices from "@/application/services/UserServices/UserServices";'
)

# 2. Fix the routing from /esteira-de-propostas to /esteira-propostas
code = code.replace(
    'href="/esteira-de-propostas"',
    'href="/esteira-propostas"'
)

# 3. Replace useToast with antd message
code = code.replace(
    'import { useToast } from "@/application/core/hooks/use-toast";\n',
    ''
)
code = code.replace(
    'const { toast } = useToast();',
    'const [messageApi, contextHolder] = message.useMessage();\n  const [canChangeProposalStatus, setCanChangeProposalStatus] = useState(true);\n  const [isLoadingPermission, setIsLoadingPermission] = useState(true);'
)

# 4. Insert permission effect
perm_effect = """
  useEffect(() => {
    let mounted = true;

    const loadPermission = async () => {
      try {
        const user = await userServices.me();
        if (!mounted) return;

        if ((user.role ?? "").toUpperCase() === "OPERADOR") {
          setCanChangeProposalStatus(user.canChangeProposalStatus ?? true);
        } else {
          setCanChangeProposalStatus(true);
        }
      } catch (err) {
        console.warn(
          "[Operador Historico] Nao foi possivel carregar permissoes do usuario",
          err,
        );
      } finally {
        if (mounted) {
          setIsLoadingPermission(false);
        }
      }
    };

    void loadPermission();

    return () => {
      mounted = false;
    };
  }, []);
"""
code = code.replace('useEffect(() => {\n    const loadNames = async () => {', perm_effect + '\n  useEffect(() => {\n    const loadNames = async () => {')

# 5. Fix internal usages
code = code.replace('getAllLogistics', 'fetchAllDealers')
code = code.replace('getAllSellers', 'fetchAllSellers')

code = code.replace('if (!proposal) return;\n      setIsUpdatingStatus', 'if (!proposal) return;\n      if (!canChangeProposalStatus) {\n        messageApi.warning("Seu acesso nao permite alterar o status das fichas.");\n        return;\n      }\n      setIsUpdatingStatus')
code = code.replace('if (!proposal) return;\n      const needsContractData', 'if (!proposal) return;\n      if (!canChangeProposalStatus) {\n        messageApi.warning("Seu acesso nao permite alterar o status das fichas.");\n        return;\n      }\n      const needsContractData')

# 6. Disable buttons if no permission
code = code.replace('disabled={!proposal || isSavingProposalData}', 'disabled={!proposal || isSavingProposalData || !canChangeProposalStatus}')

code = code.replace(
    '<Select\n                value={proposal?.status}\n                onChange={(value) => handleStatusChange(value as ProposalStatus)}\n                disabled={!proposal || isUpdatingStatus}',
    '<Select\n                value={proposal?.status}\n                onChange={(value) => handleStatusChange(value as ProposalStatus)}\n                disabled={!proposal || isUpdatingStatus || !canChangeProposalStatus || isLoadingPermission}'
)

# Replace all toasts
code = re.sub(
    r'toast\(\{\s*title: "([^"]+)",\s*description: "([^"]+)",\s*\}\);',
    r'messageApi.success("\1: \2");',
    code
)

code = re.sub(
    r'toast\(\{\s*title: "([^"]+)",\s*description: `([^`]+)`,\s*\}\);',
    r'messageApi.success(`\1: \2`);',
    code
)

code = re.sub(
    r'toast\(\{\s*title: "Erro ao salvar ficha",\s*description: message,\s*variant: "destructive",\s*\}\);',
    r'messageApi.error(message);',
    code
)

code = re.sub(
    r'toast\(\{\s*title: "Erro ao atualizar status",\s*description: message,\s*variant: "destructive",\s*\}\);',
    r'messageApi.error(message);',
    code
)

code = re.sub(
    r'toast\(\{\s*title: "Erro ao salvar mensagem",\s*description: message,\s*variant: "destructive",\s*\}\);',
    r'messageApi.error(message);',
    code
)

code = re.sub(
    r'toast\(\{\s*title: "Campos obrigatorios pendentes",\s*description: "([^"]+)",\s*variant: "destructive",\s*\}\);',
    r'messageApi.error("\1");',
    code
)

# And inject context holder right inside the <main>
code = code.replace('<main className="min-h-screen bg-slate-50 px-4 py-6">', '<main className="min-h-screen bg-slate-50 px-4 py-6">\n        {contextHolder}')

# Change "painel-operador" in the updateProposal call instead of "admin-console"
code = code.replace('actor: "admin-console"', 'actor: "painel-operador"')

with open("apps/dealer-portal/app/(painel-operador)/esteira-propostas/[proposalId]/historico/page.tsx", "w") as f:
    f.write(code)

print("Done building page.")
