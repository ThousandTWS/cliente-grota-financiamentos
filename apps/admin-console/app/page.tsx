"use client";

import dynamic from 'next/dynamic'

const SignInPage = dynamic(
  () => import('@/presentation/features/auth/components/sign-in-page').then((mod) => mod.SignInPage),
  { ssr: false }
)

export default function Login() {
  return (
    <SignInPage
      heroImageSrc="https://res.cloudinary.com/dx1659yxu/image/upload/v1760451243/linda-mulher-comprando-um-carro_lp9oo0.jpg"
    />
  )
}
