param (
    [string]$EnvFilePath = ".\.env.local"
)

if (-Not (Test-Path $EnvFilePath)) {
    Write-Error "O arquivo .env.local nao foi encontrado: $EnvFilePath"
    exit 1
}

Write-Host "=========================================="
Write-Host " Deploy de Secrets para Cloudflare Pages"
Write-Host "=========================================="
Write-Host "Certifique-se de estar logado: npx wrangler login"
Write-Host ""

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

        Write-Host "-> Enviando secret: $key ..." -NoNewline
        
        try {
            $value | npx wrangler pages secret put $key --project-name lojapiloto 2>$null
            Write-Host " OK" -ForegroundColor Green
        } catch {
            Write-Host " ERRO" -ForegroundColor Red
        }
    }
}

Write-Host "=========================================="
Write-Host "Deploy de secrets concluído."
