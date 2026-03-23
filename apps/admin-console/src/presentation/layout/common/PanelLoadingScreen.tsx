"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";

type PanelLoadingScreenProps = {
  title?: string;
  description?: string;
};

export function PanelLoadingScreen({
  title = "Carregando painel",
  description = "Aguarde enquanto validamos sua sessão e preparamos seus dados.",
}: PanelLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,44,85,0.12)]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#134B73]">
          <Image
            src="/images/logo/grota-symbol-positive.png"
            alt="Grota Financiamentos"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain brightness-0 invert"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[#134B73]">
            {title}
          </h1>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-sm font-medium text-[#134B73]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Sincronizando acesso</span>
        </div>
      </div>
    </div>
  );
}
