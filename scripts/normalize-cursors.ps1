# Copies cursor PNGs from an import tree into public/cursors with lowercase paths.
# Usage:
#   1. Place your pack under public/cursors_import
#   2. Run: powershell -ExecutionPolicy Bypass -File scripts/normalize-cursors.ps1

param(
  [string]$ImportRoot = "",
  [string]$OutRoot = "",
  [switch]$ResizeExisting
)

$repoRoot = Split-Path $PSScriptRoot -Parent
$MaxCursorPx = 32

if (-not $ImportRoot) {
  $ImportRoot = Join-Path $repoRoot "public\cursors_import"
}
if (-not $OutRoot) {
  $OutRoot = Join-Path $repoRoot "public\cursors"
}

function Resize-CursorPngInPlace {
  param(
    [Parameter(Mandatory)][string]$Path,
    [int]$MaxPx = $MaxCursorPx
  )
  Add-Type -AssemblyName System.Drawing | Out-Null
  $img = [System.Drawing.Image]::FromFile($Path)
  try {
    $maxDim = [Math]::Max($img.Width, $img.Height)
    $scale = if ($maxDim -gt $MaxPx) { $MaxPx / $maxDim } else { 1.0 }
    $newW = [Math]::Max(1, [int][Math]::Round($img.Width * $scale))
    $newH = [Math]::Max(1, [int][Math]::Round($img.Height * $scale))

    # Windows/Chromium: pad every cursor to a 32×32 ARGB canvas (top-left).
    # Non-square or narrow PNGs (e.g. 13×32 text I-beam) are rejected otherwise.
    $canvas = New-Object System.Drawing.Bitmap $MaxPx, $MaxPx
    $canvas.SetResolution(96, 96)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
      $graphics.DrawImage($img, 0, 0, $newW, $newH)
    } finally {
      $graphics.Dispose()
    }

    $img.Dispose()
    $img = $null
    $canvas.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
  } finally {
    if ($img) { $img.Dispose() }
  }
}

$OutRoot = [System.IO.Path]::GetFullPath($OutRoot)

if ($ResizeExisting) {
  if (-not (Test-Path $OutRoot)) {
    Write-Error "Cursor output folder not found: $OutRoot"
    exit 1
  }
  $existing = Get-ChildItem $OutRoot -Recurse -Filter "*.png"
  foreach ($png in $existing) {
    Resize-CursorPngInPlace -Path $png.FullName
  }
  Write-Host "Resized $($existing.Count) cursor PNGs under $OutRoot (max ${MaxCursorPx}px)"
  exit 0
}

$ImportRoot = (Resolve-Path -LiteralPath $ImportRoot).Path

function ConvertTo-LowerSnake([string]$s) {
  # Case-sensitive (-creplace): avoid "Light" -> "l_ig_ht" from insensitive [A-Z]
  (($s -creplace '([a-z\d])([A-Z])', '$1_$2') -replace '[\s\-]+', '_').ToLower()
}

if (-not (Test-Path $ImportRoot)) {
  Write-Error "Import folder not found: $ImportRoot"
  exit 1
}

$pngs = Get-ChildItem $ImportRoot -Recurse -Filter "*.png"
if ($pngs.Count -eq 0) {
  Write-Error "No PNG files under $ImportRoot"
  exit 1
}

$staging = Join-Path (Split-Path $OutRoot -Parent) "cursors_staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$copied = 0
foreach ($file in $pngs) {
  $rel = $file.FullName.Substring($ImportRoot.Length).TrimStart('\', '/')
  $parts = $rel -split '[\\/]'
  $partsLower = @($parts | ForEach-Object { ConvertTo-LowerSnake $_ })
  $themeIdx = [array]::IndexOf($partsLower, "light")
  if ($themeIdx -lt 0) { $themeIdx = [array]::IndexOf($partsLower, "dark") }
  if ($themeIdx -lt 0 -or $themeIdx + 1 -ge $partsLower.Count) { continue }

  $theme = $partsLower[$themeIdx]
  $category = $partsLower[$themeIdx + 1]
  $destDir = Join-Path (Join-Path $staging $theme) $category
  New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  $destName = (ConvertTo-LowerSnake $file.BaseName) + ".png"
  $destPath = Join-Path $destDir $destName
  Copy-Item $file.FullName $destPath -Force
  Resize-CursorPngInPlace -Path $destPath
  $copied++
}

if ($copied -lt 60) {
  Write-Error "Expected ~68 PNG files, copied $copied. Aborting; output not replaced."
  Remove-Item $staging -Recurse -Force
  exit 1
}

if (Test-Path $OutRoot) { Remove-Item $OutRoot -Recurse -Force }
Move-Item $staging $OutRoot
Write-Host "Installed $copied cursor PNGs (max ${MaxCursorPx}px) to $OutRoot"
