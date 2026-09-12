import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  const migrations = [
    'supabase/migrations/20261016000000_marketplace_hub_fiscal_and_feeds.sql',
    'supabase/migrations/20261017000000_inbound_webhooks_affiliate_payouts_and_comments.sql',
    'supabase/migrations/20261018000000_table_synonyms_and_compatibility_views.sql',
  ];

  for (const file of migrations) {
    if (fs.existsSync(file)) {
      console.log(`Checking / applying: ${file}`);
      const sql = fs.readFileSync(file, 'utf8');
      try {
        await pool.query(sql);
        console.log(`✓ Applied ${file}`);
      } catch (err) {
        console.warn(`! Note on ${file}: ${err.message}`);
      }
    }
  }

  await pool.end();
  console.log('All latest migrations processed.');
}

run().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
