import { Card, Progress, Skeleton, Typography } from "antd";
import { ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { StatusBadge } from "./status-badge";

const { Text } = Typography;

const statusColors: Record<ProposalStatus, string> = {
  SUBMITTED: "#0EA5E9",
  PENDING: "#F59E0B",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
  PAID: "#14B8A6",
  CONTRACT_ISSUED: "#8B5CF6",
};

export type ProposalsDashboardSummary = {
  overallTotal: number;
  myTickets: {
    label: string;
    value: number;
    total?: number;
    color?: string;
    status?: ProposalStatus;
  }[];
  statusTotals: {
    key: ProposalStatus;
    label: string;
    value: number;
    total?: number;
    color?: string;
  }[];
};

type QueueStatsProps = {
  summary: ProposalsDashboardSummary;
  isLoading?: boolean;
};

export function QueueStats({ summary, isLoading }: QueueStatsProps) {
  const tickets = summary.myTickets;
  const total = summary.overallTotal;

  if (isLoading && total === 0) {
    return (
      <Card className="h-full" data-oid="queue-stats">
        <Skeleton active title paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden" data-oid="queue-stats" styles={{ body: { padding: 0 } }}>
      <div className="dealer-hero-card px-5 py-6 text-white">
        <Text className="text-xs font-semibold uppercase tracking-[0.4em] !text-white/80">
          Fluxo do lojista
        </Text>
        <p className="text-4xl font-semibold text-white">{total}</p>
        <Text className="text-sm !text-white/80">Ficha(s) na sua esteira</Text>
      </div>
      <div className="space-y-3 border-t border-slate-200/60 p-4">
        {tickets.map((ticket) => {
          const percent = total ? Math.round((ticket.value / total) * 100) : 0;
          const strokeColor = ticket.status ? statusColors[ticket.status] : "var(--dealer-accent)";
          return (
            <div key={ticket.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <StatusBadge status={ticket.status ?? ticket.label} className="px-3 py-1 text-xs">
                  {ticket.label}
                </StatusBadge>
                <span className="text-sm font-semibold text-slate-700">
                  {ticket.value} / {ticket.total ?? total}
                </span>
              </div>
              <Progress
                percent={percent}
                showInfo={false}
                strokeColor={strokeColor}
                railColor="#e5e7eb"
                size="small"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
