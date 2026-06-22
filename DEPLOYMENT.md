# 🚀 MirrorTV - Guia de Deployment

Transforme o projeto em APK, Vercel e GitHub automaticamente.

## 📋 Sumário
- [Setup Inicial](#setup-inicial)
- [Gerar APK Localmente](#gerar-apk-localmente)
- [Deploy no Vercel](#deploy-no-vercel)
- [CI/CD com GitHub](#cicd-com-github)
- [Troubleshooting](#troubleshooting)

---

## Setup Inicial

### Pré-requisitos
- Node.js 18+
- Java JDK 17 (para Android)
- Android SDK (Android Studio)
- Git

### 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/MirrorTV.git
cd MirrorTV
npm install
```

### 2. Inicializar Capacitor (já feito)

```bash
npx cap init
```

### 3. Adicionar Android (já feito)

```bash
npx cap add android
```

---

## Gerar APK Localmente

### Build para Android

```bash
# 1. Build do Next.js
npm run build

# 2. Sincronizar com Capacitor
npx cap sync

# 3. Gerar APK (Debug)
cd android
./gradlew assembleDebug

# APK estará em: android/app/build/outputs/apk/debug/app-debug.apk
```

### Build APK Release (assinado)

```bash
# Gerar keystore (apenas primeira vez)
keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Build release
cd android
./gradlew assembleRelease

# APK estará em: android/app/build/outputs/apk/release/app-release.apk
```

---

## Deploy no Vercel

### 1. Conectar Vercel

```bash
npx vercel link
```

### 2. Setup de Variáveis de Ambiente

No dashboard do Vercel:
- Vá para **Settings → Environment Variables**
- Adicione: `NODE_ENV=production`

### 3. Deploy Automático

O projeto já está configurado com `.github/workflows/deploy-vercel.yml`.

Quando você fizer push para `main`:
1. GitHub Actions executa o workflow
2. Vercel constrói e faz deploy automaticamente
3. Seu site estará disponível em `https://seu-projeto.vercel.app`

---

## CI/CD com GitHub

### 1. Inicializar Repositório

```bash
git init
git add .
git commit -m "Initial commit: MirrorTV with Capacitor setup"
git remote add origin https://github.com/seu-usuario/MirrorTV.git
git push -u origin main
```

### 2. Adicionar Secrets (GitHub)

No repositório: **Settings → Secrets and variables → Actions**

Adicione:
- `VERCEL_TOKEN`: Token do Vercel (gerar em https://vercel.com/account/tokens)

### 3. Workflows Disponíveis

#### `build-apk.yml` - Gera APK a cada push

```bash
# Trigger automático em push para main/develop
# Artifact: app-debug.apk (download do GitHub Actions)
```

#### `deploy-vercel.yml` - Deploy automático

```bash
# Trigger automático em push para main
# Acesso: https://seu-projeto.vercel.app
```

### 4. Criar Release com APK

```bash
# 1. Tag no git (automaticamente gera release)
git tag v1.0.0
git push origin v1.0.0

# O APK será anexado automaticamente à release do GitHub
```

---

## Arquitetura de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Seu Repositório GitHub                   │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐   ┌──▼─────────┐   │
         │ Build APK   │   │Deploy on   │   │
         │ (Android)   │   │ Vercel     │   │
         └──────┬──────┘   └──┬─────────┘   │
                │             │             │
         Artifact: APK    Website Live   Notifications
                │             │             │
         ┌──────▼──────┐   ┌──▼─────────┐   │
         │Release Assets│  │yourapp.     │   │
         │(GitHub)     │  │vercel.app   │   │
         └─────────────┘  └─────────────┘   │
                │                           │
                └───────────────────────────┘
```

---

## Estrutura de Pastas

```
MirrorTV/
├── .github/
│   └── workflows/
│       ├── build-apk.yml         # CI para Android
│       └── deploy-vercel.yml     # CD para Vercel
├── src/                          # Código Next.js
├── public/                       # Assets públicos
├── android/                      # Projeto Android (Capacitor)
├── vercel.json                   # Config do Vercel
├── capacitor.config.ts           # Config do Capacitor
├── next.config.ts                # Config do Next.js
└── package.json                  # Dependências
```

---

## Desenvolvendo Localmente

### Modo Dev

```bash
npm run dev
# Acesso em: http://localhost:3000
```

### Live Reload com Capacitor

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Sync web assets
npx cap copy --watch

# Terminal 3: Android Studio
cd android
open -a "Android Studio" .
```

---

## Troubleshooting

### APK não encontrado após build
```bash
cd android
./gradlew clean assembleDebug
```

### Erro: "index.html not found"
```bash
npm run build
npx cap copy
```

### Capacitor não sincroniza
```bash
npx cap sync --force
```

### Vercel: "Cannot find build output"
- Verificar `vercel.json` está na raiz
- Certificar que `npm run build` funciona localmente
- Check Node version: `node --version` deve ser 18+

---

## Monitoramento

### Ver logs do Vercel
```bash
npx vercel logs
```

### Ver logs do APK Build (GitHub)
1. Ir para **Actions**
2. Clicar no workflow
3. Ver logs detalhados

---

## Próximos Passos

- [ ] Configurar assinatura automática de APK
- [ ] Setup Google Play Store (signed release APK)
- [ ] Integrar analytics (Vercel)
- [ ] Configurar preview environments no Vercel
- [ ] Setup email notifications para releases

---

## Suporte

Para dúvidas:
- Documentação Capacitor: https://capacitorjs.com/docs
- Documentação Vercel: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/en/actions

---

**Criado em:** 2024
**Projeto:** MirrorTV
**Stack:** Next.js + Capacitor + Vercel + GitHub
