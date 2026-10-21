# Flow na Play Store

O app Android é o próprio site do Flow aberto pelo Chrome em tela cheia, sem barra de endereço (Trusted Web Activity). Por isso:

- Toda mudança no site já vale no app, sem publicar versão nova. Só é preciso gerar outro `.aab` para trocar ícone, nome, domínio ou as cores das barras.
- Os dados, a conta, a sincronização, o modo offline e os lembretes (que chegam como notificação do app) funcionam como no site.
- No app Android, Planos não oferece a assinatura pelo Mercado Pago: a Play Store só permite vender conteúdo digital pelo faturamento do Google e proíbe levar a pessoa para pagar fora. Quem assinou pelo site tem o Pro no app normalmente. Se um dia o Pro for vendido no app, vai ser preciso integrar o Google Play Billing.

| Arquivo | O que é |
|---|---|
| `android/` | projeto Android (Gradle), sem código Java: só configuração da biblioteca `androidbrowserhelper` |
| `android/gradle.properties` | endereço do site (`flowHost`) e versão |
| `.github/workflows/android.yml` | gera o `.aab` assinado no GitHub |
| `app/.well-known/assetlinks.json/route.ts` | prova que o app e o site são do mesmo dono |
| `public/icons/` | ícones PNG do manifest |
| `docs/play-store/` | ícone 512 × 512 e gráfico de destaque 1024 × 500 para a ficha da loja |

O identificador do app é `app.flowestudos` (em `android/app/build.gradle` e `ANDROID_PACKAGE` em `lib/site.ts`). Depois da primeira publicação ele não muda mais; se quiser outro, troque nos dois lugares antes.

## 1. Deixar o site pronto

1. O app precisa estar aberto em produção: `APP_OPEN=true` na Vercel. Sem isso, o app Android só mostra a página inicial.
2. O Supabase precisa estar configurado (conta obrigatória).
3. Se o site for para um domínio próprio, troque `flowHost` em `android/gradle.properties` antes de gerar o app.

## 2. Criar a chave de upload (uma vez)

No computador, com o Java instalado:

```bash
keytool -genkeypair -v -keystore flow-upload.jks -alias flow -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o arquivo e as senhas num lugar seguro e **nunca** suba o `.jks` para o repositório. Com a assinatura de apps do Google Play (padrão), essa é só a chave de envio: se ela se perder, o Google permite trocar.

No GitHub, em Settings > Secrets and variables > Actions, crie:

| Segredo | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | o arquivo em base64: `base64 -w0 flow-upload.jks` (no Mac, `base64 -i flow-upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | senha do keystore |
| `ANDROID_KEY_ALIAS` | `flow` |
| `ANDROID_KEY_PASSWORD` | senha da chave (a mesma, se você não escolheu outra) |

## 3. Gerar o `.aab`

Em Actions > **App Android** > Run workflow, informe a versão (ex.: `1.0.0`). Ao terminar, baixe o artefato `flow-…`: dentro está o `app-release.aab`. O `versionCode` é o número da execução, então cada envio já sobe sozinho.

Para gerar no computador: Android SDK instalado, as variáveis `FLOW_KEYSTORE_PATH`, `FLOW_KEYSTORE_PASSWORD`, `FLOW_KEY_ALIAS` e `FLOW_KEY_PASSWORD`, e `cd android && ./gradlew bundleRelease`. `./gradlew assembleDebug` gera um APK de teste para instalar direto no celular.

## 4. Play Console

1. Crie a conta de desenvolvedor (taxa única de US$ 25). Conta **pessoal** criada depois de nov/2023 precisa de um teste fechado com pelo menos 12 testadores por 14 dias seguidos antes de liberar a produção; comece por ele.
2. Criar app: nome "Flow", idioma português (Brasil), app, gratuito.
3. Em Testar e lançar > Teste fechado (ou Teste interno para você mesmo), crie uma versão e envie o `.aab`. Aceite a assinatura de apps do Google Play.
4. Em Configuração > Integridade do app > Assinatura de apps, copie a **impressão digital SHA-256** do certificado de assinatura do app e a da chave de upload.
5. Na Vercel, crie `ANDROID_CERT_FINGERPRINTS` com as duas, separadas por vírgula, e publique de novo. Confira em `https://<endereço>/.well-known/assetlinks.json`. Sem isso o app abre com a barra de endereço do Chrome no topo.

## 5. Ficha da loja e políticas

- **Ícone:** `docs/play-store/icone-512.png`. **Gráfico de destaque:** `docs/play-store/grafico-de-destaque.png`.
- **Capturas de tela:** pelo menos 2 do celular (Painel, Cronograma, Timer, Revisões), tiradas no app já instalado.
- **Descrição curta (até 80 caracteres):** "Organize a semana, use o timer e lembre das revisões para o ENEM."
- **Categoria:** Educação. Não use "ENEM" no nome do app: o nome é Flow.
- **Política de privacidade:** `https://<endereço>/privacidade`.
- **Exclusão de conta** (Política de dados do usuário > Exclusão de dados): `https://<endereço>/privacidade#como-apagar`. A exclusão pode ser feita pelo site, em Ajustes, sem o app.
- **Público-alvo:** 13 a 17 e 18+. Não marque menores de 13: a conta não aceita.
- **Segurança dos dados:** coleta e-mail (conta), ano de nascimento, dados de estudo criados pela pessoa (no servidor só com o Pro) e, se ela ativar, eventos de uso anônimos. Nada é vendido nem compartilhado para publicidade; tudo vai criptografado (HTTPS); a pessoa pode pedir a exclusão.
- **Anúncios:** não contém. **Classificação de conteúdo:** responda o questionário como app educacional (sem violência, sem interação entre usuários).
- **Compras no app:** não há. Nunca coloque no app link nem texto que leve para o pagamento no site.
