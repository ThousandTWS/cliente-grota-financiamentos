import Image from "next/image"
import { LoginBrandPanel } from "./_components/login-brand-panel"
import { LoginForm } from "./_components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Grota style dark navy) */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%]">
        <LoginBrandPanel />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo/grota-logo-horizontal-positive.png"
              alt="Grota Financiamentos"
              width={170}
              height={34}
              priority
              style={{ height: "auto" }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[400px]">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Acesse sua conta
              </h2>
              <p className="mt-2 text-muted-foreground text-[15px]">
                Entre com suas credenciais para acessar o painel do lojista
              </p>
            </div>

            {/* Form */}
            <LoginForm />

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                Ao continuar, você concorda com nossos{" "}
                <a href="#" className="text-[#1B6EA8] hover:text-[#134B73] font-medium">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="#" className="text-[#1B6EA8] hover:text-[#134B73] font-medium">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden lg:block px-14 xl:px-20 py-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            © 2026 Grota Financiamentos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
