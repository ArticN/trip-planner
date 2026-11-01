# Guia: monte o seu próprio Trip Planner

Este guia é para quem **nunca programou**. Você não vai abrir código, instalar programa nem usar terminal: é só criar
três contas grátis e clicar onde o guia mandar. Leva uns 20 minutos, e no fim você tem um link só seu, com senha, que
abre no celular como um app.

> Travou em algum passo? Pule para [Deu errado?](#deu-errado). Lá tem as mensagens mais comuns e um texto pronto para
> pedir ajuda ao Claude.

## Antes de começar: o que é cada coisa

O app precisa de três serviços, todos grátis para uso pessoal. Os três aceitam **entrar com a conta do GitHub**, então
na prática você só cria uma senha nova.

| Serviço | Para que serve | Comparação |
| --- | --- | --- |
| [GitHub](https://github.com) | Guarda a sua cópia do app. Você nunca precisa mexer nela. | A planta da casa |
| [Turso](https://turso.tech) | Guarda as suas viagens (o banco de dados). | O armário |
| [Vercel](https://vercel.com) | Põe o app no ar e te dá o link. | O endereço da casa |

Ninguém além de você vê as suas viagens: cada pessoa que segue este guia tem o próprio link e o próprio banco. Nada
do que você cadastra vai para o GitHub.

Durante o guia você vai anotar **três coisas**. Deixe um bloco de notas aberto (ou um gerenciador de senhas):

1. a **URL** do banco (começa com `libsql://`);
2. o **token** do banco (um texto comprido, que funciona como a chave do armário);
3. a **senha** que você vai escolher para entrar no app.

## 1. Copie o app para o seu GitHub

1. Crie uma conta no [GitHub](https://github.com/signup), se ainda não tiver.
2. Abra a página deste repositório: [github.com/ArticN/trip-planner](https://github.com/ArticN/trip-planner).
3. Clique em **Fork** (canto de cima, à direita) e depois em **Create fork**.

Pronto: agora existe uma cópia em `github.com/<seu-usuario>/trip-planner`. Ela é o que permite receber as novidades do
app depois com um clique (passo 7).

## 2. Crie o banco no Turso

1. Entre em [app.turso.tech](https://app.turso.tech) com **Continue with GitHub**.
2. Clique em **Create Database**. Dê um nome, por exemplo `trip-planner`, e escolha a região mais perto de você
   (para o Brasil, a de São Paulo ou a da Virgínia, nos EUA). Confirme.
3. Na página do banco, copie a **URL** (o texto que começa com `libsql://` e termina com `.turso.io`) e cole no seu bloco de notas.
4. Na mesma página, clique em **Create Token** (às vezes aparece como "Generate Token"). Deixe **leitura e escrita**
   (Read & Write) e **sem data para expirar** (Never). Copie o token e cole no bloco de notas.
   **Ele só aparece uma vez.** Se perder, é só gerar outro.

> Quem tiver a URL e o token consegue ler o seu banco. Não mande os dois para ninguém nem poste em lugar nenhum.

## 3. Publique na Vercel

1. Entre em [vercel.com](https://vercel.com/signup) com **Continue with GitHub**. Se perguntar, escolha o plano
   **Hobby** (o grátis) e autorize a Vercel a ver os seus repositórios.
2. Abra [vercel.com/new](https://vercel.com/new). Na lista **Import Git Repository**, ache o `trip-planner` e clique em
   **Import**. (Não aparece? Clique em "Adjust GitHub App Permissions", libere o `trip-planner` e volte.)
3. Não mexa em nada de "Build and Output Settings": o app já vem configurado.
4. Abra **Environment Variables** e crie estas três, uma de cada vez (nome à esquerda, valor à direita, depois **Add**):

   | Nome (copie exatamente) | Valor |
   | --- | --- |
   | `TURSO_DATABASE_URL` | a URL do banco, do passo 2 |
   | `TURSO_AUTH_TOKEN` | o token do banco, do passo 2 |
   | `APP_PASSWORD` | a senha que você quer usar para entrar no app |

5. Clique em **Deploy** e espere um ou dois minutos, até aparecer a tela de parabéns.
6. Clique em **Continue to Dashboard** e depois em **Visit** (ou no endereço que aparece, algo como
   `https://trip-planner-abc.vercel.app`). Esse é o link do seu planner: salve nos favoritos.

Abriu a tela de senha? Deu tudo certo. Se em vez disso apareceu uma tela dizendo **"Falta ligar o banco de dados"** ou
**"O banco recusou o acesso"**, alguma variável ficou faltando ou foi colada errada; a própria tela diz o que fazer.

> **Sobre a senha:** o link é público. A senha é o que impede outras pessoas de verem e mexerem nas suas viagens, então
> use uma que você não usa em outro lugar. Se publicar sem senha, o app mostra um aviso no topo até você criar uma.

<details>
<summary>Atalho: botão "Deploy" (mais rápido, mas sem receber novidades)</summary>

Este botão faz os passos 1 e 3 de uma vez: cria uma cópia do app no seu GitHub e já pede as três variáveis. Você ainda
precisa do banco do passo 2 antes.

[![Deploy com a Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FArticN%2Ftrip-planner&project-name=trip-planner&repository-name=trip-planner&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,APP_PASSWORD&envDescription=URL%20e%20token%20do%20banco%20Turso%20e%20a%20senha%20para%20entrar%20no%20app&envLink=https%3A%2F%2Fgithub.com%2FArticN%2Ftrip-planner%2Fblob%2Fmain%2Fdocs%2FGUIA.md%232-crie-o-banco-no-turso)

A diferença: a cópia feita pelo botão não é um fork, então o botão **Sync fork** do passo 7 não aparece. O app funciona
do mesmo jeito; só não recebe as versões novas com um clique. Na dúvida, siga o caminho normal.
</details>

## 4. Use no celular

Abra o link no celular, entre com a senha e:

- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").

O planner abre em tela cheia, com ícone próprio, e continua abrindo sem internet com as viagens que você já abriu
nele com internet (só para consultar: editar precisa de conexão). Antes de viajar, veja
[o que fazer para usar sem internet](funcionalidades/app.md#antes-de-viajar).

## 5. Comece a sua viagem

Na tela inicial, **+ Criar minha primeira viagem** pede nome, datas, a moeda do destino e a sua moeda. Depois é ir
adicionando cidades, hospedagens e atividades (dá para buscar um lugar pelo nome ou clicar no mapa).

Quer ver o app cheio antes? Com o planner vazio, clique em **ou carregue um roteiro de exemplo**: aparece uma viagem
inventada de 8 dias pelo Japão. Explore à vontade e apague quando não precisar mais (dentro da viagem: Editar viagem → Excluir).

Já tem o roteiro escrito em outro lugar (Notion, Google Docs, planilha, anotações)? Dá para pedir ao Claude que
transforme ele num arquivo que o app importa: veja [Pedir ajuda ao Claude](AJUDA-CLAUDE.md#transformar-o-seu-roteiro-num-arquivo-para-importar).

Tudo o que o app faz, tela por tela, está em [Funcionalidades](funcionalidades/README.md).

## 6. Faça backup

No menu **⋯** de cada viagem, **Exportar backup (JSON)** baixa tudo dela num arquivo. Para restaurar, use
**Importar backup** na tela inicial. Vale exportar de vez em quando, principalmente antes de viajar.

## 7. Receba as novidades (opcional)

Você não precisa atualizar nada: o app continua funcionando como está. Mas, quando sair uma versão nova e você quiser:

1. Abra a sua cópia no GitHub (`github.com/<seu-usuario>/trip-planner`).
2. Clique em **Sync fork** e depois em **Update branch**.

A Vercel percebe a mudança e publica a versão nova sozinha em um ou dois minutos. As suas viagens continuam lá: o banco
se ajusta sozinho no primeiro acesso. A seção "Novidades" da tela inicial mostra o que mudou.

## Deu errado?

Primeiro, abra o link do seu planner: quando o problema é de configuração, o próprio app mostra uma tela explicando o
que falta e onde clicar.

| O que aparece | O que fazer |
| --- | --- |
| "Falta ligar o banco de dados" | Faltam as variáveis do banco. Faça o passo 3.4 em **Settings → Environment Variables** e depois o **Redeploy** (abaixo). |
| "O banco recusou o acesso" | O token foi colado pela metade, com espaço sobrando, ou expirou. Gere outro no Turso, troque o `TURSO_AUTH_TOKEN` e faça Redeploy. |
| "Não consegui falar com o banco" | Confira se a `TURSO_DATABASE_URL` começa com `libsql://` e termina com `.turso.io`, sem espaços. |
| Aviso "Seu planner está sem senha" | Crie a variável `APP_PASSWORD` e faça Redeploy. |
| A senha não é aceita | Confira a `APP_PASSWORD` na Vercel (maiúsculas e minúsculas contam) e faça Redeploy depois de mudar. |
| "Muitas tentativas erradas" | Depois de 10 senhas erradas o login fica bloqueado por 15 minutos naquele aparelho. Espere e tente de novo. |
| O mapa fica em branco | O mapa vem de serviços públicos. Confira a internet, ou se a rede (do trabalho, da escola) não bloqueia esses sites. |
| A página da Vercel diz "404" ou "Deployment failed" | Veja se os passos 3.2 e 3.3 foram feitos sem mudar nada nas configurações. Se continuar, peça ajuda ao Claude (abaixo). |

**Como fazer Redeploy:** na Vercel, abra o projeto, vá em **Deployments**, clique nos **⋯** do primeiro da lista e
escolha **Redeploy**. Variável nova ou alterada só vale depois disso.

**Pedir ajuda ao Claude:** abra o [Claude](https://claude.ai), cole o texto pronto de
[Pedir ajuda ao Claude](AJUDA-CLAUDE.md#ajuda-para-instalar) e mande um print da tela onde você travou. Nunca cole o
token nem a senha na conversa: o Claude não precisa deles para ajudar.

## Custos e limites

Para uso pessoal, os planos grátis da Vercel (Hobby) e do Turso bastam e não pedem cartão. Os limites de cada um mudam
com o tempo; confira nas páginas de preço deles. Fotos do diário e anexos (ingressos, vouchers) ficam dentro do banco,
então são eles que mais ocupam espaço.

## Para quem programa

Rodar no computador, útil para testar mudanças ou usar sem publicar nada (requer [Node.js 24](https://nodejs.org)):

```bash
git clone https://github.com/<seu-usuario>/trip-planner.git
cd trip-planner
npm ci          # instala as dependências (rode de novo depois de puxar atualizações)
npm run dev     # abre em http://localhost:5173
```

Os dados locais ficam em `data/planner.db`, que o git ignora. Sem `APP_PASSWORD` não há login; para testar com senha:
`APP_PASSWORD=teste npm run dev`. Para levar viagens do computador para o site publicado, exporte o backup aqui e importe lá.

O app foi todo feito conversando com o Claude, e dá para continuar assim: abra a pasta no
[Claude Code](https://claude.com/claude-code) e peça em português o que quer mudar. A Vercel publica sozinha a cada
push na branch `main`, e cria um link de prévia para cada pull request. Variáveis, scripts e API estão em
[Detalhes técnicos](TECNICO.md).
