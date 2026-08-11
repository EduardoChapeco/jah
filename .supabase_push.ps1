$env:PGHOST = "aws-0-sa-east-1.pooler.supabase.com"
$env:PGPORT = "6543"
$env:PGUSER = "postgres.jfuebqmltksyznovhlwa"
$env:PGPASSWORD = "EEaR6399!@#2026"
$env:PGDATABASE = "postgres"
$url = "postgresql://" + $env:PGUSER + ":" + [System.Uri]::EscapeDataString($env:PGPASSWORD) + "@" + $env:PGHOST + ":" + $env:PGPORT + "/" + $env:PGDATABASE
Write-Host "Pushing new migration to JAH BANCO DE DADOS..."
npx supabase db push --db-url $url
