"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Skeleton, Typography, message } from "antd";
import userServices, {
  type AuthenticatedUser,
} from "@/application/services/UserServices/UserServices";

const { Text } = Typography;

type PasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function GestorConfiguracoesPage() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [form] = Form.useForm<PasswordFormValues>();

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const profile = await userServices.me();
        if (mounted) {
          setUser(profile);
        }
      } catch (error) {
        console.error("[gestor][config] Falha ao carregar usuario", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePasswordChange = async (values: PasswordFormValues) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("As senhas nao conferem.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (payload as { error?: string })?.error ??
            "Nao foi possivel alterar a senha.",
        );
      }

      message.success("Senha atualizada.");
      form.resetFields();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Erro ao alterar senha.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Configuracoes</h1>
        <p className="text-sm text-slate-500">
          Gerencie os dados do gestor e sua senha de acesso.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-sm">
          <div className="space-y-3">
            <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Perfil
            </Text>
            {loadingUser ? (
              <Skeleton active title={false} paragraph={{ rows: 3 }} />
            ) : (
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Nome</span>
                  <span className="font-semibold text-slate-700">
                    {user?.fullName ?? "Nao informado"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <span className="font-semibold text-slate-700">
                    {user?.email ?? "Nao informado"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Perfil</span>
                  <span className="font-semibold text-slate-700">
                    {(user?.role ?? "GESTOR").toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="space-y-3">
            <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Alterar senha
            </Text>
            <Form
              layout="vertical"
              form={form}
              onFinish={handlePasswordChange}
            >
              <Form.Item
                label="Senha atual"
                name="oldPassword"
                rules={[{ required: true, message: "Informe a senha atual." }]}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Form.Item
                label="Nova senha"
                name="newPassword"
                rules={[{ required: true, message: "Informe a nova senha." }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                label="Confirmar nova senha"
                name="confirmPassword"
                rules={[{ required: true, message: "Confirme a nova senha." }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingPassword}>
                Atualizar senha
              </Button>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
}
