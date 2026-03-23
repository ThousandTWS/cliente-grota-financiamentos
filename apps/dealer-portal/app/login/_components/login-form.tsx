"use client"

import { useEffect, useState } from "react"
import { Alert, Button, Form, Input } from "antd"
import ReCAPTCHA from "react-google-recaptcha"
import { Building2, Lock, Mail } from "lucide-react"
import { PanelLoadingScreen } from "@/presentation/layout/common/PanelLoadingScreen"

type LoginFormValues = {
  identifier: string
  password: string
}

const resolveRedirectPath = (role?: string | null) => {
  const normalizedRole = (role ?? "").toUpperCase()
  switch (normalizedRole) {
    case "OPERADOR":
      return "/operacao"
    case "GESTOR":
      return "/dashboard"
    case "VENDEDOR":
      return "/minhas-operacoes"
    case "ADMIN":
    case "LOJISTA":
    default:
      return "/simulacao/novo"
  }
}

export function LoginForm() {
  const [form] = Form.useForm<LoginFormValues>()
  const identifier = Form.useWatch("identifier", form) ?? ""
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "6LculpQsAAAAAGNgpQ78yA6pKA8gVKbFdv4OX6N7"
  const isRecaptchaEnabled = recaptchaSiteKey.length > 0

  useEffect(() => {
    if (!redirectPath) return

    const timer = window.setTimeout(() => {
      window.location.assign(redirectPath)
    }, 150)

    return () => window.clearTimeout(timer)
  }, [redirectPath])

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

      const nextRedirectPath = resolveRedirectPath(
        (data as { user?: { role?: string } })?.user?.role,
      )
      setRedirectPath(nextRedirectPath)
    } catch (err) {
      setError("Falha ao autenticar. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (redirectPath) {
    return (
      <PanelLoadingScreen
        title="Entrando no painel"
        description="Seu acesso foi confirmado. Estamos carregando a area inicial."
      />
    )
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
      initialValues={{ identifier: "", password: "" }}
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
