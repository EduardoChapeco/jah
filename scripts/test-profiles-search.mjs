import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfuebqmltksyznovhlwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs'
);

async function run() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, username, avatar_url, cpf")
    .limit(5);

  if (error) {
    console.error('Search query error:', error);
  } else {
    console.log('Search query SUCCESS! Sample profiles:', data.length);
  }
}

run();
