import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const tables = [
    'profiles', 'stores', 'products', 'collections', 'orders', 'order_items',
    'jobs', 'tourism_items', 'news_articles', 'classified_items', 'hotpages',
    'stories', 'influencers', 'events', 'coupons', 'categories', 'banners',
    'dispatches', 'rma_requests', 'store_members', 'mining_leads', 'mining_batches'
  ];

  for (const t of tables) {
    try {
      const { data, error } = await sb.from(t).select('*').limit(20);
      if (error) {
        console.log(`[-] ${t}: Error -> ${error.message}`);
      } else {
        console.log(`[+] ${t}: ${data.length} rows`);
        if (data.length > 0) {
          console.log(`    Sample:`, data.map(d => ({ id: d.id, name: d.title || d.name || d.handle || d.code })).slice(0, 5));
        }
      }
    } catch (err) {
      console.log(`[-] ${t}: Exception ->`, err.message);
    }
  }
}

main();
