"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  REALTIME_CHANNELS,
  REALTIME_EVENT_TYPES,
  dispatchBridgeEvent,
  parseBridgeEvent,
  useRealtimeChannel,
} from "@grota/realtime-client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  SignalHigh,
  UploadCloud,
  WifiOff,
} from "lucide-react";
import {
  DOCUMENT_TYPES,
  DocumentRecord,
  DocumentType,
  ReviewStatus,
} from "@/application/core/@types/Documents/Document";
import {
  fetchDocuments,
  getDocumentDownloadUrl,
  uploadDocument,
} from "@/application/services/Documents/documentService";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { Input } from "@/presentation/ui/input";
import { Label } from "@/presentation/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/ui/table";
import { Badge } from "@/presentation/ui/badge";
import { Progress } from "@/presentation/ui/progress";
import { cn } from "@/lib/utils";
import { getRealtimeUrl } from "@/application/config/realtime";
const LOGISTA_DOCUMENTS_IDENTITY = "logista-documentos";

const documentTypeConfig: Record<
  DocumentType,
  { label: string; description: string }
> = {
  RG_FRENTE: {
    label: "RG (frente)",
    description: "Imagem nítida do RG aberto na parte frontal.",
  },
  RG_VERSO: {
    label: "RG (verso)",
    description: "Use o mesmo enquadramento da frente para o verso.",
  },
  CPF: {
    label: "CPF",
    description: "Foto ou escaneamento do CPF do responsável.",
  },
  CNH: {
    label: "CNH",
    description: "Documento completo, com data de validade legível.",
  },
  EXTRATO_BANCARIO: {
    label: "Extrato bancário",
    description: "Último extrato em PDF ou imagem (até 10MB).",
  },
  HOLERITE: {
    label: "Holerite",
    description: "Comprovante de renda atualizado.",
  },
  CONTRATO_SOCIAL: {
    label: "Contrato social",
    description: "Documento completo com todas as assinaturas.",
  },
  ULTIMA_ALTERACAO_CONTRATUAL: {
    label: "Última alteração contratual",
    description: "Se houver, inclua a alteração mais recente.",
  },
  COMPROVANTE_DE_ENDERECO: {
    label: "Comprovante de endereço",
    description: "Conta em nome da empresa emitida nos últimos 90 dias.",
  },
  DADOS_BANCARIOS: {
    label: "Dados bancários",
    description: "Cartão ou comprovante contendo agência e conta.",
  },
};

const statusCopy: Record<
  ReviewStatus,
  { label: string; badgeClass: string; tone: string }
> = {
  PENDENTE: {
    label: "Em análise",
    badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
    tone: "text-amber-600 dark:text-amber-200",
  },
  APROVADO: {
    label: "Aprovado",
    badgeClass: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100",
    tone: "text-emerald-600 dark:text-emerald-200",
  },
  REPROVADO: {
    label: "Reprovado",
    badgeClass: "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100",
    tone: "text-rose-600 dark:text-rose-200",
  },
};

const realtimeStatusTokens = {
  connected: {
    label: "Conectado",
    Icon: SignalHigh,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  },
  connecting: {
    label: "Reconectando",
    Icon: SignalHigh,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  },
  error: {
    label: "Instável",
    Icon: WifiOff,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100",
  },
  disconnected: {
    label: "Offline",
    Icon: WifiOff,
    className: "bg-slate-200 text-slate-900 dark:bg-slate-700/60 dark:text-slate-200",
  },
  idle: {
    label: "Aguardando",
    Icon: SignalHigh,
    className: "bg-muted text-muted-foreground",
  },
} as const;

const statusFilterOptions: { value: ReviewStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "PENDENTE", label: "Em análise" },
  { value: "APROVADO", label: "Aprovadas" },
  { value: "REPROVADO", label: "Reprovadas" },
];

const presenceLabels: Record<string, string> = {
  admin: "Backoffice",
  [LOGISTA_DOCUMENTS_IDENTITY]: "Você",
};

const formatFileSize = (sizeBytes: number) => {
  if (!sizeBytes || Number.isNaN(sizeBytes)) return "0 B";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const describeRealtimeEvent = (
    event: string,
    payload: unknown,
  ) => {
    const typedPayload = (payload ?? null) as
      | { document?: DocumentRecord }
      | null;
    switch (event) {
      case REALTIME_EVENT_TYPES.DOCUMENT_UPLOADED:
        return `Novo documento: ${
          documentTypeConfig[
            typedPayload?.document?.documentType ?? "RG_FRENTE"
          ]?.label ?? "Documento"
        }`;
      case REALTIME_EVENT_TYPES.DOCUMENT_REVIEW_UPDATED:
        return `Status atualizado para ${
          statusCopy[typedPayload?.document?.reviewStatus ?? "PENDENTE"]
            ?.label ?? "Revisão"
        }`;
      case REALTIME_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST:
        return "Sincronização solicitada pelo backoffice";
      default:
        return event;
    }
  };

export function DocumentosFeature() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<DocumentType | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const { messages, sendMessage, status, participants } = useRealtimeChannel({
    channel: REALTIME_CHANNELS.DOCUMENTS,
    identity: LOGISTA_DOCUMENTS_IDENTITY,
    url: getRealtimeUrl(),
    metadata: { area: "logista-documents" },
  });

  const sortedParticipants = useMemo(() => {
    return participants
      .slice()
      .sort((a, b) => a.sender.localeCompare(b.sender, "pt-BR"));
  }, [participants]);

  const realtimeStatus =
    realtimeStatusTokens[status as keyof typeof realtimeStatusTokens] ??
    realtimeStatusTokens.idle;

  const applySnapshot = useCallback((record: DocumentRecord) => {
    if (!record?.id) return;
    setDocuments((current) => {
      const next = [...current];
      const index = next.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        next[index] = record;
      } else {
        next.unshift(record);
      }
      return next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });
  }, []);

  const loadDocuments = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const list = await fetchDocuments();
      const ordered = list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setDocuments(ordered);
    } catch (error) {
      console.error("[logista][documents] Falha ao carregar docs", error);
      toast.error("Não foi possível carregar seus documentos agora.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    const parsed = parseBridgeEvent(latest);
    if (!parsed) return;

    const payload =
      (parsed.payload as { document?: DocumentRecord; source?: string }) ??
      null;

    switch (parsed.event) {
      case REALTIME_EVENT_TYPES.DOCUMENT_UPLOADED:
        if (
          payload?.document &&
          payload.source !== LOGISTA_DOCUMENTS_IDENTITY
        ) {
          applySnapshot(payload.document);
          toast.success("Backoffice sinalizou um novo documento.");
        }
        break;
      case REALTIME_EVENT_TYPES.DOCUMENT_REVIEW_UPDATED:
        if (payload?.document) {
          applySnapshot(payload.document);
          toast.info("Status do documento atualizado pelo backoffice.");
        }
        break;
      case REALTIME_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST:
        loadDocuments({ silent: true });
        break;
      default:
        break;
    }
  }, [messages, applySnapshot, loadDocuments]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedType) {
      toast.error("Selecione um tipo de documento.");
      return;
    }
    if (!selectedFile) {
      toast.error("Escolha um arquivo antes de enviar.");
      return;
    }

    setIsUploading(true);
    try {
      const created = await uploadDocument({
        documentType: selectedType,
        file: selectedFile,
      });
      applySnapshot(created);
      setSelectedFile(null);
      toast.success("Documento enviado com sucesso!", {
        description: `${documentTypeConfig[selectedType].label} sincronizado com o backoffice.`,
      });
      dispatchBridgeEvent(sendMessage, REALTIME_EVENT_TYPES.DOCUMENT_UPLOADED, {
        document: created,
        source: LOGISTA_DOCUMENTS_IDENTITY,
      });
    } catch (error) {
      console.error("[logista][documents] Falha no upload", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o documento.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: number) => {
    try {
      const url = await getDocumentDownloadUrl(documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("[logista][documents] Falha ao gerar link", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir este documento.",
      );
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesStatus =
        statusFilter === "ALL" || doc.reviewStatus === statusFilter;
      const matchesSearch = searchTerm
        ? documentTypeConfig[doc.documentType]?.label
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          doc.reviewComment?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [documents, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const pending = documents.filter((doc) => doc.reviewStatus === "PENDENTE")
      .length;
    const approved = documents.filter((doc) => doc.reviewStatus === "APROVADO")
      .length;
    const rejected = documents.filter((doc) => doc.reviewStatus === "REPROVADO")
      .length;
    return {
      total: documents.length,
      pending,
      approved,
      rejected,
    };
  }, [documents]);

  const allowedRealtimeEvents = useMemo(
    () =>
      new Set<string>([
        REALTIME_EVENT_TYPES.DOCUMENT_UPLOADED,
        REALTIME_EVENT_TYPES.DOCUMENT_REVIEW_UPDATED,
        REALTIME_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST,
      ]),
    [],
  );

  const recentRealtimeEvents = useMemo(() => {
    return messages
      .map((message) => parseBridgeEvent(message))
      .filter(
        (
          event,
        ): event is NonNullable<ReturnType<typeof parseBridgeEvent>> =>
          !!event && allowedRealtimeEvents.has(event.event),
      )
      .slice(-6)
      .reverse();
  }, [allowedRealtimeEvents, messages]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Área do logista
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Upload de Documentos
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Centralize os documentos exigidos pelo backoffice e acompanhe a
          revisão em tempo real via WebSocket.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total enviados</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Documentos vinculados ao seu CNPJ
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em análise</CardDescription>
            <CardTitle className="text-3xl">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-200">
            <Loader2 className="size-4 animate-spin" />
            aguardando retorno do backoffice
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovados</CardDescription>
            <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-200">
              {stats.approved}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-200">
            <ShieldCheck className="size-4" />
            liberados para contratação
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendências</CardDescription>
            <CardTitle className="text-3xl text-rose-600 dark:text-rose-200">
              {stats.rejected}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-200">
            <AlertTriangle className="size-4" />
            ajustes solicitados
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Enviar um novo documento</CardTitle>
                <CardDescription>
                  Aceitamos arquivos JPEG, PNG ou PDF com até 10MB.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  dispatchBridgeEvent(
                    sendMessage,
                    REALTIME_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST,
                    { source: LOGISTA_DOCUMENTS_IDENTITY },
                  )
                }
              >
                <RefreshCcw className="mr-2 size-4" />
                Solicitar sincronização
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleUpload}
              className="space-y-4 rounded-2xl border border-dashed border-muted-foreground/30 p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    value={selectedType || ""}
                    onValueChange={(value: DocumentType) =>
                      setSelectedType(value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">
                              {documentTypeConfig[type].label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {documentTypeConfig[type].description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={(event) =>
                      setSelectedFile(
                        event.currentTarget.files?.[0] ?? null,
                      )
                    }
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.name} ·{" "}
                      {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Garantimos criptografia em trânsito e auditoria dos envios.
                </div>
                <Button
                  type="submit"
                  disabled={!selectedFile || !selectedType || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 size-4" />
                      Enviar documento
                    </>
                  )}
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  Estamos criptografando seu arquivo...
                  <Progress className="h-2" value={75} />
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Sync em tempo real</CardTitle>
                <CardDescription>
                  Conexão com o backoffice via WebSocket.
                </CardDescription>
              </div>
              <Badge className={cn("text-xs", realtimeStatus.className)}>
                <realtimeStatus.Icon className="mr-2 size-3.5" />
                {realtimeStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">
                Participantes conectados
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedParticipants.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum cliente conectado
                  </span>
                )}
                {sortedParticipants.map((participant) => (
                  <Badge
                    key={participant.clientId}
                    variant="secondary"
                    className="bg-muted text-foreground"
                  >
                    {presenceLabels[participant.sender] ?? participant.sender}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                Últimos eventos
              </div>
              <div className="space-y-2">
                {recentRealtimeEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma atualização recebida ainda.
                  </p>
                )}
                {recentRealtimeEvents.map((event) => (
                  <div
                    key={event?.message.id}
                    className="rounded-lg border border-border bg-muted/40 p-3 text-sm"
                  >
                    <p className="font-medium text-foreground">
                      {describeRealtimeEvent(event?.event ?? "", event?.payload ?? null)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event?.message.timestamp ?? Date.now()).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Documentos enviados</CardTitle>
              <CardDescription>
                Gerencie as pendências e visualize o parecer da análise.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDocuments()}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 size-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="document-search">Buscar</Label>
              <Input
                id="document-search"
                placeholder="Digite o tipo ou observação..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: ReviewStatus | "ALL") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Carregando documentos...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {documentTypeConfig[doc.documentType].label}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusCopy[doc.reviewStatus].badgeClass}>
                          {statusCopy[doc.reviewStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(doc.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(doc.updatedAt)}</TableCell>
                      <TableCell>{formatFileSize(doc.sizeBytes)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {doc.reviewComment || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download className="mr-2 size-4" />
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DocumentosFeature;
