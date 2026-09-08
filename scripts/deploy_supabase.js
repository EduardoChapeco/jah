import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Carregar variáveis de .env.secrets se existirem
const secretsPath = path.join(process.cwd(), '.env.secrets');
if (fs.existsSync(secretsPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(secretsPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const projectRef = process.env.PROJECT_REF || "jfuebqmltksyznovhlwa";
const dbPassword = process.env.SUPABASE_DB_PASSWORD || "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || "";

console.log('=== DEPLOY SUPABASE (PROJECT LINK & DB PUSH) ===');
console.log(`Target Project: ${projectRef}`);

const customEnv = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: accessToken,
  SUPABASE_DB_PASSWORD: dbPassword,
};

try {
  console.log('\n1. Linking project to remote Supabase...');
  execSync(`npx supabase link --project-ref ${projectRef} --password "${dbPassword}"`, {
    stdio: 'inherit',
    env: customEnv,
  });
  console.log('✓ Supabase project linked successfully!');
} catch (err) {
  console.warn('Notice during link (may already be linked):', err.message);
}

try {
  console.log('\n2. Pushing all migrations to Supabase production database...');
  execSync(`npx supabase db push --include-all`, {
    stdio: 'inherit',
    env: customEnv,
  });
  console.log('\n✓ Supabase db push completed successfully!');
} catch (err) {
  console.error('\nError during db push:', err.message);
  process.exit(1);
}
