"use client";

import { Result, Typography } from "antd";

const { Paragraph } = Typography;

type AccessDeniedStateProps = {
  reason?: string;
  role?: string | null;
};

export function AccessDeniedState({
  reason,
  role,
}: AccessDeniedStateProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Result
        status="403"
        title="Acesso negado"
        subTitle="Seu perfil não possui permissão para acessar esta área."
        extra={
          <div className="space-y-2 text-center">
            <Paragraph type="secondary" className="!mb-0">
              A regra considera perfil, permissões finas e escopo do recurso.
            </Paragraph>
            {role ? (
              <Paragraph type="secondary" className="!mb-0">
                Perfil identificado: <strong>{role}</strong>
              </Paragraph>
            ) : null}
            {reason ? (
              <Paragraph type="secondary" className="!mb-0">
                Motivo: {reason}
              </Paragraph>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
