# 🔧 Setup GitHub + Vercel + APK

Guia passo a passo para configurar CI/CD completo.

## 1️⃣ GitHub - Primeira Vez

### 1.1 Criar Repositório

No GitHub.com:
1. Clique **+** → **New repository**
2. Nome: `MirrorTV`
3. Descrição: "PWA + APK + Vercel"
4. **Public** ou **Private** (sua escolha)
5. ✅ Initialize without README (já temos)
6. Clique **Create repository**

### 1.2 Fazer Push do Código

```bash
cd /c/Users/Ramos/Downloads/MirrorTV/MirrorTV

# Inicializar git (se não feito)
git init
git add .
git commit -m "Initial commit: MirrorTV with Capacitor + CI/CD setup"

# Conectar ao GitHub
git remote add origin https://github.com/SEU_USUARIO/MirrorTV.git
git branch -M main
git push -u origin main
```

### 1.3 Adicionar Secrets

No repositório GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. Clique **New repository secret**
3. Name: `VERCEL_TOKEN`
4. Value: Gere em https://vercel.com/account/tokens (paste do Vercel)

---

## 2️⃣ Vercel - Setup

### 2.1 Criar Conta Vercel

1. Acesse https://vercel.com
2. Sign up com GitHub
3. Autorize Vercel no GitHub

### 2.2 Gerar Token

1. Vá para https://vercel.com/account/tokens
2. Clique **Create**
3. Name: `GitHub-Actions`
4. Scope: **Full Account**
5. Expiration: **90 days** (renovável)
6. ✅ **Create**
7. **Copy** o token

### 2.3 Adicionar a GitHub Secrets

De volta ao GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `VERCEL_TOKEN`
4. Value: Cole o token do Vercel
5. ✅ **Add secret**

### 2.4 Conectar Projeto

```bash
npx vercel link
# Segue os prompts para conectar ao projeto Vercel
```

Ou manualmente:
1. Dashboard Vercel → **Import Project**
2. Selecione repositório GitHub
3. Clique **Import**
4. Configure environment variables (próximo passo)

### 2.5 Variáveis de Ambiente (se necessário)

No Vercel Dashboard:
1. Seu projeto → **Settings**
2. **Environment Variables**
3. Adicione qualquer `.env` que precise

---

## 3️⃣ GitHub Actions - Workflows Automáticos

Já criamos dois workflows:

### Build APK Workflow (`.github/workflows/build-apk.yml`)

**Acionado em:** Push para `main` ou `develop`
**O que faz:** 
- Instala dependências
- Faz build Next.js
- Compila APK
- Salva como artifact (download em Actions)

**Acessar:**
1. Repositório → **Actions**
2. Clique em **Build APK**
3. Ver logs/downloads

### Deploy Vercel Workflow (`.github/workflows/deploy-vercel.yml`)

**Acionado em:** Push para `main`
**O que faz:**
- Build do Next.js
- Deploy automático no Vercel
- Site disponível em `https://seu-projeto.vercel.app`

---

## 4️⃣ Seu Primeiro Deploy

### 4.1 Teste Localmente

```bash
npm run build
npx cap sync
# Tudo funciona? Ótimo!
```

### 4.2 Fazer Push

```bash
git status
git add .
git commit -m "Setup complete: APK + Vercel + GitHub Actions"
git push
```

### 4.3 Monitorar

**GitHub Actions:**
1. Repositório → **Actions**
2. Veja os workflows rodando
3. Aguarde completar (2-5 min)

**Vercel:**
1. Dashboard Vercel
2. Veja Deploy Progress
3. Acesse `https://seu-projeto.vercel.app`

---

## 5️⃣ Criar Releases com APK

### 5.1 Tag no Git

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 5.2 GitHub criará Release automaticamente

1. Repositório → **Releases**
2. Clique **Edit tag**
3. Preencha descrição
4. Download APK anexado

### 5.3 Alternativa: Upload Manual

```bash
# Gere o APK localmente
./build-apk.bat  # Windows
./build-apk.sh   # Mac/Linux

# Encontre em: android/app/build/outputs/apk/debug/app-debug.apk
# Faça upload em GitHub Releases manualmente
```

---

## 🔍 Troubleshooting

### ❌ "Error: VERCEL_TOKEN not found"
→ Adicione o secret em GitHub Settings

### ❌ APK não aparece nos artifacts
→ Verifique logs em Actions
→ Certificar que Java 17 está instalado no runner

### ❌ Deploy Vercel falha
→ `npm run build` funciona localmente?
→ Verificar Node version em `package.json`

### ❌ Nada funciona?
→ Execute tudo localmente primeiro:
```bash
npm install
npm run build
npx cap sync
cd android && ./gradlew assembleDebug
npx vercel
```

---

## 📊 Monitorar Deployments

### Ver Logs

```bash
# Vercel
npx vercel logs

# GitHub Actions
gh run list --repo SEU_USUARIO/MirrorTV
```

### Revisar Histórico

**GitHub Actions:**
- Repositório → **Actions** → Ver todos os runs

**Vercel:**
- Dashboard → Deployments → Ver histórico

---

## 🎯 Checklist Final

- [ ] Repositório GitHub criado
- [ ] Código feito push para `main`
- [ ] Conta Vercel criada
- [ ] Token Vercel gerado e salvo
- [ ] `VERCEL_TOKEN` adicionado a GitHub Secrets
- [ ] Workflows rodaram sem erro (Actions)
- [ ] Site disponível em Vercel
- [ ] APK disponível em GitHub Actions artifacts
- [ ] Teste no celular Android

---

## 📝 Referências Rápidas

| O que | Onde | Como |
|-------|------|------|
| Ver Workflows | GitHub → Actions | Click em um workflow |
| Download APK | GitHub → Actions | Artifacts do último run |
| Deploy Vercel | https://vercel.com | Dashboard → Deployments |
| Tokens Vercel | https://vercel.com/account/tokens | Create new token |
| GitHub Secrets | GitHub Repo → Settings → Secrets | Add secret |

---

**Pronto! 🎉 Seu projeto está com CI/CD completo!**

Agora toda vez que você der push, o APK é gerado e o site é deployado automaticamente.
