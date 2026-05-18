# Instala dependências usando certificados do Windows (Node 22+)
# Use se npm install travar ou falhar com UNABLE_TO_VERIFY_LEAF_SIGNATURE

$env:NODE_OPTIONS = "--use-system-ca"
npm config set progress true

Write-Host "Instalando dependências..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
  Write-Host "Concluído. Rode: npm run dev" -ForegroundColor Green
} else {
  Write-Host "Falhou. Veja README (Problemas com npm install)." -ForegroundColor Red
  exit $LASTEXITCODE
}
