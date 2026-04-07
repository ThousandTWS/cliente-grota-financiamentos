"use client";

import dynamic from 'next/dynamic';

export const VerifyTokenPageWrapper = dynamic(
  () => import('@/presentation/features/auth/components/verify-token-page').then((mod) => mod.VerifyTokenPage),
  { ssr: false }
);
