"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { SignInPageProps } from "@/application/core/@types/auth/Props/SignInPageProps"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from "@/application/services/auth/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/presentation/layout/components/ui/dialog"
import { Input } from "@/presentation/layout/components/ui/input"
import { Button } from "@/presentation/layout/components/ui/button"
import { GlassInputWrapper } from "@/presentation/layout/components/glass-input-wrapper"
import { PanelLoadingScreen } from "@/presentation/layout/common/PanelLoadingScreen"

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().length(8, "A senha precisa ter 8 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-[#1B4B7C] tracking-tighter text-4xl md:text-5xl">Bem-vindo</span>,
  description = "Acesse sua conta e continue sua jornada com a Grota Financiamentos",
  heroImageSrc,
}) => {
  const { signIn, isLoading, clearError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingPassword, setPendingPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isRedirecting) return;

    const timer = window.setTimeout(() => {
      window.location.assign("/visao-geral");
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isRedirecting]);

  const handleVerificationCodeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6)
    setVerificationCode(digitsOnly)
  }

  const onSubmit = async (data: LoginForm) => {
    clearError();

    if (!data.email || !data.password) {
      return;
    }

    setPendingEmail(data.email);
    setPendingPassword(data.password);

    try {
      const result = await signIn(data);

      if (result.success) {
        toast.success("Login realizado com sucesso!");
        setIsRedirecting(true);
        return;
      } else if (result.needsVerification) {
        setShowVerification(true);
        toast.message("Código de verificação necessário", {
          description: "Enviamos um código para o e-mail informado.",
        });
        return;
      }
    } catch (error) {
      const errorMessage = "Erro de conexão. Tente novamente.";
      toast.error(errorMessage)
      return { success: false, message: errorMessage };
    }
  };

  const handleVerify = async () => {
    if (!pendingEmail || !verificationCode.trim()) {
      toast.error("Informe o código de verificação.");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: verificationCode.trim() }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error ?? "Não foi possível verificar o código.";
        toast.error(message);
        return;
      }

      toast.success("Código verificado com sucesso! Entrando...");
      setShowVerification(false);
      setVerificationCode("");
      await onSubmit({ email: pendingEmail, password: pendingPassword });
    } catch (err) {
      toast.error("Erro ao verificar código. Tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      toast.error("Informe o e-mail para reenviar o código.");
      return;
    }
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error ?? "Não foi possível reenviar o código.";
        toast.error(message);
        return;
      }
      toast.success("Código reenviado para o e-mail informado.");
    } catch {
      toast.error("Erro ao reenviar código.");
    }
  };

  if (isRedirecting) {
    return (
      <PanelLoadingScreen
        title="Entrando no painel"
        description="Seu acesso foi confirmado. Estamos carregando a area inicial."
      />
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] bg-white">
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-[#1B4B7C]/80">{description}</p>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="animate-element animate-delay-300 space-y-2">
                <label className="text-md font-medium text-[#1B4B7C]" htmlFor="email">E-mail</label>
                <GlassInputWrapper>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Digite seu e-mail"
                    className="w-full bg-white text-[#1B4B7C] placeholder:text-[#1B4B7C]/50 text-sm p-4 rounded-2xl focus:outline-none"
                    disabled={isLoading}
                  />
                </GlassInputWrapper>
                
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-md font-medium text-[#1B4B7C]" htmlFor="password">Senha</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="Digite sua senha"
                      maxLength={8}
                      className="w-full bg-white text-[#1B4B7C] placeholder:text-[#1B4B7C]/50 text-sm p-4 rounded-2xl focus:outline-none"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-[#1B4B7C] hover:text-[#0F2C55] transition-colors duration-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#1B4B7C] hover:text-[#0F2C55] transition-colors duration-300" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>

                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-end text-sm">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push("/esqueci-senha")
                  }}
                  className="hover:underline text-[#1B4B7C] transition-colors"
                >
                  Esqueci a senha
                </a>
            </div>

              <button
                type="submit"
                disabled={isLoading || !isDirty}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-[#1B4B7C] py-4 font-medium text-white hover:bg-[#0F2C55] transition-colors flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <p className="animate-element animate-delay-900 text-center text-sm text-[#1B4B7C]/80">
              Novo por aqui?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  router.push("/cadastro")
                }}
                className="text-[#1B4B7C] hover:underline transition-colors"
              >
                Criar Conta
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
        </section>
      )}

      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifique seu acesso</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Enviamos um código para o e-mail informado. Digite abaixo para liberar o login.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código de verificação</label>
              <Input
                value={verificationCode}
                onChange={(e) => handleVerificationCodeChange(e.target.value)}
                maxLength={6}
                placeholder="Digite o código (6 dígitos)"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{pendingEmail}</span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={handleResend}
              >
                Reenviar código
              </button>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVerification(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Validando...
                </>
              ) : (
                "Validar código"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
