# ⚡ Quick Reference - MirrorTV

## 🚀 Comandos Essenciais

### Desenvolvimento
```bash
npm install          # Instalar dependências
npm run dev          # Dev server (localhost:3000)
npm run build        # Build Next.js
npm run lint         # Verificar lint
```

### APK (Android)
```bash
npm run build                    # Build web assets
npx cap sync                     # Sincronizar com Android
cd android && ./gradlew assembleDebug      # Compilar APK
cd android && ./gradlew clean assembleDebug # Limpar e compilar
./build-apk.bat    # Windows - script tudo em um
./build-apk.sh     # Mac/Linux - script tudo em um
```

### Vercel
```bash
npx vercel login     # Login no Vercel
npx vercel link      # Conectar projeto
npx vercel deploy    # Deploy manual
npx vercel logs      # Ver logs
```

### Git
```bash
git init
git add .
git commit -m "message"
git push
git tag v1.0.0
git push origin v1.0.0
```

---

## 📱 Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `package.json` | Dependências e scripts |
| `next.config.ts` | Config Next.js |
| `capacitor.config.ts` | Config Capacitor/Android |
| `vercel.json` | Config Vercel |
| `.github/workflows/*.yml` | CI/CD GitHub Actions |
| `android/app/build.gradle` | Config build Android |

---

## 🔗 Links Úteis

| O que | Link |
|------|------|
| GitHub | https://github.com/SEU_USUARIO/MirrorTV |
| Vercel | https://vercel.com/dashboard |
| Vercel Tokens | https://vercel.com/account/tokens |
| Android Studio | https://developer.android.com/studio |
| Capacitor Docs | https://capacitorjs.com/docs |
| Next.js Docs | https://nextjs.org/docs |

---

## 🔐 Secrets Necessários

**GitHub → Settings → Secrets:**
- `VERCEL_TOKEN` = Token do Vercel

---

## 📊 Status

### Concluído ✅
- [x] Capacitor instalado
- [x] Android adicionado
- [x] Workflows GitHub Actions criados
- [x] Vercel config criada
- [x] Build scripts criados
- [x] Documentação completa

### Próximo Passo
1. Crie repositório GitHub
2. Faça push do código
3. Configure `VERCEL_TOKEN` em Secrets
4. Monitore os workflows

---

## 💻 Estrutura de Pastas

```
MirrorTV/
├── .github/workflows/
│   ├── build-apk.yml
│   └── deploy-vercel.yml
├── android/                  (gerado por Capacitor)
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── public/
├── scripts/
├── build-apk.bat
├── build-apk.sh
├── vercel.json
├── capacitor.config.ts
└── package.json
```

---

## 🎯 Workflow Típico

1. **Develop localmente**
   ```bash
   npm run dev
   ```

2. **Testar build**
   ```bash
   npm run build
   npx cap sync
   ```

3. **Commit e push**
   ```bash
   git add .
   git commit -m "feat: novo recurso"
   git push
   ```

4. **GitHub Actions executa automaticamente**
   - Build APK
   - Deploy Vercel

5. **Monitore**
   - GitHub → Actions
   - Vercel Dashboard

---

## 🐛 Debug

### APK não compila
```bash
# Limpar cache
cd android && ./gradlew clean

# Tentar novamente
./gradlew assembleDebug
```

### Build Next.js falha
```bash
npm install
npm run build
# Ver erro específico
```

### Vercel deploy falha
```bash
npx vercel --prod
# Ver logs
npx vercel logs
```

---

## 📦 Deploy URLs

- **Web**: `https://seu-projeto.vercel.app`
- **APK Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Releases**: `https://github.com/seu-usuario/MirrorTV/releases`

---

## 🎓 Aprender Mais

| Tópico | Documentação |
|--------|--------------|
| Capacitor | https://capacitorjs.com/docs |
| Next.js | https://nextjs.org/docs |
| Vercel | https://vercel.com/docs |
| GitHub Actions | https://docs.github.com/en/actions |
| Android | https://developer.android.com/docs |

---

**Última atualização:** 2024
**Status:** ✅ Configuração Completa
