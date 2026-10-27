# O app no dia a dia

[← Índice](README.md)

## Instalar no celular

O Trip Planner é um PWA: abre em tela cheia, com ícone próprio, como um app.

- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").

Mais detalhes no [guia de hospedagem](../GUIA.md#4-use-no-celular).

## Sem internet

Na versão publicada (ou com `npm run build && npm start`; o `npm run dev` não liga essa parte), o app guarda uma cópia
do que você já viu:

- **Abre sem internet** com a última versão das viagens e do roteiro. Uma faixa "Sem internet" avisa no topo.
- **Edições feitas sem internet não são salvas.** Espere a conexão voltar para mudar algo.
- **Mapa**: os trechos que você já viu ficam guardados (até cerca de 3 mil). Para ter uma região inteira, use o
  [mapa offline](mapa.md#mapa-offline).
- **Anexos**: baixados para o aparelho ao abrir a viagem com internet.
- **Mapa-múndi dos voos**: sempre funciona, porque os aeroportos e os países vêm dentro do app.
- O que depende de serviços externos não atualiza sem internet: tempo, câmbio, rotas a pé novas, busca de lugares,
  "Perto daqui" e Wikipédia.

## Celular e computador

- **Computador**: roteiro à esquerda, mapa à direita. Atalhos: **←** e **→** trocam de dia, **/** ou **Ctrl/⌘ + K** abrem
  a busca, **Esc** fecha janelas e cancela a marcação no mapa.
- **Celular**: o roteiro é um painel que desliza por cima do mapa, como no Google Maps. Arraste a alça para escolher a
  altura (só a barra de dias, meio a meio ou tela cheia); um toque na alça sobe um nível. Tocar num pino encolhe o
  painel e mostra os detalhes do lugar. O botão **+** flutuante cria uma atividade no dia aberto, ou uma ideia na visão
  geral. Hospedagens, Orçamento, Checklist e Compras ficam no menu ⋯.

## Aparência

Ícone de paleta na tela inicial, ou menu **⋯ › Aparência** dentro da viagem. As mudanças aparecem na hora e ficam salvas
**neste aparelho** (cada aparelho tem a sua).

- **Tema**: Automático (segue o claro/escuro do aparelho), Claro ou Escuro.
- **Cor de destaque**: Âmbar, Laca, Matcha, Mar, Jade, Glicínia, Sakura ou qualquer outra. Pinta a rota no mapa, o dia
  de hoje e as contagens, e é ajustada para continuar legível no tema claro.
- **Cor desta viagem** (dentro de uma viagem): vale só nela e no link compartilhado, e fica salva com a viagem.
- **Papel** (fundo): Papel, Grafite ou Noite.
- **Letras**: Editorial, Clássica, Moderna, Amigável ou Do aparelho.
- **Cantos**: Redondos, Suaves ou Retos. **Tamanho do texto**: Menor, Normal ou Maior.
- **Voltar ao padrão** desfaz tudo.

## Novidades

Na tela inicial, **Novidades** mostra o que mudou na última versão do app. **Entendi** esconde o destaque até a próxima
versão; **Ver histórico** lista todas as versões. Logo abaixo, **Ideias para o futuro** reúne o que ainda não existe.

O conteúdo vem de [`web/src/changelog.js`](../../web/src/changelog.js): cada entrega ganha uma versão lá, e esta
documentação é atualizada junto.
