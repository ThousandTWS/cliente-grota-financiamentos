"use client";

import { Result, Typography } from "antd";

const { Paragraph } = Typography;

export function AccessDeniedState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Result
        status="403"
        title="Acesso negado"
        subTitle="Seu perfil não possui permissão para acessar esta área."
        extra={
          <Paragraph type="secondary" className="!mb-0">
            A regra considera perfil, permissões finas e escopo do recurso.
          </Paragraph>
        }
      />
    </div>
  );
}
