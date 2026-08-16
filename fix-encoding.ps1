$file = "c:\Users\Lenovo\Desktop\Pragyan\backend\src\services\emailService.ts"
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'EMAIL_\* env vars not configured â€" cannot', 'EMAIL_* env vars not configured - cannot'
$content = $content -replace 'Do NOT throw â€" registration must still succeed when SMTP is unconfigured', 'Do NOT throw - registration must still succeed when SMTP is unconfigured'
$content = $content -replace 'Do NOT throw â€" registration must succeed even if email fails', 'Do NOT throw - registration must succeed even if email fails'
Set-Content $file $content -Encoding UTF8 -NoNewline
Write-Host "Fixed encoding"
