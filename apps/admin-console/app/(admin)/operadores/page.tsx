"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button,
  Card,
  Checkbox,
  Divider,
  Input,
  Select,
  Spin,
  Typography,
} from "antd";
import { createOperator } from "@/application/services/Operator/operatorService";
import { getAllLogistics, Dealer } from "@/application/services/Logista/logisticService";
import { OperatorsList } from "@/presentation/features/painel-geral/components/OperatorsList";
import { fetchAddressByCep } from "@/application/services/cep/cepService";
import { StatusBadge } from "@/presentation/features/logista/components/status-badge";
import { formatName } from "@/lib/formatters";
import { convertBRtoISO } from "@/application/core/utils/formatters";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const operatorSchema = z.object({
  dealerId: z.string().optional(),
  fullName: z.string().min(2, "Informe o nome completo").transform((value) => value.trim()),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .email("E-mail invalido")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .min(1, "Informe o telefone")
    .refine((value) => digitsOnly(value).length >= 10, {
      message: "Informe um telefone valido (minimo 10 digitos)",
    })
    .transform((value) => digitsOnly(value)),
  password: z
    .string()
    .min(6, "A senha precisa ter no minimo 6 caracteres")
    .max(50, "A senha deve ter no maximo 50 caracteres"),
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine((value) => digitsOnly(value).length === 11, {
      message: "Informe um CPF valido (11 digitos)",
    })
    .transform((value) => digitsOnly(value)),
  birthData: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => {
        if (!value) return true;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
        return false;
      },
      { message: "Use o formato AAAA-MM-DD" },
    ),
  street: z.string().optional().or(z.literal("")).transform((value) => value?.trim()),
  number: z.string().optional().or(z.literal("")).transform((value) => value?.trim()),
  complement: z.string().optional().transform((value) => value?.trim()),
  neighborhood: z.string().optional().or(z.literal("")).transform((value) => value?.trim()),
  city: z.string().optional().or(z.literal("")).transform((value) => value?.trim()),
  state: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value.trim().toUpperCase() : value)),
  zipCode: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? digitsOnly(value) : "")),
  canView: z.boolean().default(true),
  canCreate: z.boolean().default(true),
  canUpdate: z.boolean().default(true),
  canDelete: z.boolean().default(true),
});

type OperatorFormValues = z.infer<typeof operatorSchema>;

const brazilStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function Operadores() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <OperadoresContent />
    </Suspense>
  );
}

function OperadoresContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isCpfLoading, setIsCpfLoading] = useState(false);
  const [cpfVerified, setCpfVerified] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [lastCpfLookup, setLastCpfLookup] = useState("");
  const searchParams = useSearchParams();

  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OperatorFormValues>({
    //@ts-ignore
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      cpf: "",
      birthData: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "SP",
      zipCode: "",
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      dealerId: "",
    },
  });

  const selectedDealerId = watch("dealerId");

  useEffect(() => {
    getAllLogistics()
      .then((data) => setDealers(Array.isArray(data) ? data : []))
      .catch(() => setDealers([]));
  }, []);

  useEffect(() => {
    const dealerIdParam = searchParams.get("dealerId");
    if (dealerIdParam) {
      setValue("dealerId", dealerIdParam);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (values: OperatorFormValues) => {
    if (isCpfLoading) {
      toast.error("Aguarde a verificacao do CPF ou tente novamente.");
      return;
    }
    setIsSubmitting(true);
    try {
      let birthDateIso: string | null = null;
      if (values.birthData) {
        const date = new Date(values.birthData);
        if (isNaN(date.getTime())) {
          toast.error("Data de nascimento invalida.");
          setIsSubmitting(false);
          return;
        }
        birthDateIso = date.toISOString().split("T")[0];
      }

      const dealerId = values.dealerId ? Number(values.dealerId) : null;
      const normalizedEmail = values.email.trim().toLowerCase();

      const payload = {
        dealerId: dealerId || null,
        fullName: values.fullName,
        email: normalizedEmail,
        phone: values.phone,
        password: values.password,
        CPF: values.cpf,
        birthData: birthDateIso,
        address: {
          street: values.street || null,
          number: values.number || null,
          complement: values.complement || null,
          neighborhood: values.neighborhood || null,
          city: values.city || null,
          state: values.state || null,
          zipCode: values.zipCode || null,
        },
        canView: values.canView ?? true,
        canCreate: values.canCreate ?? true,
        canUpdate: values.canUpdate ?? true,
        canDelete: values.canDelete ?? true,
      };

      await createOperator(payload);

      toast.success("Operador cadastrado com sucesso!");
      reset();
      setCpfVerified(false);
      setCpfError(null);
      setLastCpfLookup("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel cadastrar o operador.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCpfLookup = async (value: string) => {
    const digits = digitsOnly(value);
    if (digits.length < 11) {
      setCpfVerified(false);
      setCpfError(null);
      setLastCpfLookup("");
      return;
    }

    if (digits.length !== 11 || digits === lastCpfLookup) return;

    setIsCpfLoading(true);
    setCpfVerified(false);
    setCpfError(null);
    setLastCpfLookup(digits);
    try {
      const res = await fetch("/api/searchCPF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digits }),
      });
      const response = await res.json().catch(() => null);
      if (!res.ok || !response?.success) {
        const message =
          response?.error ||
          response?.message ||
          response?.data?.error ||
          response?.data?.message ||
          "Nao foi possivel verificar o CPF.";
        setCpfError(message);
        throw new Error(message);
      }

      const data = response?.data?.response?.content;
      const name = data?.nome?.conteudo?.nome || "";
      const birthDate = data?.nome?.conteudo?.data_nascimento || "";

      if (name) {
        setValue("fullName", formatName(name), { shouldValidate: true });
      }
      if (birthDate) {
        setValue("birthData", convertBRtoISO(birthDate), { shouldValidate: true });
      }
      setCpfVerified(true);
      setCpfError(null);
      toast.success("CPF verificado!");
    } catch (error) {
      console.error("[operadores] CPF lookup", error);
      setCpfVerified(false);
      const message =
        error instanceof Error ? error.message : "Nao foi possivel verificar o CPF.";
      setCpfError(message);
      toast.error(message);
    } finally {
      setIsCpfLoading(false);
    }
  };

  const handleCepLookup = async () => {
    const rawZip = watch("zipCode") ?? "";
    const cep = digitsOnly(rawZip);
    if (cep.length !== 8) {
      toast.error("Informe um CEP com 8 digitos.");
      return;
    }
    setIsCepLoading(true);
    try {
      const address = await fetchAddressByCep(cep);
      if (!address) {
        toast.error("CEP nao encontrado. Verifique o numero e tente novamente.");
        return;
      }

      setTimeout(() => {
        setValue("street", address.street ?? "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue("neighborhood", address.neighborhood ?? "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue("city", address.city ?? "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue("state", (address.state ?? "").toUpperCase(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        toast.success("Endereco preenchido automaticamente!");
      }, 0);
    } catch (error) {
      console.error("[operadores] CEP lookup error:", error);
      toast.error("Erro ao buscar o CEP. Tente preencher manualmente.");
    } finally {
      setIsCepLoading(false);
    }
  };

  const onError = (formErrors: any) => {
    const fieldNames: Record<string, string> = {
      fullName: "Nome completo",
      email: "E-mail",
      phone: "Telefone",
      password: "Senha",
      cpf: "CPF",
      birthData: "Data de nascimento",
      street: "Rua",
      number: "Numero",
      neighborhood: "Bairro",
      city: "Cidade",
      state: "UF",
      zipCode: "CEP",
      dealerId: "Loja",
    };

    Object.keys(formErrors).forEach((key) => {
      const error = formErrors[key];
      if (error?.message) {
        const fieldName = fieldNames[key] || key;
        toast.error(`${fieldName}: ${error.message}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card title="Novo operador">
        <Typography.Paragraph className="text-sm text-muted-foreground">
          Crie usuarios que poderao acessar o painel com o e-mail e senha cadastrados.
        </Typography.Paragraph>
        <form
          //@ts-ignore
          onSubmit={handleSubmit(onSubmit, onError)}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="space-y-2 md:col-span-2">
            <Typography.Text>Loja (opcional)</Typography.Text>
            <Controller
              control={control}
              name="dealerId"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onChange={field.onChange}
                  placeholder="Selecione a loja (opcional)"
                  options={dealers.map((dealer) => ({
                    value: String(dealer.id),
                    label: `${dealer.fullName} - ${dealer.enterprise}`,
                  }))}
                  className="w-full"
                  popupMatchSelectWidth={false}
                  styles={{ popup: { root: { minWidth: 420 } } }}
                />
              )}
            />
            {errors.dealerId && (
              <p className="text-sm text-red-500">{errors.dealerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Typography.Text>Nome completo</Typography.Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => <Input {...field} id="fullName" />}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>E-mail</Typography.Text>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input {...field} id="email" type="email" autoComplete="email" />
              )}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>Telefone</Typography.Text>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  {...field}
                  id="phone"
                  onChange={(event) => field.onChange(event.target.value)}
                />
              )}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>Senha (minimo 6 caracteres)</Typography.Text>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input.Password {...field} id="password" autoComplete="new-password" />
              )}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>CPF (opcional)</Typography.Text>
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <Input
                  {...field}
                  id="cpf"
                  suffix={isCpfLoading ? <Spin size="small" /> : <span style={{ width: 16 }} />}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    handleCpfLookup(event.target.value);
                  }}
                />
              )}
            />
            {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
            {cpfError && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">{cpfError}</p>
                <Button
                  type="default"
                  size="small"
                  onClick={() => handleCpfLookup(watch("cpf") ?? "")}
                  disabled={isCpfLoading}
                >
                  {isCpfLoading ? "Consultando..." : "Tentar consulta novamente"}
                </Button>
              </div>
            )}
          </div>

          {digitsOnly(watch("cpf") ?? "").length === 11 && (
            <div className="space-y-2 md:col-span-2">
              <Typography.Text>Verificacao na Receita</Typography.Text>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={cpfVerified ? "aprovada" : "pendente"} className="shadow-none">
                  {cpfVerified ? "Verificado" : "Nao verificado"}
                </StatusBadge>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Typography.Text>Data de nascimento</Typography.Text>
            <Controller
              control={control}
              name="birthData"
              render={({ field }) => (
                <Input {...field} id="birthData" type="date" className="w-full" />
              )}
            />
            {errors.birthData && (
              <p className="text-sm text-red-500">{errors.birthData.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>CEP</Typography.Text>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="zipCode"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="zipCode"
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                )}
              />
              <Button
                type="default"
                onClick={handleCepLookup}
                disabled={isCepLoading}
              >
                {isCepLoading ? "Buscando..." : "Buscar CEP"}
              </Button>
            </div>
            {errors.zipCode && (
              <p className="text-sm text-red-500">{errors.zipCode.message}</p>
            )}
          </div>

          <Divider className="md:col-span-2" />

          <div className="space-y-2">
            <Typography.Text>Rua</Typography.Text>
            <Controller
              control={control}
              name="street"
              render={({ field }) => (
                <Input {...field} id="street" placeholder="Ex: Av. Paulista" />
              )}
            />
            {errors.street && (
              <p className="text-sm text-red-500">{errors.street.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>Numero</Typography.Text>
            <Controller
              control={control}
              name="number"
              render={({ field }) => <Input {...field} id="number" />}
            />
            {errors.number && (
              <p className="text-sm text-red-500">{errors.number.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>Complemento</Typography.Text>
            <Controller
              control={control}
              name="complement"
              render={({ field }) => <Input {...field} id="complement" />}
            />
          </div>
          <div className="space-y-2">
            <Typography.Text>Bairro</Typography.Text>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field }) => <Input {...field} id="neighborhood" />}
            />
            {errors.neighborhood && (
              <p className="text-sm text-red-500">{errors.neighborhood.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>Cidade</Typography.Text>
            <Controller
              control={control}
              name="city"
              render={({ field }) => <Input {...field} id="city" />}
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Typography.Text>UF</Typography.Text>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  options={brazilStates.map((uf) => ({ value: uf, label: uf }))}
                  placeholder="UF"
                  className="w-full"
                />
              )}
            />
            {errors.state && (
              <p className="text-sm text-red-500">{errors.state.message}</p>
            )}
          </div>

          <Divider className="md:col-span-2" />

          <div className="md:col-span-2">
            <Typography.Text className="text-sm font-semibold">Permissoes</Typography.Text>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name="canView"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
                Ver
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name="canCreate"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
                Criar
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name="canUpdate"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
                Atualizar
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name="canDelete"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
                Excluir
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="primary" htmlType="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Cadastrar operador"}
            </Button>
          </div>
        </form>
      </Card>

      <OperatorsList dealerId={selectedDealerId ? Number(selectedDealerId) : undefined} />
    </div>
  );
}


