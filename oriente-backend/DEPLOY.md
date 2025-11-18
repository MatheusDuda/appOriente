# Guia de Deploy - Oriente Backend no Render

Este documento contém instruções completas para fazer deploy do backend do Oriente no Render.

## Pré-requisitos

### 1. Conta no Render
- Criar conta gratuita em https://render.com
- Fazer login

### 2. Banco de Dados PostgreSQL
Você já possui um banco PostgreSQL no Railway. Você pode:
- **Opção A (Recomendado)**: Continuar usando o banco Railway (já configurado)
- **Opção B**: Criar novo banco PostgreSQL no Render

### 3. Cloudinary
Para armazenamento de arquivos em produção:
1. Criar conta gratuita em https://cloudinary.com
2. Acessar o Dashboard: https://cloudinary.com/console
3. Anotar as credenciais:
   - Cloud Name
   - API Key
   - API Secret

---

## Passo a Passo

### 1. Preparar o Código

#### 1.1. Fazer merge desta branch
```bash
git checkout main
git merge feature/preparar-deploy-render
git push origin main
```

### 2. Configurar Cloudinary

1. Acesse https://cloudinary.com e faça login
2. No Dashboard, copie suas credenciais
3. Guarde-as para configurar no Render

### 3. Criar Web Service no Render

#### 3.1. Conectar Repositório
1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `appOriente` (ou nome do seu repo)

#### 3.2. Configurações Básicas
Preencha os campos:

- **Name**: `oriente-backend` (ou nome de sua preferência)
- **Region**: `Oregon` (ou região mais próxima)
- **Branch**: `main`
- **Root Directory**: `oriente-backend`
- **Runtime**: `Python 3`
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

#### 3.3. Plano
- Selecione o plano **Free** (gratuito)

### 4. Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione as seguintes variáveis:

#### Obrigatórias:

```bash
# Banco de Dados (usar o DATABASE_URL do Railway)
DATABASE_URL=postgresql://postgres:VHmKwedOdAMayAcuDqVDEEeKgMCbUWoK@switchback.proxy.rlwy.net:25069/railway

# JWT (GERAR NOVO SECRET!)
# Execute: openssl rand -hex 32
JWT_SECRET=COLE_AQUI_O_SECRET_GERADO
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# CORS (incluir URL do frontend)
CORS_ORIGINS=https://apporiente.vercel.app,http://localhost:5173,http://localhost:3000

# Aplicação
APP_NAME=Oriente Backend
APP_VERSION=0.0.1
DEBUG=false

# Cloudinary (credenciais do seu dashboard)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret

# Servidor (Render define automaticamente PORT)
SERVER_HOST=0.0.0.0
```

#### Opcionais:
```bash
# Se precisar customizar:
MAX_UPLOAD_SIZE=10485760
PROJECT_QUOTA_MB=100
```

### 5. Deploy

1. Clique em **"Create Web Service"**
2. O Render iniciará o build automaticamente
3. Aguarde o deploy concluir (pode levar 5-10 minutos)
4. A URL do backend estará disponível em: `https://oriente-backend.onrender.com`

### 6. Verificar Deploy

Após o deploy concluir, teste os endpoints:

```bash
# Health check
curl https://oriente-backend.onrender.com/health

# Resposta esperada:
# {"status":"UP","application":"Oriente Backend"}

# Endpoint raiz
curl https://oriente-backend.onrender.com/

# Swagger UI
# Acesse: https://oriente-backend.onrender.com/swagger-ui.html
```

### 7. Atualizar Frontend

No frontend (Vercel), atualizar a variável de ambiente `VITE_API_URL`:

```bash
VITE_API_URL=https://oriente-backend.onrender.com
```

---

## Comandos Úteis

### Gerar JWT_SECRET seguro
```bash
openssl rand -hex 32
```

### Ver logs do Render
1. Acesse o Dashboard do Render
2. Clique no seu serviço
3. Vá na aba **"Logs"**

### Executar migrations manualmente
No shell do Render:
```bash
alembic upgrade head
```

### Reiniciar serviço
1. Dashboard → Seu serviço
2. **"Manual Deploy"** → **"Clear build cache & deploy"**

---

## Estrutura de Arquivos Criados

```
oriente-backend/
├── build.sh              # Script de build (install + migrations)
├── render.yaml           # Configuração declarativa do Render
├── .dockerignore         # Otimização do build
├── DEPLOY.md            # Este arquivo
├── app/
│   ├── core/
│   │   └── config.py    # ✏️ Modificado: suporte a CORS dinâmico e Cloudinary
│   ├── services/
│   │   ├── cloudinary_service.py  # 🆕 Novo: serviço de upload Cloudinary
│   │   └── attachment_service.py  # ✏️ Modificado: integração com Cloudinary
│   └── routers/
│       └── attachments.py         # ✏️ Modificado: redirect para URLs Cloudinary
├── requirements.txt     # ✏️ Modificado: + gunicorn, cloudinary
└── .env.example         # ✏️ Atualizado: novas variáveis
```

---

## Troubleshooting

### Erro: "Build failed"
- Verificar se `build.sh` tem permissão de execução: `chmod +x build.sh`
- Verificar logs de build no Render

### Erro: "Database connection failed"
- Verificar se `DATABASE_URL` está correto
- Testar conexão localmente: `psql $DATABASE_URL`
- Verificar se IP do Render está permitido no firewall do Railway

### Erro: "Module not found"
- Verificar se todas as dependências estão no `requirements.txt`
- Limpar cache de build: **"Clear build cache & deploy"**

### Erro 500 ao fazer upload
- Verificar se variáveis Cloudinary estão configuradas corretamente
- Testar credenciais Cloudinary localmente primeiro

### App fica "sleeping"
- No plano gratuito, o Render coloca apps em "sleep" após 15 min de inatividade
- Primeira requisição após "sleep" pode levar 30-60 segundos
- **Solução**: Upgrade para plano pago ou usar serviço de "keep-alive"

---

## Próximos Passos

### Opcional: Configurar Custom Domain
1. Render Dashboard → Seu serviço → **"Settings"**
2. **"Custom Domain"** → Adicionar domínio
3. Atualizar DNS conforme instruções

### Opcional: Configurar CI/CD
O Render já faz deploy automático quando você faz push para `main`!

### Monitoramento
- Logs: Dashboard → Logs
- Métricas: Dashboard → Metrics (disponível em planos pagos)

---

## Recursos Adicionais

- [Documentação Render - Python](https://render.com/docs/deploy-fastapi)
- [Documentação Cloudinary - Python SDK](https://cloudinary.com/documentation/python_integration)
- [Documentação FastAPI - Deployment](https://fastapi.tiangolo.com/deployment/)

---

## Suporte

Se encontrar problemas:
1. Verificar logs no Dashboard do Render
2. Consultar este documento
3. Verificar issues conhecidos no repositório

---

**Deploy concluído com sucesso? 🎉**

Não esqueça de:
- ✅ Atualizar URL do backend no frontend
- ✅ Testar todos os endpoints
- ✅ Fazer upload de teste de arquivo
- ✅ Verificar CORS com frontend em produção
