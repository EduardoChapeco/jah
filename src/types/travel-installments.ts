export type InstallmentStatus = 'pending' | 'paid' | 'late' | 'canceled';
export type InstallmentPaymentMethod = 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'dinheiro';

export interface TravelBookingInstallment {
 id: string;
 store_id: string;
 trip_id?: string | null;
 client_id?: string | null;
 passenger_name: string;
 installment_number: number;
 total_installments: number;
 amount: number;
 due_date: string;
 status: InstallmentStatus;
 paid_at?: string | null;
 payment_method?: InstallmentPaymentMethod | null;
 transaction_reference?: string | null;
 receipt_url?: string | null;
 created_at?: string;
 updated_at?: string;
}
