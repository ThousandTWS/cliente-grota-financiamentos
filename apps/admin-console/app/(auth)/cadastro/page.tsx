import dynamic from 'next/dynamic'

const SignUpPage = dynamic(
  () => import('@/presentation/features/auth/components/sign-up-page'),
  { ssr: false }
)

export default function SignUp() {
  return (
    <SignUpPage
      heroImageSrc="https://res.cloudinary.com/dx1659yxu/image/upload/v1760451243/linda-mulher-comprando-um-carro_lp9oo0.jpg"
    />
  )
}
