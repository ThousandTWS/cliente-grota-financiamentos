import { VerifyTokenPageWrapper } from "./VerifyTokenPageWrapper";

type VerificationTokenParams = {
  tipo?: "verificacao" | "redefinicao-senha";
  email?: string;
};

interface VerificationTokenProps {
  searchParams: Promise<VerificationTokenParams>;
}

export default async function VerificationToken({
  searchParams,
}: VerificationTokenProps) {
  const params = await searchParams;

  return (
    <VerifyTokenPageWrapper
      heroImageSrc="https://res.cloudinary.com/dx1659yxu/image/upload/v1760451243/linda-mulher-comprando-um-carro_lp9oo0.jpg"
      tokenType={params.tipo ?? "verificacao"}
      email={params.email ?? ""}
    />
  );
}
