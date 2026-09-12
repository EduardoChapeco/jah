import { createFileRoute } from "@tanstack/react-router";
import { getLegalDocumentBySlug } from "@/services/legal.functions";
import { LegalDocumentViewer } from "@/components/legal/legal-document-viewer";

const DEFAULT_PRIVACIDADE = {
  title: "Política de Privacidade e Proteção de Dados (LGPD)",
  slug: "privacidade",
  version: "2.1",
  summary:
    "Este documento descreve como a Wider Community Platform coleta, processa, armazena e protege os dados pessoais dos usuários em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
  content_markdown: `## 1. Princípios e Compromisso de Privacidade
A Wider Community Platform opera sob o princípio de Zero-Trust e minimização de dados. Coletamos apenas os dados estritamente necessários para o funcionamento dos serviços, processamento de pedidos e cumprimento de obrigações legais.

## 2. Dados Coletados
- **Identificação e Contato:** Nome, e-mail, telefone e endereço para entrega de pedidos.
- **Transacionais:** Histórico de pedidos, pagamentos processados via Pix/Cartão através de gateways homologados com certificação PCI-DSS.
- **Navegação e Telemetria:** Endereço IP anonimizado, tipo de dispositivo e métricas de desempenho para segurança contra fraudes.

## 3. Direitos do Titular (LGPD Art. 18)
Você possui o direito de:
- Confirmar a existência de tratamento de dados;
- Acessar seus dados pessoais a qualquer momento;
- Solicitar a correção de dados incompletos ou inexatos;
- Requerer a eliminação dos seus dados pessoais tratados com consentimento;
- Revogar seu consentimento de forma simples e gratuita.

## 4. Segurança da Informação
Utilizamos criptografia em repouso (AES-256) e em trânsito (TLS 1.3), isolamento de dados multitenant a nível de banco de dados (PostgreSQL Row Level Security) e autenticação forte.

## 5. Contato do Encarregado de Dados (DPO)
Para exercer qualquer um dos seus direitos previstos na LGPD, entre em contato através da nossa Central de Privacidade ou envie um e-mail para dpo@wider.app.`,
};

export const Route = createFileRoute("/_store/privacidade")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: (loaderData as any)?.doc?.title
          ? `${(loaderData as any).doc.title} | Wider`
          : "Política de Privacidade e Proteção de Dados (LGPD) | Wider OS",
      },
    ],
  }),
  loader: async () => {
    try {
      const doc = await getLegalDocumentBySlug({ data: { slug: "privacidade" } }).catch(() => null);
      return { doc: doc || DEFAULT_PRIVACIDADE };
    } catch {
      return { doc: DEFAULT_PRIVACIDADE };
    }
  },
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const { doc } = ((Route.useLoaderData() as any) || {}) as { doc: any };
  return <LegalDocumentViewer document={doc || DEFAULT_PRIVACIDADE} />;
}
