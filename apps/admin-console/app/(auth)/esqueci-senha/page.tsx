import dynamic from 'next/dynamic'

const ResetPasswordPage = dynamic(
  () => import('@/presentation/features/auth/components/reset-password-page').then((mod) => mod.ResetPasswordPage),
  { ssr: false }
)

export default function EsqueciSenha() {
  return (
    <ResetPasswordPage
      heroImageSrc="https://res.cloudinary.com/dx1659yxu/image/upload/v1760451243/linda-mulher-comprando-um-carro_lp9oo0.jpg"
    />
  )
}
