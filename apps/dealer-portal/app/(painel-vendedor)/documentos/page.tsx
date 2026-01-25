import type { Metadata } from "next";
import DocumentosFeature from "@/presentation/features/documentos";

export const metadata: Metadata = {
  title: "Documentos - Grota",
  description:
    "Envie e acompanhe os documentos obrigatórios.",
};

export default function DocumentosVendedorPage() {
  return <DocumentosFeature />;
}
