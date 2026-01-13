import Image from "next/image"
import { Shield, Clock, CheckCircle2, TrendingUp } from "lucide-react"

export function LoginBrandPanel() {
  const highlights = [
    {
      icon: CheckCircle2,
      text: "Aprovação de crédito rápida",
    },
    {
      icon: Shield,
      text: "Taxas transparentes e competitivas",
    },
    {
      icon: TrendingUp,
      text: "Atendimento personalizado e confiável",
    },
  ]

  return (
    <div className="relative h-full bg-[#0a1628] flex flex-col justify-between p-12 xl:p-16 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2240] to-[#0a1628]" />

      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#1B6EA8]/80 via-[#1B6EA8]/40 to-transparent" />

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#1B6EA8]/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />

      {/* Logo / Brand */}
      <div className="relative z-10">
        <Image
          src="https://res.cloudinary.com/dx1659yxu/image/upload/v1759322731/Artboard_1_copy_mskwp8.svg"
          alt="Grota Financiamentos"
          width={190}
          height={38}
          priority
          style={{ height: "auto" }}
          className="invert brightness-0"
        />
      </div>


      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
        <div className="space-y-6">
          <div>
            <p className="text-white text-sm font-medium tracking-wide uppercase mb-3">Área do Lojista</p>
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
              Financiamento com <span className="text-white">Segurança</span> e{" "}
              <span className="text-white">Confiança</span>
            </h2>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Há mais de 30 anos conectando clientes, lojistas e instituições financeiras.
          </p>

          {/* Highlights */}
          <div className="space-y-4 pt-4">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B6EA8]/10">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-200 text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-8 border-t border-white/10">
        <div className="flex items-center gap-6 text-sm text-white">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Suporte Especializado</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Dados Protegidos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
