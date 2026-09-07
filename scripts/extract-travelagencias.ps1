$ErrorActionPreference = "Stop"

$srcBase = "C:\Users\Excelência Tour SMO\Documents\projetos-referencias\travelagencias\src"
$dstBase = "C:\Users\Excelência Tour SMO\Documents\jah\src"

Write-Output "=== EXTRACTION FROM TRAVELAGENCIAS STARTING ==="

$dirs = @(
    "$dstBase\components\tourism\studio",
    "$dstBase\components\tourism\proposals",
    "$dstBase\components\tourism\crm",
    "$dstBase\components\tourism\operations",
    "$dstBase\components\tourism\vouchers",
    "$dstBase\components\tourism\boarding",
    "$dstBase\components\tourism\group-tours",
    "$dstBase\components\tourism\corporate",
    "$dstBase\services\tourism",
    "$dstBase\lib\tourism"
)

foreach ($dir in $dirs) {
    [System.IO.Directory]::CreateDirectory($dir) | Out-Null
}

# 2. Copiar Studio completo (incluindo sections)
Write-Output "Copying studio components and sections..."
Copy-Item -Recurse -Force "$srcBase\components\studio\*" "$dstBase\components\tourism\studio"

# 3. Copiar Proposals completo (incluindo templates)
Write-Output "Copying proposals components and templates..."
Copy-Item -Recurse -Force "$srcBase\components\proposals\*" "$dstBase\components\tourism\proposals"

# 4. Copiar CRM completo (incluindo lead-details)
Write-Output "Copying CRM components and lead-details..."
Copy-Item -Recurse -Force "$srcBase\components\crm\*" "$dstBase\components\tourism\crm"

# 5. Copiar Trips, Vouchers, Boarding, Group-Tours, Corporate
if (Test-Path "$srcBase\components\trips") {
    Write-Output "Copying trips operations..."
    Copy-Item -Recurse -Force "$srcBase\components\trips\*" "$dstBase\components\tourism\operations"
}
if (Test-Path "$srcBase\components\vouchers") {
    Write-Output "Copying vouchers..."
    Copy-Item -Recurse -Force "$srcBase\components\vouchers\*" "$dstBase\components\tourism\vouchers"
}
if (Test-Path "$srcBase\components\boarding") {
    Write-Output "Copying boarding..."
    Copy-Item -Recurse -Force "$srcBase\components\boarding\*" "$dstBase\components\tourism\boarding"
}
if (Test-Path "$srcBase\components\group-tours") {
    Write-Output "Copying group tours..."
    Copy-Item -Recurse -Force "$srcBase\components\group-tours\*" "$dstBase\components\tourism\group-tours"
}
if (Test-Path "$srcBase\components\corporate") {
    Write-Output "Copying corporate..."
    Copy-Item -Recurse -Force "$srcBase\components\corporate\*" "$dstBase\components\tourism\corporate"
}

# 6. Copiar Services essenciais
Write-Output "Copying domain services..."
Copy-Item -Force "$srcBase\services\proposals.ts" "$dstBase\services\tourism\proposals.service.ts"
Copy-Item -Force "$srcBase\services\crm.ts" "$dstBase\services\tourism\crm.service.ts"
Copy-Item -Force "$srcBase\services\trips.ts" "$dstBase\services\tourism\trips.service.ts"
Copy-Item -Force "$srcBase\services\vouchers.ts" "$dstBase\services\tourism\vouchers.service.ts"
Copy-Item -Force "$srcBase\services\boarding.ts" "$dstBase\services\tourism\boarding.service.ts"
if (Test-Path "$srcBase\services\reaccommodation.ts") {
    Copy-Item -Force "$srcBase\services\reaccommodation.ts" "$dstBase\services\tourism\reaccommodation.service.ts"
}
if (Test-Path "$srcBase\services\rooming.ts") {
    Copy-Item -Force "$srcBase\services\rooming.ts" "$dstBase\services\tourism\rooming.service.ts"
}

# 7. Copiar Lib helpers (pricing, adapters, formatters)
Write-Output "Copying lib helpers..."
if (Test-Path "$srcBase\lib\pricing.ts") {
    Copy-Item -Force "$srcBase\lib\pricing.ts" "$dstBase\lib\tourism\pricing.ts"
}
if (Test-Path "$srcBase\lib\adapters.ts") {
    Copy-Item -Force "$srcBase\lib\adapters.ts" "$dstBase\lib\tourism\adapters.ts"
}
if (Test-Path "$srcBase\lib\formatters.ts") {
    Copy-Item -Force "$srcBase\lib\formatters.ts" "$dstBase\lib\tourism\formatters.ts"
}

Write-Output "=== EXTRACTION FROM TRAVELAGENCIAS FINISHED SUCCESSFULLY ==="
