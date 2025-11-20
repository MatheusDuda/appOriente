#!/usr/bin/env bash
# Script de build para deploy no Render
# Este script é executado automaticamente durante o deploy

set -o errexit  # Para a execução se algum comando falhar

echo "📦 Instalando dependências..."
pip install -r requirements.txt

echo "✅ Build concluído com sucesso!"
