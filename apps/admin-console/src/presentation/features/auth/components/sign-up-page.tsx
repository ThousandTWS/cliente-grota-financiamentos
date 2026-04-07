"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, } from "lucide-react"
import { SignUpPageProps } from "@/application/core/@types/auth/Props/SignUpPageProps"
import z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/application/services/auth/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { GlassInputWrapper } from "@/presentation/layout/components/glass-input-wrapper"

const registerSchema = z
  .object({
    fullName: z.string().min(2, "O nome completo é obrigatório"),
    email: z.email("Formato de e-mail inválido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .max(50, "A senha deve ter no máximo 50 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export default function SignUpPage({ heroImageSrc }: SignUpPageProps) {
  const { signUp, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const onSubmit = async (data: RegisterFormData) => {
    const result = await signUp(data);

    if (result.success) {
      toast.success("Conta criada com sucesso! Você será redirecionado.");
      reset();
      setTimeout(() => {
        router.push(`/verificacao-token?tipo=verificacao&email=${data.email}`)
      }, 1500);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] bg-white">
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <p className="animate-element animate-delay-200 text-[#1B4B7C] text-2xl font-semibold">
              Crie sua conta
            </p>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="animate-element animate-delay-300">
                <label className="text-md font-medium text-[#1B4B7C]" htmlFor="fullName">Nome Completo</label>
                <GlassInputWrapper>
                  <input
                    id="fullName"
                    type="text"
                    {...register("fullName")}
                    placeholder="Digite seu nome completo"
                    className="w-full bg-transparent text-black text-sm p-4 rounded-2xl focus:outline-none"
                    disabled={isLoading}
                  />
                </GlassInputWrapper>

                {errors.fullName && (
                  <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-md font-medium text-[#1B4B7C]" htmlFor="email">E-mail</label>
                <GlassInputWrapper>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Digite seu e-mail"
                    className="w-full bg-transparent text-black text-sm p-4 rounded-2xl focus:outline-none"
                    disabled={isLoading}
                  />
                </GlassInputWrapper>

                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-md font-medium text-[#1B4B7C]" htmlFor="password">Senha</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      maxLength={8}
                      placeholder="Crie uma senha"
                      className="w-full bg-transparent text-black text-sm p-4 pr-12 rounded-2xl focus:outline-none"
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

              <div className="animate-element animate-delay-600">
                <label className="text-md font-medium text-[#1B4B7C]" htmlFor="confirmPassword">Confirmar Senha</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="Confirme sua senha"
                      className="w-full bg-transparent text-black text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-[#1B4B7C] hover:text-[#0F2C55] transition-colors duration-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#1B4B7C] hover:text-[#0F2C55] transition-colors duration-300" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>

                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
                {/* <div className="mt-5 text-center bg-zinc-400 h-14 py-5 px-5">
                  Google Recaptcha
                </div> */}
              </div>

              <div className="animate-element animate-delay-700 flex items-start gap-3 text-md">
                <input type="checkbox" name="terms" className="custom-checkbox mt-0.5" />
                <span className="text-[#1B4B7C]/90">
                  Eu concordo com os{" "}
                  <a href="#" className="text-[#1B4B7C] hover:underline">
                    Termos de Serviço
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-[#1B4B7C] hover:underline">
                    Política de Privacidade
                  </a>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isDirty || !isValid}
                className="animate-element animate-delay-800 w-full text-md rounded-2xl bg-[#1B4B7C] py-4 font-medium text-white hover:bg-[#0F2C55] transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </button>
            </form>

            <p className="animate-element animate-delay-1100 text-center text-md text-[#1B4B7C]/80">
              Já possui uma conta?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  router.push("/")
                }}
                className="text-[#1B4B7C] hover:underline transition-colors"
              >
                Entrar
              </a>
            </p>
          </div>
        </div>
      </section>

      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
        </section>
      )}
    </div>
  )
}