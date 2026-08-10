param (
    [string]$EnvFilePath = ".\.env.secrets"
)

Write-Host "=========================================="
Write-Host " Deploy Full Pipeline: Jah Community      "
Write-Host "=========================================="

if (-Not (Test-Path $EnvFilePath)) {
    Write-Error "O arquivo de secrets nao foi encontrado: $EnvFilePath"
    exit 1
}

$secrets = @{}
$lines = Get-Content $EnvFilePath
foreach ($line in $lines) {
    $line = $line.Trim()
    if ($line.StartsWith("#") -or [string]::IsNullOrWhiteSpace($line)) {
        continue
    }
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $secrets[$key] = $value
    }
}

# 1. Banco de Dados
if ($secrets.ContainsKey("SUPABASE_ACCESS_TOKEN") -and $secrets.ContainsKey("SUPABASE_DB_PASSWORD")) {
    $env:SUPABASE_ACCESS_TOKEN = $secrets["SUPABASE_ACCESS_TOKEN"]
    $env:SUPABASE_DB_PASSWORD = $secrets["SUPABASE_DB_PASSWORD"]
    Write-Host "1. Realizando Push de Banco de Dados (Supabase)..." -ForegroundColor Cyan
    npx supabase db push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Aviso no Supabase DB Push. Continuando mesmo assim..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Aviso: SUPABASE_ACCESS_TOKEN ou SUPABASE_DB_PASSWORD não encontrados. Pulando db push." -ForegroundColor Yellow
}

# 2. Build
Write-Host "2. Realizando Build da Aplicação..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Erro fatal na build!"
    exit 1
}

# 3. Cloudflare Secrets Put
Write-Host "3. Injetando Segredos no Cloudflare Pages (Wrangler)..." -ForegroundColor Cyan
$secretKeysToPush = @("SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET")

foreach ($key in $secretKeysToPush) {
    if ($secrets.ContainsKey($key)) {
        Write-Host " -> Empacotando secret: $key"
        try {
            $secrets[$key] | npx wrangler pages secret put $key --project-name jah 2>$null
        } catch {
            Write-Host " Erro ao colocar o secret $key" -ForegroundColor Red
        }
    }
}

# 4. Deploy Final
Write-Host "4. Realizando Deploy para o Cloudflare Pages..." -ForegroundColor Cyan
$outputDir = "dist"
if (Test-Path ".output\public") {
    $outputDir = ".output\public"
}
Write-Host "Diretório alvo: $outputDir"
npx wrangler pages deploy $outputDir --project-name jah

Write-Host "=========================================="
Write-Host "Deploy Finalizado com Sucesso!" -ForegroundColor Green
Write-Host "=========================================="
