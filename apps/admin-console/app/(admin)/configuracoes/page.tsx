"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
  UserCircle2,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/presentation/layout/components/ui/badge";
import { Button } from "@/presentation/layout/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/layout/components/ui/card";
import { Input } from "@/presentation/layout/components/ui/input";
import { Label } from "@/presentation/layout/components/ui/label";
import { Separator } from "@/presentation/layout/components/ui/separator";
import { Skeleton } from "@/presentation/layout/components/ui/skeleton";

type AdminProfile = {
  fullName: string;
  email: string;
  status?: string;
  role?: string;
  createdAt?: string;
};

const defaultProfile: AdminProfile = {
  fullName: "",
  email: "",
};

export default function ConfiguracoesAdminPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState<AdminProfile>(defaultProfile);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const statusTone = useMemo(() => {
    const status = (profile.status ?? "").toUpperCase();
    if (status === "ATIVO" || status === "ACTIVE") {
      return "bg-[#0f3c5a] text-white border border-white/20 shadow-sm";
    }
    if (status === "PENDENTE") {
      return "bg-amber-500 text-white border border-amber-200/80 shadow-sm";
    }
    return "bg-slate-600 text-white border border-slate-300/70 shadow-sm";
  }, [profile.status]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Falha ao carregar perfil.");
        }

        setProfile({
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          status: data.status ?? "",
          role: data.role ?? "",
          createdAt: data.createdAt ?? "",
        });
      } catch (error) {
        console.error("[admin][config] loadProfile", error);
        toast.error(
          error instanceof Error ? error.message : "Erro ao carregar perfil.",
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const validateProfile = () => {
    if (!profile.fullName.trim()) {
      toast.error("Informe o nome completo.");
      return false;
    }
    if (!profile.email.trim()) {
      toast.error("Informe um e-mail válido.");
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar o perfil.");
      }
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("[admin][config] saveProfile", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar perfil.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível alterar a senha.");
      }
      toast.success("Senha alterada com sucesso!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("[admin][config] changePassword", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar senha.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const renderProfileSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="md:col-span-2">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#134B73] via-[#0f3c5a] to-[#0a2c45] text-white shadow-theme-lg border border-white/10 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center overflow-hidden shadow-theme-lg">
              <UserCircle2 className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                Painel Admin Grota
              </p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Configurações da conta
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <Badge className={statusTone}>
                  {profile.status ? profile.status : "Status não informado"}
                </Badge>
                <span className="flex items-center gap-2 text-white/80">
                  <ShieldCheck size={16} /> Ambiente seguro
                </span>
                <span className="flex items-center gap-2 text-white/80">
                  <BadgeCheck size={16} /> Desde {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-white/10 border border-white/20 p-4 min-w-[260px]">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Perfil</span>
              <span className="font-semibold flex items-center gap-1">
                <UserCog size={16} /> {profile.role || "--"}
              </span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>E-mail</span>
              <span className="font-semibold flex items-center gap-1">
                <Mail size={16} /> {profile.email || "--"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2">
        <Card className="lg:col-span-2 border border-slate-200/70 shadow-theme-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[#134B73]">
              <Building2 size={20} /> Dados do administrador
            </CardTitle>
            <CardDescription>
              Atualize suas informações de acesso e contato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingProfile ? (
              renderProfileSkeleton()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#134B73]">Nome completo</Label>
                  <Input
                    placeholder="Seu nome"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#134B73]">E-mail</Label>
                  <Input
                    placeholder="seuemail@empresa.com"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#134B73]">Perfil</Label>
                  <Input disabled value={profile.role ?? "ADMIN"} className="bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#134B73]">Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={statusTone}>
                      {profile.status ? profile.status : "Status não informado"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 ">
              <Button
                className="sm:w-auto w-full bg-[#134B73] hover:bg-[#0f3c5a]"
                onClick={handleSaveProfile}
                disabled={savingProfile || loadingProfile}
              >
                {savingProfile ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check size={16} /> Salvar alterações
                  </span>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Nome e e-mail são usados nas notificações e acessos ao painel.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 shadow-theme-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[#134B73]">
              <ShieldCheck size={20} /> Segurança e senha
            </CardTitle>
            <CardDescription>
              Atualize a senha de acesso ao painel admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Senha atual</Label>
              <Input
                placeholder="••••••••"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input
                placeholder="Mínimo 6 caracteres"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input
                placeholder="Repita a nova senha"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
            <Button
              className="w-full bg-[#134B73] hover:bg-[#0f3c5a]"
              onClick={handlePasswordChange}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Alterando...
                </span>
              ) : (
                "Alterar senha"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 mb-4">
        <Card className="border border-slate-200/70 shadow-theme-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[#134B73]">
              <UserCog size={20} /> Boas práticas de acesso
            </CardTitle>
            <CardDescription>
              Dicas rápidas para manter o painel admin seguro e consistente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Check className="text-emerald-600 mt-0.5" size={16} />
              <p>Use e-mail corporativo e mantenha-o atualizado para notificações críticas.</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="text-emerald-600 mt-0.5" size={16} />
              <p>Troque a senha regularmente e evite reutilizar senhas antigas.</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="text-emerald-600 mt-0.5" size={16} />
              <p>Habilite 2FA assim que estiver disponível e nunca compartilhe credenciais.</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="text-emerald-600 mt-0.5" size={16} />
              <p>Revise permissões periodicamente e revogue acessos obsoletos.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/70 shadow-theme-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[#134B73]">
              <Building2 size={20} /> Registro de conta
            </CardTitle>
            <CardDescription>
              Dados de criação e status da sua conta no painel admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Perfil</span>
              <span className="font-semibold text-[#134B73]">
                {profile.role || "ADMIN"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge className={statusTone}>
                {profile.status ? profile.status : "Status não informado"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Criado em</span>
              <span className="font-semibold text-[#134B73]">
                {formatDate(profile.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
