# O app no dia a dia

[← Índice](README.md)

## Instalar no celular

O Trip Planner é um PWA: abre em tela cheia, com ícone próprio, como um app.

- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").

Mais detalhes no [guia de hospedagem](../GUIA.md#4-use-no-celular).

## Tela de configuração

Numa instalação nova, se o banco não estiver ligado (faltam `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`) ou recusar o
token, o app mostra no lugar de tudo uma tela que diz o que falta e onde clicar na Vercel e no Turso, com o botão
**Já fiz, verificar de novo**. Quando o app está publicado sem `APP_PASSWORD`, a tela inicial mostra um aviso no topo
até a senha ser criada. Passo a passo no [guia de hospedagem](../GUIA.md#deu-errado).

Limitação: a tela só reconhece problemas do banco. Se a Vercel nem consegue publicar o site (deploy com erro), quem
mostra o motivo é a própria Vercel, na aba Deployments.

## Sem internet

Na versão publicada (ou com `npm run build && npm start`; o `npm run dev` não liga o service worker, que guarda os arquivos
do app, mas a cópia das viagens e a fila de edições funcionam nele também), o app guarda **no aparelho** (IndexedDB) uma cópia de todas as suas
viagens. Sem conexão, tudo vem dessa cópia, que é de cada aparelho (o celular e o computador têm cada um a sua).

O que funciona sem internet:

- **Abrir o app, a lista de viagens e qualquer viagem**: com internet, o app guarda sozinho todas as viagens no
  aparelho (não só as abertas) e atualiza a cópia a cada vez que você abre. Internet lenta não trava a tela: depois de
  alguns segundos o app mostra a cópia e troca pela versão nova quando ela chegar.
- **Editar**: marcar como feito, mudar ou criar atividades, hospedagens, checklist, compras, notas, ideias, anotações
  do dia, ordem do dia, páginas do diário e dados da viagem. A edição aparece na hora e fica numa fila guardada no
  aparelho (sobrevive a fechar o app). Quando a internet volta, a fila é enviada sozinha, na ordem.
- **Anexos** (ingressos, passagens): o app baixa para o aparelho os anexos das viagens em andamento e das próximas.
- **Mapa**: os trechos que você já viu ficam guardados (até cerca de 3 mil). Para ter uma região inteira, use o
  [mapa offline](mapa.md#mapa-offline). As telas do mapa ficam guardadas na instalação do app.
- **Mapa-múndi dos voos**: sempre funciona, porque os aeroportos e os países vêm dentro do app.
- **Tempo de deslocamento** entre atividades: as rotas a pé já consultadas ficam guardadas; as novas aparecem como
  estimativa (com "~").

A faixa embaixo (no celular, em cima) mostra o estado: "Sem internet", "N edições esperando", "Enviando…" ou
"edições não foram salvas". Tocar nela abre **Dados no aparelho** (também no menu ⋯ › Dados offline e backups).

O que precisa de internet: criar, duplicar, importar ou apagar viagem; enviar anexos e fotos; links de visitante e
agenda; previsão do tempo, câmbio, busca de lugares, "Perto daqui" e Wikipédia. Sem conexão, esses botões avisam
"Isso precisa de internet".

### Como as edições ficam seguras

- **Sem repetir**: cada edição leva um código. Se a internet cair depois que o servidor salvou, mas antes da resposta
  chegar, o reenvio não cria nada em dobro.
- **Nada some calado**: se o servidor recusar uma edição (por exemplo, o item foi apagado no computador enquanto o
  celular estava offline), ela vai para **Não foram salvas**, com o motivo, e fica guardada até você escolher
  **Tentar de novo**, **Descartar** ou **Baixar estas edições (JSON)**.
- **Dois aparelhos**: a edição offline manda só os campos que você mudou. Se o mesmo campo foi mudado no outro aparelho,
  vale a edição deste, e o valor que estava lá aparece em **Mudado nos dois aparelhos** e fica no backup "antes de
  sincronizar".
- **Sessão expirada**: a fila espera; depois de entrar com a senha de novo, ela continua.
- O app pede ao navegador para guardar os dados de forma permanente (não apagar quando faltar espaço). O painel diz
  se o navegador aceitou e quanto espaço o app usa.

### Backups no aparelho

O app guarda uma versão de cada viagem quando ela muda (no máximo a cada 6 horas) e sempre antes de enviar edições
feitas offline; ficam as 20 mais recentes de cada viagem. Em **Dados no aparelho › Backups automáticos** dá para
**Baixar** qualquer versão (o mesmo JSON do "Exportar backup", sem os códigos secretos dos links) ou **Restaurar como
cópia**, que cria uma viagem nova com aquela versão (a atual não muda). Em **Viagens guardadas**, **Baixar backup**
salva a cópia atual mesmo sem internet. Fotos e anexos não entram no backup.

### Antes de viajar

Com Wi-Fi, no aparelho que vai usar na viagem:

1. Instale o app ([como](#instalar-no-celular)) e use sempre pelo ícone. No iPhone, o app instalado guarda os dados
   separado do Safari, então o que você abriu no Safari não vale para o ícone.
2. Abra o app uma vez com internet e espere alguns segundos: ele guarda todas as viagens. Confira em
   **Dados no aparelho › Viagens guardadas** (o botão **Atualizar agora** força).
3. Baixe o [mapa offline](mapa.md#mapa-offline) das cidades.

Para testar: ponha o celular em modo avião, feche o app de vez e abra de novo pelo ícone. A faixa "Sem internet"
aparece, a viagem abre, os anexos abrem com um toque e dá para marcar uma atividade como feita. Tire do modo avião:
a faixa some quando a edição chega ao servidor.

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
