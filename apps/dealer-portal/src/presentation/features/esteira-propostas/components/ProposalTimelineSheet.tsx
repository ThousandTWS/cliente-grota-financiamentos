"use client";

import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { Button } from "antd";

type ProposalTimelineSheetProps = {
  proposalId: number;
};

export function ProposalTimelineSheet({ proposalId }: ProposalTimelineSheetProps) {
  const router = useRouter();

  return (
    <Button
      className="w-full justify-center"
      icon={<History className="size-4" />}
      onClick={() => router.push(`/esteira-propostas/${proposalId}/historico`)}
    >
      Historico
    </Button>
  );
}
