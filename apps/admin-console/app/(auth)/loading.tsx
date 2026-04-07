import React from "react";
import { Skeleton } from "antd";

/**
 * Next.js 15+ Loading UI Convention
 * Este componente será exibido automaticamente enquanto rotas de autenticação carregam.
 */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton.Avatar active size={64} shape="circle" />
          <Skeleton.Input active size="large" style={{ width: 200 }} />
          <Skeleton active paragraph={{ rows: 2 }} className="mt-4" />
        </div>
        
        <div className="space-y-4 pt-6">
          <Skeleton.Input active size="large" block />
          <Skeleton.Input active size="large" block />
          <Skeleton.Button active size="large" block shape="round" className="mt-4" />
        </div>
      </div>
    </div>
  );
}
