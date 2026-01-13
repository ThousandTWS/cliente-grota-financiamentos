import { useEffect, useState } from "react";
import { Button, Card, DatePicker, Input, Select, Spin, Switch, Typography } from "antd";
import { ArrowRight, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { maskCPF, maskPhone } from "@/lib/masks";
import { maskCEP, maskCNPJ, maskDate } from "@/application/core/utils/masks";
import { formatName } from "@/lib/formatters";
import { convertBRtoISO } from "@/application/core/utils/formatters";
import { StatusBadge } from "@/presentation/features/logista/components/status-badge";
import { SimulatorFormData, UpdateSimulatorFormData } from "../hooks/useSimulator";

type Step2PersonalDataProps = {
  formData: SimulatorFormData;
  updateFormData: UpdateSimulatorFormData;
  nextStep: () => void;
  prevStep: () => void;
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");
const normalizePhoneDigits = (value: string) => {
  let digits = digitsOnly(value);
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }
  if (digits.length > 11) {
    digits = digits.slice(-11);
  }
  return digits;
};

const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const blueInputClass = "border-[#134B73] focus-visible:border-[#134B73] focus-visible:ring-[#134B73]/30";

const VALID_DDDS = new Set([
  "11","12","13","14","15","16","17","18","19",
  "21","22","24",
  "27","28",
  "31","32","33","34","35","37","38",
  "41","42","43","44","45","46",
  "47","48","49",
  "51","53","54","55",
  "61",
  "62","64",
  "63",
  "65","66",
  "67",
  "68",
  "69",
  "71","73","74","75","77",
  "79",
  "81","87",
  "82",
  "83",
  "84",
  "85","88",
  "86","89",
  "91","93","94",
  "92","97",
  "95",
  "96",
  "98","99",
]);

const isValidBrazilPhone = (digits: string) => {
  if (digits.length < 10 || digits.length > 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const ddd = digits.slice(0, 2);
  if (!VALID_DDDS.has(ddd)) return false;
  const subscriber = digits.slice(2);
  if (digits.length === 11) {
    if (subscriber[0] !== "9") return false;
  } else {
    if (!/[2-8]/.test(subscriber[0] ?? "")) return false;
  }
  return true;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const normalizeVerificationFlag = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    if (
      [
        "true",
        "verificado",
        "verificada",
        "validado",
        "validada",
        "confirmado",
        "confirmada",
        "ativo",
        "ativa",
        "yes",
        "sim",
        "s",
      ].some((token) => normalized.includes(token))
    ) {
      return true;
    }
    if (
      [
        "false",
        "nao",
        "nao verificado",
        "nao validado",
        "negado",
        "invalido",
        "pendente",
        "inativo",
        "inativa",
        "cancelado",
      ].some((token) => normalized.includes(token))
    ) {
      return false;
    }
  }
  return null;
};

const extractVerificationFlag = (value: unknown): boolean | null => {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.verificado,
      record.validado,
      record.verificacao,
      record.status_verificacao,
      record.statusVerificacao,
      record.status,
      record.situacao,
      record.confirmado,
      record.verified,
      record.verification,
    ];
    for (const candidate of candidates) {
      const flag = normalizeVerificationFlag(candidate);
      if (flag !== null) return flag;
    }
  }
  return normalizeVerificationFlag(value);
};

const readStringValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.conteudo,
      record.value,
      record.valor,
      record.email,
      record.ds_email,
      record.dsEmail,
      record.endereco,
      record.address,
      record.telefone,
      record.nr_telefone,
      record.nr_nr_telefone,
      record.nrTelefone,
      record.cellphone,
      record.celular,
      record.numero,
      record.phone,
      record.descricao,
      record.description,
      record.status,
      record.situacao,
      record.nome,
      record.codigo,
      record.code,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" || typeof candidate === "number") {
        return String(candidate).trim();
      }
      if (candidate && typeof candidate === "object") {
        const inner = candidate as Record<string, unknown>;
        const innerCandidate =
          inner.email ??
          inner.ds_email ??
          inner.dsEmail ??
          inner.endereco ??
          inner.address ??
          inner.value ??
          inner.valor ??
          inner.telefone ??
          inner.nr_telefone ??
          inner.nr_nr_telefone ??
          inner.nrTelefone ??
          inner.cellphone ??
          inner.celular ??
          inner.numero ??
          inner.phone ??
          inner.descricao ??
          inner.description ??
          inner.status ??
          inner.situacao ??
          inner.nome ??
          inner.codigo ??
          inner.code;
        if (typeof innerCandidate === "string" || typeof innerCandidate === "number") {
          return String(innerCandidate).trim();
        }
      }
    }
  }
  return "";
};

const pickFirstText = (...values: unknown[]) => {
  for (const value of values) {
    const text = readStringValue(value);
    if (text) return text;
  }
  return "";
};

const normalizeCpfStatusTone = (status?: string | null) => {
  const normalized = normalizeText((status ?? "").toString());
  if (!normalized) return "pendente";
  if (normalized.includes("regular")) return "aprovada";
  if (normalized.includes("pendente")) return "pendente";
  if (
    ["suspens", "cancel", "nula", "inapta", "inativa", "irregular", "obito"].some(
      (token) => normalized.includes(token),
    )
  ) {
    return "recusada";
  }
  return "pendente";
};

const formatCpfStatusLabel = (status?: string | null) => {
  const raw = (status ?? "").toString().trim();
  if (!raw) return "Status nao informado";
  return raw;
};

const CNPJ_STATUS_LABELS: Record<string, string> = {
  "01": "Nula",
  "02": "Ativa",
  "03": "Suspensa",
  "04": "Inapta",
  "08": "Baixada",
};

const normalizeCnpjStatusTone = (status?: string | null) => {
  const raw = (status ?? "").toString().trim().toLowerCase();
  if (!raw) return "pendente";

  const digits = raw.replace(/\D/g, "");
  if (digits) {
    if (digits === "02") return "aprovada";
    if (["01", "03", "04", "08"].includes(digits)) return "recusada";
  }

  const normalized = normalizeText(raw);
  const isActive = ["ativa", "ativo", "regular", "regularizada"].some((value) =>
    normalized.includes(value),
  );
  if (isActive) return "aprovada";

  const isInactive = [
    "baixada",
    "suspensa",
    "suspenso",
    "inapta",
    "inativa",
    "inativada",
    "cancelada",
    "nula",
    "irregular",
  ].some((value) => normalized.includes(value));
  if (isInactive) return "recusada";

  return "pendente";
};

const formatCnpjStatusLabel = (status?: string | null) => {
  const raw = (status ?? "").toString().trim();
  if (!raw) return "Status nao informado";
  const digits = raw.replace(/\D/g, "");
  if (digits) {
    return CNPJ_STATUS_LABELS[digits] ?? raw;
  }
  return raw;
};

const normalizeBirthDate = (value: string) => {
  const raw = value.trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return convertBRtoISO(raw);
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("-");
    return `${year}-${month}-${day}`;
  }
  return raw;
};

const toDigits = (value: unknown) => digitsOnly(String(value ?? ""));

const combinePhoneDigits = (ddd: unknown, ddi: unknown, phone: unknown) => {
  const phoneDigits = toDigits(phone);
  if (!phoneDigits) return "";
  const dddDigits = toDigits(ddd);
  if (dddDigits) {
    return phoneDigits.startsWith(dddDigits) ? phoneDigits : `${dddDigits}${phoneDigits}`;
  }
  const ddiDigits = toDigits(ddi);
  if (ddiDigits) {
    return phoneDigits.startsWith(ddiDigits) ? phoneDigits : `${ddiDigits}${phoneDigits}`;
  }
  return phoneDigits;
};

const extractEmailInfo = (content: Record<string, unknown>) => {
  let email = "";
  let verified: boolean | null = null;

  const registerVerification = (value: unknown) => {
    if (verified !== null) return;
    const flag = extractVerificationFlag(value);
    if (flag !== null) verified = flag;
  };

  const walk = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      if (!email) email = String(value).trim();
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const hasEmailField =
        record.email !== undefined ||
        record.ds_email !== undefined ||
        record.dsEmail !== undefined ||
        record.endereco !== undefined ||
        record.address !== undefined ||
        record.value !== undefined ||
        record.valor !== undefined;
      if (hasEmailField) {
        registerVerification(record);
      }
      const direct = [
        record.email,
        record.ds_email,
        record.dsEmail,
        record.endereco,
        record.address,
        record.value,
        record.valor,
        record.conteudo,
      ];
      for (const candidate of direct) {
        if (!candidate) continue;
        if (Array.isArray(candidate)) {
          candidate.forEach(walk);
          continue;
        }
        if (!email) {
          const text = readStringValue(candidate);
          if (text) email = text;
        }
      }
      if (record.conteudo) {
        registerVerification(record.conteudo);
        walk(record.conteudo);
      }
    }
  };

  [
    content?.email,
    content?.emails,
    content?.ds_email,
    content?.dsEmail,
    content?.contato,
    content?.contatos,
    content?.dados_contato,
    content?.dadosContato,
    content?.user,
  ].forEach(walk);

  return { email, verified };
};

const extractPhoneInfo = (content: Record<string, unknown>) => {
  let verified: boolean | null = null;
  const candidates: string[] = [];

  const registerVerification = (value: unknown) => {
    if (verified !== null) return;
    const flag = extractVerificationFlag(value);
    if (flag !== null) verified = flag;
  };

  const pushCandidate = (value: string) => {
    const digits = digitsOnly(value);
    if (digits) candidates.push(digits);
  };

  const buildPhone = (ddd: unknown, phone: unknown) => {
    const dddDigits = digitsOnly(String(ddd ?? ""));
    const phoneDigits = digitsOnly(String(phone ?? ""));
    if (!dddDigits && !phoneDigits) return "";
    if (phoneDigits.startsWith(dddDigits)) return phoneDigits;
    return `${dddDigits}${phoneDigits}`;
  };

  const walk = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      pushCandidate(String(value));
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const hasPhoneField =
        record.telefone !== undefined ||
        record.nr_telefone !== undefined ||
        record.nr_nr_telefone !== undefined ||
        record.numero !== undefined ||
        record.phone !== undefined ||
        record.cellphone !== undefined ||
        record.celular !== undefined ||
        record.fone !== undefined ||
        record.numero_telefone !== undefined ||
        record.ddd !== undefined ||
        record.nr_ddd !== undefined ||
        record.ddi !== undefined ||
        record.nr_ddi !== undefined ||
        record.codigo_ddd !== undefined;
      if (hasPhoneField) {
        registerVerification(record);
      }
      const nestedValues = [
        record.nr_telefone,
        record.telefones,
        record.telefone,
        record.phone,
        record.phones,
      ];
      for (const nested of nestedValues) {
        if (Array.isArray(nested)) {
          nested.forEach(walk);
        } else if (nested && typeof nested === "object") {
          walk(nested);
        }
      }
      const combined = buildPhone(
        record.ddd ?? record.nr_ddd ?? record.ddi ?? record.nr_ddi ?? record.codigo_ddd,
        record.numero ??
          record.nr_nr_telefone ??
          record.nr_telefone ??
          record.telefone ??
          record.phone ??
          record.numero_telefone ??
          record.fone,
      );
      if (combined) pushCandidate(combined);
      const direct = readStringValue(
        record.telefone ??
          record.numero ??
          record.phone ??
          record.numero_telefone ??
          record.fone ??
          record.cellphone ??
          record.celular ??
          record.nr_telefone ??
          record.nr_nr_telefone,
      );
      if (direct) pushCandidate(direct);
      if (record.conteudo) {
        registerVerification(record.conteudo);
        walk(record.conteudo);
      }
    }
  };

  [
    content?.telefone,
    content?.telefones,
    content?.nr_telefone,
    content?.nrTelefone,
    content?.cellphone,
    content?.celular,
    content?.contato,
    content?.contatos,
    content?.dados_contato,
    content?.dadosContato,
    content?.phone,
    content?.phones,
    content?.user,
  ].forEach(walk);

  const phoneDigits = candidates.find((candidate) => candidate.length >= 10) ?? "";
  return { phoneDigits, verified };
};

export default function Step2PersonalData({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}: Step2PersonalDataProps) {
  const [searchingDoc, setSearchingDoc] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [cpfStatus, setCpfStatus] = useState<string | null>(null);
  const [cpfLookupCompleted, setCpfLookupCompleted] = useState(false);
  const [cpfPhoneDigits, setCpfPhoneDigits] = useState("");
  const [cnpjStatus, setCnpjStatus] = useState<string | null>(null);
  const [cnpjLookupCompleted, setCnpjLookupCompleted] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);

  const isPf = formData.personType === "PF";
  const docStatus = isPf ? cpfStatus : cnpjStatus;
  const hasDocStatus = Boolean(docStatus);
  const docStatusLabel = hasDocStatus
    ? isPf
      ? formatCpfStatusLabel(docStatus)
      : formatCnpjStatusLabel(docStatus)
    : isPf
      ? "CPF verificado"
      : "CNPJ verificado";
  const docStatusTone = hasDocStatus
    ? isPf
      ? normalizeCpfStatusTone(docStatus)
      : normalizeCnpjStatusTone(docStatus)
    : "aprovada";
  const docLookupCompleted = isPf ? cpfLookupCompleted : cnpjLookupCompleted;
  const emailVerificationLabel =
    emailVerified === null
      ? "Email nao informado"
      : emailVerified
        ? "Email verificado"
        : "Email nao verificado";
  const emailVerificationTone = emailVerified ? "aprovada" : "pendente";
  const phoneDigits = digitsOnly(formData.personal.phone);
  const phoneFraudAlert = phoneDigits.length >= 10 && !isValidBrazilPhone(phoneDigits);
  const phoneVerificationLabel =
    phoneFraudAlert
      ? "Telefone invalido"
      : phoneVerified === null
      ? "Telefone nao informado"
      : phoneVerified
        ? "Telefone verificado"
        : "Telefone nao verificado";
  const phoneVerificationTone = phoneFraudAlert
    ? "recusada"
    : phoneVerified
      ? "aprovada"
      : "pendente";

  useEffect(() => {
    setCpfStatus(null);
    setCpfLookupCompleted(false);
    setCpfPhoneDigits("");
    setCnpjStatus(null);
    setCnpjLookupCompleted(false);
    setEmailVerified(null);
    setPhoneVerified(null);
  }, [formData.personType]);

  const handleDocumentChange = async (value: string) => {
    const masked = formData.personType === "PJ" ? maskCNPJ(value) : maskCPF(value);
    updateFormData("personal", { cpfCnpj: masked });

    const digits = digitsOnly(masked);
    const isComplete = formData.personType === "PJ" ? digits.length === 14 : digits.length === 11;

    if (!isComplete) {
      setCpfStatus(null);
      setCpfLookupCompleted(false);
      setCpfPhoneDigits("");
      setCnpjStatus(null);
      setCnpjLookupCompleted(false);
      setEmailVerified(null);
      setPhoneVerified(null);
      return;
    }

    try {
      setSearchingDoc(true);
      if (formData.personType === "PF") {
        setCpfLookupCompleted(false);
        const res = await fetch("/api/searchCPF", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: digits }),
        });
        const response = await res.json();
        if (response?.success) {
          const payload = (response?.data ?? {}) as Record<string, any>;
          const resultFromList =
            payload?.data?.resultados?.[0] ?? payload?.resultados?.[0] ?? null;
          const contentFromResponse =
            payload?.response?.content ?? payload?.data?.response?.content ?? null;
          const dataRoot = (resultFromList ?? contentFromResponse ?? payload) as Record<
            string,
            any
          >;
          const cadastral =
            dataRoot?.cadastral ?? dataRoot?.cpf ?? dataRoot?.documento ?? dataRoot;
          const contactSource = {
            ...dataRoot,
            user: payload?.user,
            contato:
              dataRoot?.contato ??
              dataRoot?.contact ??
              dataRoot?.contatos ??
              dataRoot?.dados_contato ??
              dataRoot?.dadosContato,
          };

          const cpfStatusText = pickFirstText(
            cadastral?.ds_status_rfb,
            cadastral?.status_rfb,
            cadastral?.situacao_cadastral,
            cadastral?.situacao,
            cadastral?.status,
            dataRoot?.status,
            dataRoot?.situacao,
            dataRoot?.cpf?.situacao_cadastral,
            dataRoot?.cpf?.situacao,
            dataRoot?.cpf?.status,
            dataRoot?.documento?.situacao,
            dataRoot?.documento?.status,
            dataRoot?.status_cadastral,
            dataRoot?.status_receita,
            dataRoot?.cpf_status,
            dataRoot?.situacao_cpf,
          );

          const contactEmail = extractEmailInfo(contactSource);
          const contactPhone = extractPhoneInfo(contactSource);
          const contatoPhones =
            dataRoot?.contato?.nr_telefone ??
            dataRoot?.contato?.nrTelefone ??
            dataRoot?.contato?.telefones ??
            dataRoot?.contato?.telefone ??
            null;
          const contatoPhoneList = Array.isArray(contatoPhones)
            ? contatoPhones
            : contatoPhones
              ? [contatoPhones]
              : [];
          const fallbackPhoneDigits =
            contatoPhoneList.reduce<string>((acc, item) => {
              if (acc) return acc;
              if (typeof item === "string" || typeof item === "number") {
                const digits = toDigits(item);
                return digits.length >= 10 ? digits : "";
              }
              if (item && typeof item === "object") {
                const record = item as Record<string, unknown>;
                const digits = combinePhoneDigits(
                  record.nr_ddd ?? record.ddd,
                  record.nr_ddi ?? record.ddi,
                  record.nr_nr_telefone ??
                    record.nr_telefone ??
                    record.numero ??
                    record.telefone ??
                    record.phone ??
                    record.cellphone ??
                    record.celular,
                );
                return digits.length >= 10 ? digits : "";
              }
              return "";
            }, "") ||
            combinePhoneDigits(
              null,
              null,
              payload?.user?.cellphone ??
                payload?.user?.phone ??
                payload?.user?.telefone ??
                payload?.user?.celular,
            );

          const formattedName = pickFirstText(
            cadastral?.nm_completo,
            cadastral?.nome,
            dataRoot?.nome?.conteudo?.nome,
            dataRoot?.nome?.nome,
            dataRoot?.nome,
          );
          const motherName = pickFirstText(
            cadastral?.nm_mae,
            dataRoot?.nome?.conteudo?.mae,
            dataRoot?.nome?.mae,
            dataRoot?.mae,
          );
          const birthDateRaw = pickFirstText(
            cadastral?.dt_nasc,
            dataRoot?.nome?.conteudo?.data_nascimento,
            dataRoot?.nome?.data_nascimento,
            dataRoot?.data_nascimento,
          );

          const nextPersonal: Partial<SimulatorFormData["personal"]> = {
            name: formatName(formattedName || ""),
            motherName: formatName(motherName || ""),
            birthday: normalizeBirthDate(birthDateRaw || ""),
          };

          if (contactEmail.email) {
            nextPersonal.email = contactEmail.email;
          }
          const resolvedPhoneDigits = contactPhone.phoneDigits || fallbackPhoneDigits;
          if (resolvedPhoneDigits) {
            nextPersonal.phone = maskPhone(resolvedPhoneDigits);
          }

          updateFormData("personal", {
            ...nextPersonal,
          });

          setCpfStatus(cpfStatusText || null);
          setCpfLookupCompleted(true);
          setCpfPhoneDigits(normalizePhoneDigits(resolvedPhoneDigits));

          const emailFlag = contactEmail.verified ?? (contactEmail.email ? true : null);
          const phoneFlag =
            contactPhone.verified ?? (resolvedPhoneDigits ? true : null);

          setEmailVerified(emailFlag);
          setPhoneVerified(phoneFlag);
          toast.success("Dados carregados com sucesso!");
        } else {
          setCpfStatus(null);
          setCpfLookupCompleted(false);
          setCpfPhoneDigits("");
          setEmailVerified(null);
          setPhoneVerified(null);
        }
      } else {
        setCnpjLookupCompleted(false);
        const res = await fetch("/api/searchCNPJ", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cnpj: digits }),
        });
        const response = await res.json();
        if (response?.success) {
          const payload = (response?.data ?? {}) as Record<string, any>;
          const cnpjData =
            payload?.data?.cnpj ??
            payload?.cnpj ??
            payload?.response?.content?.cnpj ??
            payload?.response?.content ??
            payload?.data?.response?.content?.cnpj ??
            payload?.data?.response?.content ??
            payload;
          const empresa = cnpjData?.empresa ?? null;
          const estabelecimento = cnpjData?.estabelecimento ?? null;
          const contactSource = {
            ...cnpjData,
            empresa,
            estabelecimento,
            user: payload?.user,
            contato:
              cnpjData?.contato ??
              payload?.contato ??
              payload?.contact ??
              payload?.contatos ??
              payload?.dados_contato ??
              payload?.dadosContato,
          };
          const statusValue = pickFirstText(
            empresa?.situacao_cadastral,
            estabelecimento?.situacao_cadastral,
            cnpjData?.situacao_cadastral,
            cnpjData?.situacao,
            cnpjData?.status,
          );
          const razaoSocial = pickFirstText(
            empresa?.razao_social,
            cnpjData?.razao_social,
            empresa?.nome_empresarial,
            cnpjData?.nome_empresarial,
            empresa?.nome_fantasia,
            cnpjData?.nome_fantasia,
          );

          const emailValue = pickFirstText(
            estabelecimento?.email,
            cnpjData?.email,
            empresa?.email,
            empresa?.email_contato,
            empresa?.emailContato,
          );

          const phoneCandidates = [
            combinePhoneDigits(estabelecimento?.ddd1, estabelecimento?.ddi1, estabelecimento?.telefone1),
            combinePhoneDigits(estabelecimento?.ddd2, estabelecimento?.ddi2, estabelecimento?.telefone2),
            combinePhoneDigits(estabelecimento?.ddd3, estabelecimento?.ddi3, estabelecimento?.telefone3),
            combinePhoneDigits(estabelecimento?.ddd, estabelecimento?.ddi, estabelecimento?.telefone),
            combinePhoneDigits(cnpjData?.ddd, cnpjData?.ddi, cnpjData?.telefone),
            toDigits(cnpjData?.telefone1),
            toDigits(cnpjData?.telefone2),
          ];
          const phoneDigits =
            phoneCandidates.find((candidate) => candidate.length >= 10) ?? "";

          const contactEmail = extractEmailInfo({
            ...contactSource,
            email: emailValue,
          });
          const contactPhone = extractPhoneInfo({
            ...contactSource,
            telefone: phoneDigits,
          });
          const contatoPhones =
            contactSource?.contato?.nr_telefone ??
            contactSource?.contato?.nrTelefone ??
            contactSource?.contato?.telefones ??
            contactSource?.contato?.telefone ??
            null;
          const contatoPhoneList = Array.isArray(contatoPhones)
            ? contatoPhones
            : contatoPhones
              ? [contatoPhones]
              : [];
          const fallbackPhoneDigits =
            contatoPhoneList.reduce<string>((acc, item) => {
              if (acc) return acc;
              if (typeof item === "string" || typeof item === "number") {
                const digits = toDigits(item);
                return digits.length >= 10 ? digits : "";
              }
              if (item && typeof item === "object") {
                const record = item as Record<string, unknown>;
                const digits = combinePhoneDigits(
                  record.nr_ddd ?? record.ddd,
                  record.nr_ddi ?? record.ddi,
                  record.nr_nr_telefone ??
                    record.nr_telefone ??
                    record.numero ??
                    record.telefone ??
                    record.phone ??
                    record.cellphone ??
                    record.celular,
                );
                return digits.length >= 10 ? digits : "";
              }
              return "";
            }, "") ||
            combinePhoneDigits(
              null,
              null,
              payload?.user?.cellphone ??
                payload?.user?.phone ??
                payload?.user?.telefone ??
                payload?.user?.celular,
            );

          const resolvedEmail =
            contactEmail.email || emailValue || payload?.user?.email || "";
          const resolvedPhoneDigits =
            contactPhone.phoneDigits || phoneDigits || fallbackPhoneDigits;

          updateFormData("personal", {
            name: formatName(razaoSocial || ""),
            companyName: formatName(razaoSocial || ""),
            shareholderName: formatName(cnpjData?.socios?.[0]?.nome_socio || ""),
            email: resolvedEmail || formData.personal.email,
            phone: resolvedPhoneDigits ? maskPhone(resolvedPhoneDigits) : formData.personal.phone,
          });
          setCnpjStatus(statusValue || null);
          setCnpjLookupCompleted(true);
          setEmailVerified(contactEmail.verified ?? (resolvedEmail ? true : null));
          setPhoneVerified(contactPhone.verified ?? (resolvedPhoneDigits ? true : null));
          toast.success("Dados da empresa carregados!");
        } else {
          setCnpjStatus(null);
          setCnpjLookupCompleted(false);
          setEmailVerified(null);
          setPhoneVerified(null);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      setCpfStatus(null);
      setCpfLookupCompleted(false);
      setCpfPhoneDigits("");
      setCnpjStatus(null);
      setCnpjLookupCompleted(false);
      setEmailVerified(null);
      setPhoneVerified(null);
    } finally {
      setSearchingDoc(false);
    }
  };

  const handleCepChange = async (value: string) => {
    const masked = maskCEP(value);
    updateFormData("address", { cep: masked });

    const digits = digitsOnly(masked);
    if (digits.length !== 8) return;

    try {
      setSearchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data?.erro) {
        updateFormData("address", {
          address: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          uf: data.uf || "",
        });
        toast.success("Endereco encontrado!");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setSearchingCep(false);
    }
  };

  const validateStep = () => {
    const { personal, address } = formData;

    if (!personal.cpfCnpj) {
      toast.error("CPF/CNPJ e obrigatorio");
      return false;
    }

    if (formData.personType === "PF" && digitsOnly(personal.cpfCnpj).length !== 11) {
      toast.error("CPF invalido");
      return false;
    }

    if (formData.personType === "PJ" && digitsOnly(personal.cpfCnpj).length !== 14) {
      toast.error("CNPJ invalido");
      return false;
    }

    if (formData.personType === "PF" && !personal.name) {
      toast.error("Nome e obrigatorio");
      return false;
    }

    if (formData.personType === "PF") {
      if (!personal.email || !validateEmail(personal.email)) {
        toast.error("Email invalido");
        return false;
      }

      const digits = digitsOnly(personal.phone);
      if (!personal.phone || digits.length < 10) {
        toast.error("Telefone invalido");
        return false;
      }

      if (!isValidBrazilPhone(digits)) {
        toast.error("Fraude ou informacao ilegal.");
        return false;
      }

      if (cpfPhoneDigits) {
        const normalizedInput = normalizePhoneDigits(personal.phone);
        const normalizedCpfPhone = normalizePhoneDigits(cpfPhoneDigits);
        if (normalizedInput !== normalizedCpfPhone) {
          toast.error("Telefone nao corresponde ao CPF informado.");
          return false;
        }
      }
    }

    if (!address.cep || !address.address || !address.city) {
      toast.error("Por favor, preencha o endereco completo");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#134B73]" />
            <span className="text-lg font-semibold text-[#134B73]">Dados Pessoais</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div
            className={`grid grid-cols-1 ${isPf ? "md:grid-cols-3" : "md:grid-cols-1"} gap-4`}
          >
            <div className="space-y-2">
              <Typography.Text>{formData.personType === "PF" ? "CPF" : "CNPJ"}</Typography.Text>
              <div className="relative">
                <Input
                  value={formData.personal.cpfCnpj}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder={formData.personType === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={formData.personType === "PF" ? 14 : 18}
                  className={blueInputClass}
                />
                {searchingDoc && (
                  <Spin size="small" className="absolute right-3 top-3 text-[#134B73]" />
                )}
              </div>
            </div>

            {formData.personType === "PF" && (
              <div className="space-y-2 md:col-span-2">
                <Typography.Text>Nome Completo</Typography.Text>
                <Input
                  value={formData.personal.name}
                  onChange={(e) => updateFormData("personal", { name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
            )}

            {docLookupCompleted && (
              <div className={`space-y-2 ${isPf ? "md:col-span-3" : ""}`}>
                <Typography.Text>Status na Receita</Typography.Text>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={docStatusTone} className="shadow-none">
                    {docStatusLabel}
                  </StatusBadge>
                  {isPf && (
                    <>
                      <StatusBadge status={emailVerificationTone} className="shadow-none">
                        {emailVerificationLabel}
                      </StatusBadge>
                      <StatusBadge status={phoneVerificationTone} className="shadow-none">
                        {phoneVerificationLabel}
                      </StatusBadge>
                    </>
                  )}
                </div>
              </div>
            )}

            {formData.personType === "PF" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Typography.Text>E-mail</Typography.Text>
                  <Input
                    type="email"
                    value={formData.personal.email}
                    onChange={(e) => updateFormData("personal", { email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className={blueInputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Typography.Text>Telefone</Typography.Text>
                  <Input
                    value={formData.personal.phone}
                    onChange={(e) => {
                      const masked = maskPhone(e.target.value);
                      updateFormData("personal", { phone: masked });
                      const digits = digitsOnly(masked);
                      if (!digits.length) {
                        setPhoneVerified(null);
                        return;
                      }
                      if (digits.length < 10) {
                        setPhoneVerified(false);
                        return;
                      }
                      if (!isValidBrazilPhone(digits)) {
                        setPhoneVerified(false);
                        return;
                      }
                      if (!cpfPhoneDigits) {
                        setPhoneVerified(true);
                        return;
                      }
                      const normalizedInput = normalizePhoneDigits(digits);
                      const normalizedCpfPhone = normalizePhoneDigits(cpfPhoneDigits);
                      setPhoneVerified(
                        Boolean(
                          normalizedCpfPhone &&
                            normalizedInput &&
                            normalizedInput === normalizedCpfPhone,
                        ),
                      );
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={blueInputClass}
                  />
                  {phoneFraudAlert && (
                    <p className="text-sm font-medium text-red-600">
                      Fraude ou informacao ilegal.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {formData.personType === "PF" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Typography.Text>Nome da Mae</Typography.Text>
                <Input
                  value={formData.personal.motherName}
                  onChange={(e) => updateFormData("personal", { motherName: e.target.value })}
                  placeholder="Nome da mae"
                />
              </div>

              <div className="space-y-2">
                <Typography.Text>Data de Nascimento</Typography.Text>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={
                    formData.personal.birthday
                      ? dayjs(formData.personal.birthday, "YYYY-MM-DD")
                      : null
                  }
                  onChange={(date) => {
                    updateFormData("personal", {
                      birthday: date ? date.format("YYYY-MM-DD") : "",
                    });
                  }}
                  onKeyDown={(e) => {
                    const target = e.target as HTMLInputElement;
                    const controlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                    if (controlKeys.includes(e.key)) return;

                    if (e.key >= "0" && e.key <= "9") {
                      setTimeout(() => {
                        target.value = maskDate(target.value);
                      }, 0);
                    } else if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                  onBlur={(event) => {
                    const val = event.target.value;
                    if (!val) return;
                    const parsed = dayjs(val, ["DD/MM/YYYY", "YYYY-MM-DD", "DDMMYYYY"], true);
                    if (parsed.isValid()) {
                      updateFormData("personal", { birthday: parsed.format("YYYY-MM-DD") });
                    }
                  }}
                  placeholder="dd/mm/aaaa"
                  className={`w-full ${blueInputClass}`}
                  inputReadOnly={false}
                />
              </div>

              <div className="space-y-2">
                <Typography.Text>Estado Civil</Typography.Text>
                <Select
                  value={formData.personal.maritalStatus || undefined}
                  onChange={(value) => updateFormData("personal", { maritalStatus: value })}
                  placeholder="Selecione"
                  options={[
                    { value: "Solteiro", label: "Solteiro(a)" },
                    { value: "Casado", label: "Casado(a)" },
                    { value: "Divorciado", label: "Divorciado(a)" },
                    { value: "Viuvo", label: "Viuvo(a)" },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 border border-[#134B73] rounded-lg">
                <Switch
                  checked={formData.personal.hasCnh}
                  onChange={(checked) => updateFormData("personal", { hasCnh: checked })}
                />
                <Typography.Text>Possui CNH?</Typography.Text>
              </div>

              {formData.personal.hasCnh && (
                <div className="space-y-2">
                  <Typography.Text>Categoria CNH</Typography.Text>
                <Select
                  value={formData.personal.cnhCategory || undefined}
                  onChange={(value) => updateFormData("personal", { cnhCategory: value })}
                  placeholder="Categoria"
                  options={[
                    { value: "A", label: "A" },
                    { value: "B", label: "B" },
                    { value: "AB", label: "AB" },
                    { value: "C", label: "C" },
                    { value: "D", label: "D" },
                    { value: "E", label: "E" },
                  ]}
                  className="w-full"
                />
                </div>
              )}
            </div>
          )}

          {formData.personType === "PJ" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Typography.Text>Nome do Socio</Typography.Text>
                <Input
                  value={formData.personal.shareholderName}
                  onChange={(e) =>
                    updateFormData("personal", { shareholderName: e.target.value })
                  }
                  placeholder="Nome do socio principal"
                />
              </div>
              <div className="space-y-2">
                <Typography.Text>Nome Fantasia</Typography.Text>
                <Input
                  value={formData.personal.companyName}
                  onChange={(e) =>
                    updateFormData("personal", { companyName: e.target.value })
                  }
                  placeholder="Nome fantasia da empresa"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title={<span className="text-lg font-semibold text-[#134B73]">Endereco</span>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Typography.Text>CEP</Typography.Text>
              <div className="relative">
                <Input
                  value={formData.address.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={blueInputClass}
                />
                {searchingCep && (
                  <Spin size="small" className="absolute right-3 top-3 text-[#134B73]" />
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Typography.Text>Endereco</Typography.Text>
              <Input
                value={formData.address.address}
                onChange={(e) => updateFormData("address", { address: e.target.value })}
                placeholder="Rua, Av, etc"
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Numero</Typography.Text>
              <Input
                value={formData.address.number}
                onChange={(e) => updateFormData("address", { number: e.target.value })}
                placeholder="Numero"
                className={blueInputClass}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Typography.Text>Complemento</Typography.Text>
              <Input
                value={formData.address.complement}
                onChange={(e) => updateFormData("address", { complement: e.target.value })}
                placeholder="Apto, sala, etc"
                className={blueInputClass}
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Bairro</Typography.Text>
              <Input
                value={formData.address.neighborhood}
                onChange={(e) => updateFormData("address", { neighborhood: e.target.value })}
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Cidade</Typography.Text>
              <Input
                value={formData.address.city}
                onChange={(e) => updateFormData("address", { city: e.target.value })}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>UF</Typography.Text>
              <Select
                value={formData.address.uf || undefined}
                onChange={(value) => updateFormData("address", { uf: value })}
                placeholder="UF"
                options={[
                  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
                  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
                  "SP","SE","TO",
                ].map((uf) => ({ value: uf, label: uf }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between mt-5">
        <Button onClick={prevStep} type="default" size="large">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="mt-5" type="primary" size="large">
          Proximo: Dados Profissionais
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
