Add-Type -AssemblyName System.Drawing
$src = Join-Path $PSScriptRoot '..\public\logo.png'
$dest = Join-Path $PSScriptRoot '..\public\logo-icon.png'
$img = [System.Drawing.Image]::FromFile($src)
$cropW = [int][Math]::Round($img.Width * 0.22)
$cropH = [Math]::Min($cropW, $img.Height)
$cropY = [int][Math]::Max(0, [Math]::Round(($img.Height - $cropH) / 2))
$bmp = New-Object System.Drawing.Bitmap $cropW, $cropH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle 0, $cropY, $cropW, $cropH
$destRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Created $dest ($cropW x $cropH)"
