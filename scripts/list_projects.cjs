const { execSync } = require('child_process');

try {
  console.log("Projects for new token:");
  execSync('npx supabase projects list', {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: "sbp_18bd7e0be8a740d6d43c3150aedaa7ee3fe940f0" },
    stdio: 'inherit'
  });
} catch (error) {
  console.error(error.message);
}
