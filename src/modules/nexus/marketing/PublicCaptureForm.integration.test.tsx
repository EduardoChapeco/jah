import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicCaptureForm from './PublicCaptureForm';

const {
  supabaseMock,
  toastSuccessMock,
  toastErrorMock,
  rpcMock,
  fromMock,
} = vi.hoisted(() => ({
  supabaseMock: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

type SubmissionBehavior = {
  existingPessoaId?: string | null;
  entriesErrorMessage?: string | null;
};

function configureSupabaseBehavior(behavior: SubmissionBehavior = {}) {
  const formConfig = {
    id: 'form-1',
    empresa_id: 'empresa-1',
    title: 'Form Público',
    status: 'active',
    config: {
      fields: [
        { id: 'nome', type: 'text', label: 'Nome', required: true, placeholder: 'Seu nome' },
        { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Seu email' },
      ],
      submitButtonText: 'Enviar Agora',
    },
  };

  rpcMock.mockResolvedValue({ error: null });

  fromMock.mockImplementation((table: string) => {
    if (table === 'lead_capture_forms') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: formConfig, error: null }),
          }),
        }),
      };
    }

    if (table === 'pessoas') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: behavior.existingPessoaId ? { id: behavior.existingPessoaId } : null,
              error: null,
            }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'pessoa-new' }, error: null }),
          }),
        }),
      };
    }

    if (table === 'clientes_leads') {
      return {
        upsert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'lead-1' }, error: null }),
          }),
        }),
      };
    }

    if (table === 'lead_capture_entries') {
      return {
        insert: async () => ({
          error: behavior.entriesErrorMessage ? { message: behavior.entriesErrorMessage } : null,
        }),
      };
    }

    if (table === 'lead_conversions') {
      return {
        insert: async () => ({ error: null }),
      };
    }

    throw new Error(`Tabela não tratada no teste: ${table}`);
  });
}

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/capture/form-publico?c=campanha-1']}>
        <Routes>
          <Route path="/capture/:slug" element={<PublicCaptureForm />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PublicCaptureForm integration', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    supabaseMock.rpc = rpcMock;
    supabaseMock.from = fromMock;
  });

  it('happy path: submete formulário válido e mostra mensagem de sucesso', async () => {
    configureSupabaseBehavior();
    renderForm();

    const nomeInput = await screen.findByPlaceholderText('Seu nome');
    const emailInput = await screen.findByPlaceholderText('Seu email');

    fireEvent.change(nomeInput, { target: { value: 'Maria' } });
    fireEvent.change(emailInput, { target: { value: 'maria@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar agora/i }));

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Dados enviados com sucesso!');
    });

  });

  it('autorização/API negada: exibe erro vindo da API no cadastro de entrada', async () => {
    configureSupabaseBehavior({ entriesErrorMessage: 'Sem permissão para inserir lead.' });
    renderForm();

    fireEvent.change(await screen.findByPlaceholderText('Seu nome'), { target: { value: 'João' } });
    fireEvent.change(screen.getByPlaceholderText('Seu email'), { target: { value: 'joao@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar agora/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Sem permissão para inserir lead.');
    });
  });

  it('input inválido: bloqueia submissão sem email e não chama API de captura', async () => {
    configureSupabaseBehavior();
    renderForm();

    fireEvent.change(await screen.findByPlaceholderText('Seu nome'), { target: { value: 'Sem Email' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar agora/i }));

    const emailInput = screen.getByPlaceholderText('Seu email') as HTMLInputElement;
    expect(emailInput.validity.valueMissing).toBe(true);

    await waitFor(() => {
      expect(fromMock.mock.calls.some(([table]) => table === 'lead_capture_entries')).toBe(false);
    });
  });
});
