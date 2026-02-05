import { Card, Empty, Progress, Typography } from "antd";
import { ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { ProposalsDashboardSummary } from "./QueueStats";

const { Text } = Typography;

const statusColors: Record<ProposalStatus, string> = {
  SUBMITTED: "#0ea5e9",
  PENDING: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  PAID: "#14b8a6",
};

type StatusLegendProps = {
  summary: ProposalsDashboardSummary;
};

export function StatusLegend({ summary }: StatusLegendProps) {
  const items = summary.statusTotals;

  return (
    <Card
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-sm"
      data-oid="status-legend"
    >
      <Text className="mb-4 block text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
        Radar de status
      </Text>
      <div className="space-y-4 text-sm">
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma ficha recebida no momento."
          />
        ) : (
          items.map((item) => {
            const percentage =
              summary.overallTotal > 0
                ? Math.round((item.value / summary.overallTotal) * 100)
                : 0;
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-600">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusColors[item.key] }}
                    />
                    {item.label}
                  </span>
                  <span>
                    {item.value} / {percentage}%
                  </span>
                </div>
                <Progress
                  percent={percentage}
                  showInfo={false}
                  strokeColor={statusColors[item.key]}
                  railColor="#e5e7eb"
                  size="small"
                />
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
