import { createFileRoute } from "@tanstack/react-router";
import { getLegalDocumentBySlug } from "@/services/legal.functions";
import { LegalDocumentViewer } from "@/components/legal/legal-document-viewer";

const DEFAULT_TERMOS = {
  title: "Termos Gerais de Uso e Condições da Plataforma",
  slug: "termos",
  version: "2.1",
  summary:
    "Regras, direitos e responsabilidades para o uso do ecossistema Waesy, abrangendo compradores, lojistas parceiros, prestadores de serviço e comunidade.",
  content_markdown: `## 1. Aceitação dos Termos
Ao criar uma conta ou utilizar qualquer funcionalidade da plataforma Waesy, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso.

## 2. Natureza da Plataforma
A Waesy é um ecossistema tecnológico descentralizado que conecta consumidores a comércios locais, prestadores de serviço, frotas de entrega e produtores regionais.

## 3. Responsabilidades dos Usuários
- Fornecer informações verídicas e atualizadas no momento do cadastro.
- Manter a confidencialidade de suas credenciais de acesso.
- Não utilizar a plataforma para atividades ilícitas, abusivas ou fraudulentas.

## 4. Compras, Entregas e Pagamentos
Os pagamentos são processados de forma segura por intermediadores de pagamento autorizados pelo Banco Central do Brasil. O prazo de entrega e a disponibilidade dos produtos são de responsabilidade do respectivo estabelecimento parceiro.

## 5. Propriedade Intelectual
Todos os softwares, marcas, logotipos e conteúdos nativos da Waesy são de propriedade exclusiva da plataforma ou de seus licenciadores, sendo vedada sua reprodução sem autorização prévia.

## 6. Foro Competente
Estes termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o foro da comarca da sede da empresa para dirimir quaisquer controvérsias.`,
};

export const Route = createFileRoute("/_store/termos")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: (loaderData as any)?.doc?.title
          ? `${(loaderData as any).doc.title} | Waesy`
          : "Termos Gerais de Uso e Condições | Waesy",
      },
    ],
  }),
  loader: async () => {
    try {
      const doc = await getLegalDocumentBySlug({ data: { slug: "termos" } }).catch(() => null);
      return { doc: doc || DEFAULT_TERMOS };
    } catch {
      return { doc: DEFAULT_TERMOS };
    }
  },
  component: TermosPage,
});

function TermosPage() {
  const { doc } = ((Route.useLoaderData() as any) || {}) as { doc: any };
  return <LegalDocumentViewer document={doc || DEFAULT_TERMOS} />;
}
