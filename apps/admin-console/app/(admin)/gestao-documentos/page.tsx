"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  REALTIME_CHANNELS,
  REALTIME_EVENT_TYPES,
  dispatchBridgeEvent,
  parseBridgeEvent,
  useRealtimeChannel,
} from "@/lib/realtime-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DocumentRecord,
  DocumentType,
  ReviewStatus,
} from "@/application/core/@types/Documents/Document";
import {
  fetchDocuments,
  getDocumentDownloadUrl,
  reviewDocument,
} from "@/application/services/Documents/documentService";
import { DocumentFilters } from "@/presentation/features/gestao-documentos/components/DocumentFilters";
import { DocumentStats } from "@/presentation/features/gestao-documentos/components/DocumentStats";
import { DocumentsTable } from "@/presentation/features/gestao-documentos/components/DocumentsTable";
import { DOCUMENT_TYPE_LABELS } from "@/presentation/features/gestao-documentos/data/documentLabels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/layout/components/ui/dialog";
import { Button } from "@/presentation/layout/components/ui/button";
import { Textarea } from "@/presentation/layout/components/ui/textarea";
import { Badge } from "@/presentation/layout/components/ui/badge";
import { Label } from "@/presentation/layout/components/ui/label";
import { Loader2, Radio } from "lucide-react";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_WS_URL;
const ADMIN_DOCUMENTS_IDENTITY = "admin-documentos";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{
    document: DocumentRecord;
    status: ReviewStatus;
  } | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const { messages, sendMessage, status: realtimeStatus } = useRealtimeChannel({
    channel: REALTIME_CHANNELS.DOCUMENTS,
    identity: ADMIN_DOCUMENTS_IDENTITY,
    url: REALTIME_URL,
    metadata: { displayName: "Painel admin" },
  });

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
      const data = await fetchDocuments();
      setDocuments(
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error("[admin][documents] Failed to fetch", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os documentos.",
      );
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
      case REALTIME_EVENT_TYPES.DOCUMENT_UPLOADED: {
        if (payload?.document) {
          applySnapshot(payload.document);
          toast.success("Novo documento enviado pelo lojista.");
        }
        break;
      }
      case REALTIME_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST: {
        loadDocuments({ silent: true });
        toast.message("Sincronizando fila de documentos...");
        break;
      }
      case REALTIME_EVENT_TYPES.DOCUMENT_REVIEW_UPDATED: {
        if (
          payload?.document &&
          payload.source !== ADMIN_DOCUMENTS_IDENTITY
        ) {
          applySnapshot(payload.document);
        }
        break;
      }
      default:
        break;
    }
  }, [applySnapshot, loadDocuments, messages]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesStatus =
        statusFilter === "ALL" || doc.reviewStatus === statusFilter;
      const matchesType =
        typeFilter === "ALL" || doc.documentType === typeFilter;
      const matchesSearch = searchQuery
        ? `${DOCUMENT_TYPE_LABELS[doc.documentType]} ${doc.reviewComment ?? ""}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [documents, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const pending = documents.filter(
      (doc) => doc.reviewStatus === "PENDENTE",
    ).length;
    const approved = documents.filter(
      (doc) => doc.reviewStatus === "APROVADO",
    ).length;
    const rejected = documents.filter(
      (doc) => doc.reviewStatus === "REPROVADO",
    ).length;

    return {
      total: documents.length,
      pending,
      approved,
      rejected,
    };
  }, [documents]);

  const handleDownload = async (document: DocumentRecord) => {
    try {
      const url = await getDocumentDownloadUrl(document.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("[admin][documents] download link failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o documento.",
      );
    }
  };

  const handleRequestReview = (document: DocumentRecord, status: ReviewStatus) => {
    setReviewTarget({ document, status });
    setReviewComment(document.reviewComment ?? "");
  };

  const handleReviewConfirm = async () => {
    if (!reviewTarget) return;
    if (reviewTarget.status === "REPROVADO" && !reviewComment.trim()) {
      toast.error("Informe o motivo da reprovação.");
      return;
    }

    setIsSavingReview(true);
    try {
      const updated = await reviewDocument(
        reviewTarget.document.id,
        reviewTarget.status,
        reviewComment.trim() || undefined,
      );
      applySnapshot(updated);
      dispatchBridgeEvent(
        sendMessage,
        REALTIME_EVENT_TYPES.DOCUMENT_REVIEW_UPDATED,
        {
          document: updated,
          source: ADMIN_DOCUMENTS_IDENTITY,
        },
      );
      toast.success(
        reviewTarget.status === "APROVADO"
          ? "Documento aprovado com sucesso."
          : "Documento marcado como reprovado.",
      );
      setReviewTarget(null);
      setReviewComment("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o documento.",
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleRefresh = () => {
    loadDocuments();
    dispatchBridgeEvent(
      sendMessage,
      REALTIME_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST,
      { source: ADMIN_DOCUMENTS_IDENTITY },
    );
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSearchQuery("");
  };

  const realtimeLabel = (() => {
    switch (realtimeStatus) {
      case "connected":
        return { text: "Online", tone: "text-emerald-700", bg: "bg-emerald-100" };
      case "connecting":
        return { text: "Reconectando", tone: "text-amber-700", bg: "bg-amber-100" };
      case "error":
        return { text: "Instável", tone: "text-rose-700", bg: "bg-rose-100" };
      default:
        return { text: "Offline", tone: "text-slate-700", bg: "bg-slate-200" };
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Painel Operacional
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Documentos
          </h1>
          <p className="text-muted-foreground">
            Acompanhe os envios dos lojistas e aprove em tempo real.
          </p>
        </div>
        <Badge
          className={cn(
            "px-4 py-2 text-sm",
            realtimeLabel.bg,
            realtimeLabel.tone,
          )}
        >
          <Radio className="mr-2 h-3.5 w-3.5" />
          {realtimeLabel.text}
        </Badge>
      </div>

      <DocumentStats
        total={stats.total}
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        lastSyncLabel={
          lastSyncedAt
            ? lastSyncedAt.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Sem sincronização"
        }
      />

      <DocumentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(value) => setStatusFilter(value)}
        typeFilter={typeFilter}
        onTypeChange={(value) => setTypeFilter(value)}
        onRefresh={handleRefresh}
        onReset={handleResetFilters}
      />

      <DocumentsTable
        documents={filteredDocuments}
        isLoading={isLoading}
        onDownload={handleDownload}
        onRequestReview={handleRequestReview}
        onForceRefresh={handleRefresh}
      />

      <Dialog
        open={!!reviewTarget}
        onOpenChange={(next) => {
          if (!next) {
            setReviewTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewTarget?.status === "APROVADO"
                ? "Confirmar aprovação"
                : "Reprovar documento"}
            </DialogTitle>
            <DialogDescription>
              {reviewTarget?.status === "APROVADO"
                ? "Confirme que este documento está em conformidade com as regras."
                : "Descreva o motivo da reprovação para que o lojista possa reenviar."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-semibold">
                {reviewTarget
                  ? DOCUMENT_TYPE_LABELS[reviewTarget.document.documentType]
                  : ""}
              </p>
              <p className="text-muted-foreground">
                ID #{reviewTarget?.document.id}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-comment">Parecer</Label>
              <Textarea
                id="document-comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Adicione observações para o lojista..."
                minLength={reviewTarget?.status === "REPROVADO" ? 5 : undefined}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleReviewConfirm}
              disabled={
                isSavingReview ||
                (reviewTarget?.status === "REPROVADO" &&
                  reviewComment.trim().length === 0)
              }
            >
              {isSavingReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : reviewTarget?.status === "APROVADO" ? (
                "Aprovar"
              ) : (
                "Reprovar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
