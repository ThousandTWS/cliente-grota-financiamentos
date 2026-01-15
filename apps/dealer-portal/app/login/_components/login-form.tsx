"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, Button, Form, Input, Radio } from "antd"
import ReCAPTCHA from "react-google-recaptcha"
import { Building2, Lock, Mail, UserCog, Briefcase } from "lucide-react"

type LoginFormValues = {
  identifier: string
  password: string
  role: "operador" | "gestor"
}

export function LoginForm() {
  const router = useRouter()
  const [form] = Form.useForm<LoginFormValues>()
  const identifier = Form.useWatch("identifier", form) ?? ""
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null)
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "6Lfuw0osAAAAAKTGxs43SODM04TWR2aKSUC84BlY"
  const isRecaptchaEnabled = recaptchaSiteKey.length > 0

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null)
    setRecaptchaError(null)

    const normalizedIdentifier = values.identifier.trim()
    const normalizedPassword = values.password.trim()

    if (!normalizedIdentifier || !normalizedPassword) {
      setError("Informe email/empresa e senha.")
      return
    }

    if (isRecaptchaEnabled && !recaptchaToken) {
      setRecaptchaError("Confirme que você não é um robô.")
      return
    }

    const payload = normalizedIdentifier.includes("@")
      ? { email: normalizedIdentifier, password: normalizedPassword }
      : { enterprise: normalizedIdentifier, password: normalizedPassword }

    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          recaptchaToken: isRecaptchaEnabled ? recaptchaToken : undefined,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError((data as { error?: string })?.error ?? "Falha ao autenticar.")
        return
      }

      // Redirecionar baseado na função selecionada
      const redirectPath = values.role === "gestor" ? "/gestao" : "/operacao"
      router.push(redirectPath)
    } catch (err) {
      setError("Falha ao autenticar. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const isEmail = identifier.includes("@")

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      colon={false}
      onFinish={handleSubmit}
      className="space-y-4"
      initialValues={{ identifier: "", password: "", role: "operador" }}
    >
      <Form.Item
        label="E-mail ou Empresa"
        name="identifier"
        rules={[{ required: true, message: "Informe seu e-mail ou empresa." }]}
      >
        <Input
          placeholder="seu@email.com ou Nome da Empresa"
          autoComplete="username"
          prefix={
            isEmail ? (
              <Mail className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )
          }
          size="large"
          allowClear
        />
      </Form.Item>

      <Form.Item
        label={
          <div className="flex items-center justify-between">
            <span>Senha</span>
          </div>
        }
        name="password"
        rules={[{ required: true, message: "Informe sua senha." }]}
      >
        <Input.Password
          placeholder="Digite sua senha"
          autoComplete="current-password"
          prefix={<Lock className="h-4 w-4 text-muted-foreground" />}
          size="large"
        />
      </Form.Item>

      {/* Seleção de Função */}
      <Form.Item
        label="Acessar como"
        name="role"
        rules={[{ required: true, message: "Selecione uma função." }]}
      >
        <Radio.Group className="w-full">
          <div className="grid grid-cols-2 gap-3">
            <Radio.Button
              value="operador"
              className="!h-auto !p-4 !flex !items-center !justify-center !rounded-xl !border-2 hover:!border-blue-400 [&.ant-radio-button-wrapper-checked]:!border-blue-500 [&.ant-radio-button-wrapper-checked]:!bg-blue-50"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-slate-700">Operador</span>
                <span className="text-xs text-slate-500">Múltiplas lojas</span>
              </div>
            </Radio.Button>
            <Radio.Button
              value="gestor"
              className="!h-auto !p-4 !flex !items-center !justify-center !rounded-xl !border-2 hover:!border-emerald-400 [&.ant-radio-button-wrapper-checked]:!border-emerald-500 [&.ant-radio-button-wrapper-checked]:!bg-emerald-50"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <UserCog className="h-6 w-6 text-emerald-600" />
                <span className="font-semibold text-slate-700">Gestor</span>
                <span className="text-xs text-slate-500">Sua loja</span>
              </div>
            </Radio.Button>
          </div>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="Verificação"
        required={isRecaptchaEnabled}
        validateStatus={recaptchaError ? "error" : ""}
        help={recaptchaError}
      >
        <div className="flex justify-left">
          {isRecaptchaEnabled ? (
            <ReCAPTCHA
              sitekey={recaptchaSiteKey}

              onChange={(token) => {
                setRecaptchaToken(token)
                if (token) {
                  setRecaptchaError(null)
                }
              }}
              onExpired={() => setRecaptchaToken(null)}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              title="Configure o NEXT_PUBLIC_RECAPTCHA_SITE_KEY para habilitar o reCAPTCHA."
            />
          )}
        </div>
      </Form.Item>

      {error && <Alert type="error" showIcon title={error} />}

      <Button
        type="primary"
        size="large"
        block
        loading={isLoading}
        htmlType="submit"
      >
        Entrar
      </Button>
    </Form>
  )
}
