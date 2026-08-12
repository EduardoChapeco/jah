const { execSync } = require('child_process');

try {
  console.log("Projects for new token:");
  execSync('npx supabase projects list', {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: "<REMOVED_TOKEN>" },
    stdio: 'inherit'
  });
} catch (error) {
  console.error(error.message);
}
