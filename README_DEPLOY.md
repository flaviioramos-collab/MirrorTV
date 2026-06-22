# 📱 MirrorTV - PWA + APK + Web

Espelhe seu Android para Smart TV com três protocolos: **Chromecast**, **DLNA/UPnP** e **WebRTC P2P**.

## 🎯 Características

- ✅ **PWA (Progressive Web App)** - Instale como app nativo
- ✅ **APK Nativo** - Via Capacitor + Android
- ✅ **Chromecast** - Espelhe para Chromecast
- ✅ **DLNA/UPnP** - Compatível com qualquer Smart TV
- ✅ **WebRTC P2P** - Conexão peer-to-peer
- ✅ **Next.js + Tailwind** - Modern stack
- ✅ **CI/CD Automático** - GitHub Actions + Vercel

## 🚀 Quick Start

### Desenvolvendo

```bash
npm install
npm run dev
# Abra http://localhost:3000
```

### Gerar APK

```bash
# Requer: Java JDK 17, Android SDK
npm run build
npx cap sync
cd android && ./gradlew assembleDebug
```

### Deploy Vercel

```bash
npm install -g vercel
vercel deploy
```

## 📦 Deployment Automático

### GitHub Actions (CI/CD)

- **Build APK** - A cada push, gera APK automaticamente
- **Deploy Vercel** - A cada push para `main`, faz deploy web

Ver: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Setup Inicial

1. **GitHub**: Push do código
```bash
git init
git remote add origin https://github.com/seu-usuario/MirrorTV.git
git push -u origin main
```

2. **Vercel**: Conecte o repo
```bash
npx vercel link
```

3. **Adicione Secret**: `VERCEL_TOKEN` (GitHub)

Pronto! A partir daí, é automático.

## 📱 Build Targets

| Target | Comando | Output |
|--------|---------|--------|
| **Web** | `npm run build` | `.next/standalone` |
| **APK Debug** | `cd android && ./gradlew assembleDebug` | `app-debug.apk` |
| **APK Release** | `cd android && ./gradlew assembleRelease` | `app-release.apk` |
| **Vercel** | GitHub Actions | `*.vercel.app` |

## 🏗️ Arquitetura

```
Frontend (Next.js)
    ↓
Capacitor Bridge
    ↓
┌───────────────────────┐
│ Web ├─────────────────┤ Mobile (APK)
└───────────────────────┘
         ↓
┌──────────────────────────────┐
│ Streaming (WebRTC/Cast/DLNA) │
└──────────────────────────────┘
         ↓
    Smart TV
```

## 📚 Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Mobile**: Capacitor + Android
- **Streaming**: WebRTC, Cast SDK, DLNA
- **Deploy**: Vercel + GitHub Actions
- **Database**: Prisma (opcional)

## 🔧 Scripts

```bash
npm run dev         # Dev server (localhost:3000)
npm run build       # Build Next.js
npm run start       # Start production server
npm run lint        # ESLint
npm run db:push     # Sync database
```

## 📖 Documentação

- [Deployment Guide](./DEPLOYMENT.md)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/seu-recurso`
3. Commit: `git commit -am 'Add new feature'`
4. Push: `git push origin feature/seu-recurso`
5. Abra um Pull Request

## 📄 Licença

MIT

## 👨‍💻 Autor

Criado com ❤️ para streaming de tela

---

**Próximas Etapas:**
1. Configure `VERCEL_TOKEN` em GitHub Secrets
2. Faça seu primeiro push para ativar CI/CD
3. Monitore em GitHub Actions e Vercel

