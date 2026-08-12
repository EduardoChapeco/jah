const { execSync } = require('child_process');

try {
  const env = { 
    ...process.env, 
    SUPABASE_ACCESS_TOKEN: "<REMOVED_TOKEN>" 
  };

  console.log("Linking project mirhhypunfwbxnmpcnjs...");
  execSync('npx supabase link --project-ref mirhhypunfwbxnmpcnjs --password "EEaR6399!@#2026"', { stdio: 'inherit', env });
  
  console.log("Pushing database migrations...");
  execSync('npx supabase db push --include-all', { stdio: 'inherit', env });
  
  console.log("Deploying Edge Functions...");
  execSync('npx supabase functions deploy', { stdio: 'inherit', env });
  
  console.log("Deploy done!");
} catch (error) {
  console.error("Deploy script failed:", error.message);
  process.exit(1);
}
