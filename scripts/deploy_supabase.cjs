const { execSync } = require('child_process');

try {
  console.log("Logging out of supabase...");
  try {
    execSync('npx supabase logout', { stdio: 'inherit' });
  } catch(e) {
    console.log("Logout failed, might not be logged in.");
  }
  
  console.log("Logging in with token...");
  execSync('npx supabase login --token sbp_18bd7e0be8a740d6d43c3150aedaa7ee3fe940f0', { stdio: 'inherit' });
  
  console.log("Linking project mirhhypunfwbxnmpcnjs...");
  execSync('npx supabase link --project-ref mirhhypunfwbxnmpcnjs --password "EEaR6399!@#2026"', { stdio: 'inherit' });
  
  console.log("Pushing database migrations...");
  execSync('npx supabase db push', { stdio: 'inherit' });
  
  console.log("Deploying Edge Functions...");
  execSync('npx supabase functions deploy', { stdio: 'inherit' });
  
  console.log("Deploy done!");
} catch (error) {
  console.error("Deploy script failed:", error.message);
  process.exit(1);
}
