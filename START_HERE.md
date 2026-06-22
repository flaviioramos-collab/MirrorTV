# 🎬 COMECE AQUI - MirrorTV APK + Vercel

## ⚡ 3 Etapas para Produção

### 1️⃣ GitHub (5 minutos)

```bash
# No terminal do projeto:
cd /c/Users/Ramos/Downloads/MirrorTV/MirrorTV

git init
git add .
git commit -m "Initial: MirrorTV with APK + Vercel setup"
git remote add origin https://github.com/SEU_USUARIO/MirrorTV.git
git branch -M main
git push -u origin main
```

✅ Seu código está no GitHub!

---

### 2️⃣ Vercel Token (2 minutos)

**No navegador:**

1. Acesse https://vercel.com
2. **Sign in** (connect with GitHub)
3. Autorize Vercel
4. Vá para https://vercel.com/account/tokens
5. **Create Token**
   - Name: `GitHub-Actions`
   - Scope: `Full Account`
   - Expiration: `90 days`
6. **COPIAR** o token (mostra apenas uma vez!)

**No GitHub:**

1. Seu repositório
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
   - Name: `VERCEL_TOKEN`
   - Value: [Cole o token copiado]
4. ✅ **Add secret**

✅ Workflows têm acesso a Vercel!

---

### 3️⃣ Ativar CI/CD (1 minuto)

```bash
# Faça um pequeno commit para testar
git commit --allow-empty -m "test: trigger workflows"
git push
```

**Monitore em:**
- GitHub: `Seu repo → Actions` (ver workflows rodando)
- Vercel: `vercel.com/dashboard` (ver deploy)

✅ Automação rodando!

---

## 🎯 Resultado Final

Depois que workflows completam:

| O Que | Onde |
|------|------|
| **APK** | GitHub → Actions → app-debug.apk |
| **Website** | https://seu-projeto.vercel.app |
| **Releases** | GitHub → Releases |

---

## 📱 Gerar APK Localmente (Teste)

Se quiser testar antes:

**Windows:**
```bash
./build-apk.bat
# APK em: android/app/build/outputs/apk/debug/app-debug.apk
```

**Mac/Linux:**
```bash
./build-apk.sh
```

---

## 📚 Documentação Disponível

Leia em ordem:

1. **STATUS.md** ← Veja o que foi feito
2. **GITHUB_VERCEL_SETUP.md** ← Passo a passo detalhado
3. **QUICK_REFERENCE.md** ← Comandos principais
4. **DEPLOYMENT.md** ← Guia completo

---

## ✅ Checklist Final

- [ ] Repositório GitHub criado
- [ ] Código feito push (`git push`)
- [ ] Vercel token criado
- [ ] `VERCEL_TOKEN` adicionado em GitHub Secrets
- [ ] Workflows executados com sucesso
- [ ] APK disponível em GitHub Actions artifacts
- [ ] Website live em Vercel
- [ ] Testado no celular Android

---

## 🚀 Seu Fluxo de Desenvolvimento

De agora em diante, para cada atualização:

```bash
# 1. Faça suas mudanças
npm run dev
# ...edite código...

# 2. Commit e push
git add .
git commit -m "feat: meu recurso"
git push

# 3. Automático! 🤖
# → APK build (GitHub Actions)
# → Deploy web (Vercel)
```

---

## 🎁 Bônus: Criar Release com APK

```bash
# Tag seu release
git tag v1.0.0
git push origin v1.0.0

# GitHub cria automaticamente uma Release
# com o APK anexado!
```

---

## 💡 Dicas Importantes

**Localmente:**
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
./build-apk.bat      # Gerar APK local
```

**GitHub:**
- Workflows rodam automaticamente em cada push
- Ver logs em: `Actions` → Seu workflow
- Download APK em: `Actions` → Artifacts

**Vercel:**
- Deploy automático em `main`
- Preview automático em pull requests
- Logs em: `vercel logs`

---

## 🆘 Problemas Comuns

**"Workflows não rodando"**
→ Certifique que `VERCEL_TOKEN` foi salvo em Secrets

**"APK não aparece"**
→ Verifique logs em GitHub Actions

**"Deploy Vercel falha"**
→ Execute `npm run build` localmente e veja o erro

**"Tudo travado?"**
→ Leia [GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md)

---

## 📞 Referências Rápidas

| O Que | URL |
|------|-----|
| GitHub Repo | https://github.com/SEU_USUARIO/MirrorTV |
| Vercel Dashboard | https://vercel.com/dashboard |
| APK Downloads | [GitHub Repo]/Actions |
| Website | https://seu-projeto.vercel.app |

---

## 🎉 Pronto!

Seu projeto agora tem:
- ✅ APK automático
- ✅ Web hospedado
- ✅ CI/CD completo

**Próxima ação:** Siga as 3 etapas acima! 👆

---

**Tempo total:** ~10 minutos
**Dificuldade:** ⭐ Fácil
**Status:** ✅ Pronto para Produção

Qualquer dúvida? Veja a documentação! 📖
