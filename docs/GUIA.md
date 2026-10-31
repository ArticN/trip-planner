# Guia: hospede o seu próprio Trip Planner

Este guia leva você do zero até um link do seu planner aberto no celular, protegido por senha, sem gastar nada.
Não precisa saber programar; precisa só seguir os passos com calma. Leva uns 20 minutos.

**Como funciona:** o código fica no GitHub, o site roda na **Vercel** e os dados ficam num banco **Turso**. Cada pessoa
que segue este guia tem o seu próprio site e o seu próprio banco. Nada do que você cadastrar vai para o repositório
original nem para o de ninguém.

## O que você precisa

- Uma conta no [GitHub](https://github.com) (grátis).
- Uma conta na [Vercel](https://vercel.com) (grátis, dá para entrar com o GitHub).
- Uma conta no [Turso](https://turso.tech) (grátis, sem cartão, dá para entrar com o GitHub).
- Opcional, só para rodar no seu computador: [Node.js 24](https://nodejs.org).

## 1. Copie o repositório

Na página deste repositório no GitHub, clique em **Fork** e depois em **Create fork**. Você ganha uma cópia em
`github.com/<seu-usuario>/trip-planner`.

Prefere que o código fique privado? Em vez do fork, use **[Import repository](https://github.com/new/import)**, cole o
endereço deste repositório e marque **Private**. Funciona igual; só a atualização (passo 9) fica manual.

> O repositório não guarda nenhum dado de viagem, então público ou privado tanto faz para a sua privacidade.
> O que protege as suas viagens é o banco (passo 2) e a senha (passo 3).

## 2. Crie o banco no Turso

1. Entre em [app.turso.tech](https://app.turso.tech).
2. Clique em **Create Database**. Dê um nome (por exemplo `trip-planner`) e escolha a região mais perto de você.
3. Na página do banco, copie a **URL**. Ela começa com `libsql://` e termina com `.turso.io`.
4. Ainda na página do banco, gere um token (**Create Token**, ou "Generate Token"), com permissão de leitura e escrita
   e sem data de expiração. Copie o token: ele só aparece uma vez.

Guarde a URL e o token num lugar seguro (um gerenciador de senhas, por exemplo). Quem tiver os dois consegue ler o seu banco.

<details>
<summary>Prefere a linha de comando?</summary>

```bash
# instale a CLI: https://docs.turso.tech/cli/installation
turso auth login
turso db create trip-planner
turso db show trip-planner --url     # a URL
turso db tokens create trip-planner  # o token
```
</details>

## 3. Publique na Vercel

1. Entre em [vercel.com](https://vercel.com) e clique em **Add New… → Project**.
2. Em **Import Git Repository**, escolha o seu `trip-planner`. (Se ele não aparecer, clique em "Adjust GitHub App Permissions" e libere o repositório.)
3. Não mude nada em Build & Output: o arquivo `vercel.json` já diz como compilar.
4. Abra **Environment Variables** e crie as três variáveis:

   | Nome | Valor |
   | --- | --- |
   | `TURSO_DATABASE_URL` | a URL do passo 2 (`libsql://…`) |
   | `TURSO_AUTH_TOKEN` | o token do passo 2 |
   | `APP_PASSWORD` | a senha que você vai usar para entrar no app |

5. Clique em **Deploy** e espere terminar (um ou dois minutos).

Pronto: a Vercel mostra o link do seu planner, algo como `https://trip-planner-xyz.vercel.app`.
As tabelas do banco são criadas sozinhas no primeiro acesso.

> **Sobre a senha:** o link da Vercel é público. Sem `APP_PASSWORD`, qualquer pessoa que descobrir o endereço vê e edita
> as suas viagens. Use uma senha longa que você não usa em outro lugar. Para trocá-la, mude a variável e faça
> **Redeploy**: todo mundo que estava logado precisa entrar de novo.

Esqueceu de criar alguma variável antes do primeiro deploy? Crie em **Settings → Environment Variables** e depois vá em
**Deployments**, abra o último e clique em **⋯ → Redeploy**. Variável nova só vale depois de um novo deploy.

## 4. Use no celular

Abra o link no celular, entre com a senha e:

- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").

O planner abre em tela cheia, com ícone próprio, e continua abrindo sem internet com as viagens que você já abriu
nele com internet (só para consultar: editar precisa de conexão). Antes de viajar, veja
[o que fazer para usar sem internet](funcionalidades/app.md#antes-de-viajar).

## 5. Comece a sua viagem

Na tela inicial, **+ Nova viagem** pede nome, datas, a moeda do destino e a sua moeda. Depois é ir adicionando cidades,
hospedagens e atividades (dá para buscar um lugar ou clicar no mapa).

Quer ver o app cheio antes de cadastrar a sua? Baixe o arquivo
[`examples/viagem-exemplo.json`](../examples/viagem-exemplo.json) (botão **Download raw file** no GitHub) e, na tela
inicial, use **Importar backup**. É uma viagem fictícia de 8 dias pelo Japão; apague quando não precisar mais.

## 6. Faça backup

No menu **⋯** de cada viagem, **Exportar backup (JSON)** baixa tudo dela num arquivo. Para restaurar, ou para levar a
viagem para outra instalação, use **Importar backup** na tela inicial. Vale exportar de vez em quando, principalmente
antes de viajar.

## 7. Rode no seu computador (opcional)

Útil para testar mudanças ou usar sem publicar nada:

```bash
git clone https://github.com/<seu-usuario>/trip-planner.git
cd trip-planner
npm ci          # instala as dependências (rode de novo depois de puxar atualizações)
npm run dev     # abre em http://localhost:5173
```

Os dados locais ficam em `data/planner.db`, que o git ignora. Sem `APP_PASSWORD` não há login; para testar com senha:
`APP_PASSWORD=teste npm run dev`. Para levar viagens do computador para o site publicado, exporte o backup aqui e importe lá.

## 8. Personalize (com ou sem IA)

O app foi todo feito conversando com o Claude, e dá para continuar assim. Abra a pasta do projeto no
[Claude Code](https://claude.com/claude-code) e peça em português o que você quer mudar ("quero um campo de nota em
cada hospedagem", "troca a cor de destaque padrão para verde").

Teste com `npm run dev`. Quando gostar, faça commit e push: a Vercel publica sozinha a cada push na branch `main`.
Se preferir revisar antes, trabalhe numa branch separada e abra um pull request; a Vercel cria um link de prévia para cada um.

## 9. Receba as novidades deste repositório

Se você fez fork: na página do seu repositório no GitHub, clique em **Sync fork → Update branch**. A Vercel publica a
versão nova sozinha, e o banco migra as tabelas no primeiro acesso, sem perder dados.

Se você mudou o código e o GitHub acusar conflito, resolva no seu computador (`git pull` do repositório original) ou peça
ajuda ao Claude Code.

## Problemas comuns

| O que aparece | O que fazer |
| --- | --- |
| `a API não iniciou: TURSO_DATABASE_URL não configurada…` | Crie as variáveis do passo 3 e faça Redeploy. |
| Erro de autenticação do banco (401) | O token está errado, expirou ou tem espaço sobrando. Gere outro no Turso, troque `TURSO_AUTH_TOKEN` e faça Redeploy. |
| A senha não é aceita | Confira `APP_PASSWORD` na Vercel (maiúsculas contam) e faça Redeploy depois de mudar. |
| "Muitas tentativas erradas" | Depois de 10 senhas erradas o login fica bloqueado por 15 minutos naquele aparelho. Espere e tente de novo. |
| O mapa fica em branco | O mapa vem de serviços públicos (OpenFreeMap/OpenStreetMap). Confira a internet ou rede da empresa/escola bloqueando. |
| `npm ci` reclama da versão do Node | Instale o Node 24 (`.nvmrc` já indica a versão para quem usa nvm). |

## Custos e limites

Para uso pessoal, os planos grátis da Vercel e do Turso sobram. Os limites de cada um mudam com o tempo; confira nas
páginas de preço deles. Os anexos (ingressos, vouchers) ficam dentro do banco, com até 4 MB cada, então são eles que mais
ocupam espaço.
