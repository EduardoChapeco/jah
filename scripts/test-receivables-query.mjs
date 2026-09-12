import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });
const supabase = createClient(
  'https://jfuebqmltksyznovhlwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs'
);

async function run() {
  const pcols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position");
  console.log('Profiles columns:', pcols.rows.map(r => r.column_name).join(', '));

  // Test PostgREST without email:
  const { data, error } = await supabase
    .from("receivables")
    .select(`
      *,
      debtor:debtor_id (id, full_name, avatar_url, phone, username),
      creditor:creditor_id (id, full_name, avatar_url),
      contract:contract_id (id, title, status, verification_code),
      installments:receivable_installments (*)
    `)
    .limit(5);

  if (error) {
    console.error('Receivables query error:', error);
  } else {
    console.log('Receivables query SUCCESS! Rows returned:', data.length);
  }

  await pool.end();
}

run();
