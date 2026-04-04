import re

with open("apps/dealer-portal/app/(painel-operador)/esteira-propostas/[proposalId]/historico/page.tsx", "r") as f:
    orig = f.read()

with open("apps/admin-console/app/(admin)/esteira-de-propostas/[proposalId]/historico/page.tsx", "r") as f:
    admin = f.read()

# I want to copy the EditModal, Form, ProposalFormValues, parseDateToDayjs etc from admin to dealer portal

# First extract the helpers from admin
helpers_match = re.search(r'(type EditMode = "edit" \| "complete";.*?export default function ProposalHistoryPage)', admin, re.DOTALL)
if helpers_match:
    helpers = helpers_match.group(1)
else:
    print("Failed to match helpers")
    exit(1)

# Now extract the state variables for form/modal
state_vars_match = re.search(r'(  const \[form\] = Form\.useForm<ProposalFormValues>\(\);.*?  const \[editModalState.*?}\);)', admin, re.DOTALL)
state_vars = state_vars_match.group(1) if state_vars_match else ""

# Calculate missing fields logic
missing_fields_match = re.search(r'(  const missingFieldLabels = useMemo\(\(\) => \{.*?\}, \[.*?\]\);)', admin, re.DOTALL)
missing_fields = missing_fields_match.group(1) if missing_fields_match else ""

# Extract openEditModal, closeEditModal, handleSaveProposalData
edit_modal_funcs_match = re.search(r'(  const openEditModal = useCallback\(\s*\(mode: EditMode.*?\n  \);)', admin, re.DOTALL)
edit_modal_funcs = edit_modal_funcs_match.group(1) if edit_modal_funcs_match else ""

# Extract the buttons
buttons_match = re.search(r'(              <Button\n\s*icon={<Pencil.*?Completar dados\n\s*</Button>)', admin, re.DOTALL)
buttons = buttons_match.group(1) if buttons_match else ""

# Extract the Modal
modal_match = re.search(r'(      <Modal\n\s*title={editModalState.*?      </Modal>\n\n      <Modal\n\s*open={messageOpen})', admin, re.DOTALL)
modal = modal_match.group(1) if modal_match else ""


# NOW APPLY TO ORIG
orig = orig.replace('import { updateProposalStatus', 'import { CreateProposalPayload, updateProposal, updateProposalStatus')
orig = orig.replace('import { ArrowLeft, StickyNote } from "lucide-react";', 'import { ArrowLeft, Pencil, StickyNote } from "lucide-react";\nimport dayjs, { type Dayjs } from "dayjs";')

# Inject helpers before "export default"
orig = orig.replace('export default function ProposalHistoryPage', helpers + 'export default function ProposalHistoryPage')

# Inject state vars
orig = orig.replace('const [error, setError] = useState<string | null>(null);', 'const [error, setError] = useState<string | null>(null);\n' + state_vars + '\n  const [isSavingProposalData, setIsSavingProposalData] = useState(false);')

# Inject missing fields inside the component
orig = orig.replace('  const timelineItems = useMemo', missing_fields + '\n\n  const timelineItems = useMemo')

# Fix toast usage in handleSaveProposalData since dealer-portal uses messageApi
edit_modal_funcs_fixed = edit_modal_funcs.replace('toast({', 'messageApi.open({').replace('title:', 'content:').replace('description:', '/*').replace('variant: "destructive",', 'type: "error",').replace('});', '*/});')
edit_modal_funcs_fixed = edit_modal_funcs_fixed.replace('toast({\n        title: "Ficha atualizada",\n        description: "Dados da ficha salvos com sucesso.",\n      });', 'messageApi.success("Dados da ficha salvos com sucesso.");')
edit_modal_funcs_fixed = edit_modal_funcs_fixed.replace('toast({\n          title: "Campos obrigatorios pendentes",\n          description: "Preencha os campos obrigatorios antes de salvar.",\n          variant: "destructive",\n        });', 'messageApi.error("Preencha os campos obrigatorios antes de salvar.");')
edit_modal_funcs_fixed = edit_modal_funcs_fixed.replace('toast({\n        title: "Erro ao salvar ficha",\n        description: message,\n        variant: "destructive",\n      });', 'messageApi.error(message);')

# Replace toast context
edit_modal_funcs_fixed = edit_modal_funcs_fixed.replace('toast', 'messageApi')

# Inject openEditModal, etc before performStatusUpdate
orig = orig.replace('  const performStatusUpdate = useCallback(', edit_modal_funcs_fixed + '\n\n  const performStatusUpdate = useCallback(')

# Inject buttons before <Select
orig = orig.replace('              <Select', buttons + '\n              <Select')

# Inject Modal before the messageModal
orig = orig.replace('      <Modal\n        open={messageOpen}', modal.replace('      <Modal\n        open={messageOpen}', '      <Modal\n        open={messageOpen}'))

# Ensure Form, InputNumber, Switch, DatePicker exist in antd imports
orig = orig.replace('Alert,', 'Alert,\n  DatePicker,\n  Switch,\n  Form,\n  InputNumber,')


with open("apps/dealer-portal/app/(painel-operador)/esteira-propostas/[proposalId]/historico/page.tsx", "w") as f:
    f.write(orig)
    
print("Done merging!")
