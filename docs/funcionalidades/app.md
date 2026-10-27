# O app no dia a dia

[← Índice](README.md)

## Instalar no celular

O Trip Planner é um PWA: abre em tela cheia, com ícone próprio, como um app.

- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").

Mais detalhes no [guia de hospedagem](../GUIA.md#4-use-no-celular).

## Sem internet

Na versão publicada (ou com `npm run build && npm start`; o `npm run dev` não liga essa parte), o app guarda no
aparelho uma cópia do que você já abriu com internet. Sem conexão, nada chega à Vercel nem ao Turso: tudo vem dessa
cópia, que é de cada aparelho (o celular e o computador têm cada um a sua).

O que funciona sem internet:

- **Abrir o app**, a lista de viagens e **cada viagem que você já abriu com internet**, na versão da última vez que
  ela foi aberta. A viagem em destaque na tela inicial também fica guardada. Uma faixa "Sem internet" avisa no topo.
- **Anexos** (ingressos, passagens): ao abrir uma viagem com internet, o app baixa todos os anexos dela para o aparelho.
- **Mapa**: os trechos que você já viu ficam guardados (até cerca de 3 mil). Para ter uma região inteira, use o
  [mapa offline](mapa.md#mapa-offline).
- **Mapa-múndi dos voos**: sempre funciona, porque os aeroportos e os países vêm dentro do app.
- **Tempo de deslocamento** entre atividades: as rotas a pé já consultadas ficam guardadas; as novas aparecem como
  estimativa (com "~").

O que não funciona:

- **Viagem que nunca foi aberta neste aparelho**: mostra "Não consegui abrir esta viagem".
- **Editar**: sem internet, criar, mudar, excluir ou anexar dá erro e a tela volta para a versão salva. As edições
  não ficam guardadas para depois: espere a conexão voltar.
- O que depende de serviços externos: previsão do tempo, câmbio, busca de lugares, "Perto daqui" e Wikipédia.
- **Sair** da conta apaga a cópia guardada (dados e anexos; os mapas baixados ficam).

### Antes de viajar

Com Wi-Fi, no aparelho que vai usar na viagem:

1. Instale o app ([como](#instalar-no-celular)) e use sempre pelo ícone. No iPhone, o app instalado guarda os dados
   separado do Safari, então o que você abriu no Safari não vale para o ícone (e o Safari pode apagar dados de sites
   que você não abre há alguns dias).
2. Abra cada viagem que vai querer consultar. Se mudar algo no computador depois, abra de novo no celular para
   atualizar a cópia.
3. Baixe o [mapa offline](mapa.md#mapa-offline) das cidades.

Para testar: ponha o celular em modo avião, feche o app de vez e abra de novo pelo ícone. A faixa "Sem internet"
aparece, a viagem abre e os anexos abrem com um toque.

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
