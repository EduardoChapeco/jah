const fs = require('fs');
const { execSync } = require('child_process');

let env = { ...process.env };
if (fs.existsSync('.env.secrets')) {
  const lines = fs.readFileSync('.env.secrets', 'utf8').split('\n');
  for (const l of lines) {
    const m = l.trim().match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

try {
  const projectRef = env.PROJECT_REF || 'jfuebqmltksyznovhlwa';
  console.log(`Querying Supabase functions for project: ${projectRef}...`);
  const out = execSync(`npx supabase functions list --project-ref ${projectRef}`, {
    env,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Remote Edge Functions on Supabase:\n' + out);
} catch (e) {
  console.log('Functions list note:', e.stdout || e.stderr || e.message);
}
