$targetStrings = @(
    @{ Pattern = '(?i)\bhr-shoes-opus\b'; Replacement = 'jah' },
    @{ Pattern = '(?i)\bhr[- ]shoes\b'; Replacement = 'Jah' },
    @{ Pattern = '(?i)\blojapiloto\b'; Replacement = 'Jah' },
    @{ Pattern = '(?i)\bloja[- ]piloto\b'; Replacement = 'Jah' },
    @{ Pattern = '(?i)\btravelos\b'; Replacement = 'Jah' },
    @{ Pattern = '(?i)\bturisagencias\b'; Replacement = 'Jah' },
    @{ Pattern = '(?i)\bturis[- ]agencia\b'; Replacement = 'Jah' }
)

$files = Get-ChildItem -Path "docs" -Recurse -Filter "*.md" | Select-Object -ExpandProperty FullName
$files += Resolve-Path "README.md" | Select-Object -ExpandProperty Path
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $originalContent = $content

    foreach ($target in $targetStrings) {
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $target.Pattern, $target.Replacement)
    }

    if ($content -cne $originalContent) {
        Write-Host "Updating $file"
        [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
    }
}
Write-Host "Done."
