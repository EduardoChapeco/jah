import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfuebqmltksyznovhlwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs'
);

async function run() {
  const { data, error } = await supabase
    .from('exchanges')
    .select('id, status, reason, created_at, total_value_cents, original_order_id, orders:original_order_id(public_token, total_cents)')
    .limit(5);

  if (error) {
    console.error('Customer exchanges query error:', error);
  } else {
    console.log('Customer exchanges query success! Data:', data);
  }
}

run();
