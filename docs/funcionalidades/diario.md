# Diário de viagem

[← Índice](README.md)

**Diário** no topo da viagem (ou no ⋯, no celular) abre o álbum da viagem: páginas de caderno onde você monta as fotos
como quiser e, se der vontade, escreve um pouco. O álbum é o foco; o texto é opcional.

## Como o álbum se monta sozinho

- **+ Fotos** (no topo) aceita várias fotos de uma vez. Cada uma vai para **a página do dia em que foi tirada**, pela
  data gravada na foto (EXIF; sem ela, vale a data do arquivo). Se o dia ainda não tem página, ela é criada.
- **Câmera** (só no celular) abre direto a câmera; a foto vai para a página de hoje.
- No computador, dá para **arrastar** fotos para a janela (cada uma vai para o seu dia) ou, no modo Editar, para uma
  página específica.
- Fotos tiradas fora das datas da viagem vão para a página **Fotos soltas**.
- Enquanto as fotos sobem, um aviso "revelando…" mostra quantas faltam.

As fotos novas de um dia entram num bloco **Mosaico**, que se ajusta sozinho à quantidade: uma foto ocupa a largura toda,
duas ficam lado a lado, três ganham uma grande e duas menores, e a partir de quatro vira um mosaico com a primeira em
destaque.

## Editar: páginas e blocos

Toque em **Editar** (vira **Pronto** quando terminar; tudo salva sozinho). Cada página é uma sequência de blocos:

- **Bloco de fotos**, com cinco layouts:
  - **Mosaico**: a primeira foto grande e as outras em volta.
  - **Grade**: quadradinhos iguais, como na galeria do celular.
  - **Destaque**: uma foto por linha, inteira, com a legenda embaixo, como numa revista.
  - **Polaroides**: fotos tortinhas com fita e a legenda (ou o horário) escrita à mão.
  - **Filme**: uma tira de negativo que rola para o lado.
- **Bloco de texto**, em três estilos: **Nota** (letra de mão em papel pautado), **Título** (grande, centralizado) e
  **Citação** (itálico, com uma barra vermelha).
- **Bloco de vídeo** (YouTube, Vimeo, Google Drive, Instagram ou TikTok), **Horizontal** ou **Vertical**. Ver [Vídeos](#vídeos).

No modo Editar:

- **+ Fotos**, **+ Texto** e **+ Vídeo** entre os blocos e no fim da página inserem um bloco ali.
- Em cada bloco: trocar o layout ou o estilo, **+ fotos** (no bloco de fotos), subir ↑, descer ↓ e apagar ×. Apagar um
  bloco de fotos apaga as fotos dele.
- Em cada foto, ‹ e › mudam a ordem dentro do bloco.
- No topo da página: o **título** (vazio usa o tema do dia, a cidade ou "Nº dia"), o **dia** (ou "Sem dia", para uma
  página extra como "Melhores momentos" ou "Comidas") e **Apagar página**.
- **+ Nova página**, no fim, cria uma página para o próximo dia sem página (ou uma página extra, se todos os dias já
  tiverem).

As páginas ficam em ordem de dia; as páginas sem dia vêm no fim. Fora do modo Editar, páginas e blocos vazios não
aparecem.

## Ver as fotos

- Toque numa foto para abrir grande. Passe para os lados com as setas, ← → no teclado ou deslizando o dedo. Esc fecha.
- Ali dá para escrever a **legenda**, ver a **ficha (ⓘ Info)**, **mover a foto para outra página**, **baixar** e **excluir**.
- A aba **Fotos**, no topo, mostra todas as fotos em ordem, agrupadas por dia, como o rolo da câmera.

## O que o app lê de cada foto

Ao enviar, o app lê os metadados (EXIF) que a câmera grava na foto original: **quando** foi tirada, **onde** (GPS) e
**com o quê** (câmera, lente, abertura, velocidade, ISO e distância focal). A foto reduzida que vai para o álbum sai sem
EXIF; o app guarda à parte só esses dados.

- **Foto ligada à atividade**: com GPS, a foto é ligada à atividade do roteiro daquele dia que fica a até 600 m,
  preferindo a que estava no horário. Sem GPS, só quando uma única atividade cabe no horário (ou a do horário não tem
  local). Dá para trocar ou tirar no **ⓘ Info** da foto.
- **Legenda automática**: sem legenda escrita, a foto mostra o nome da atividade (ou a cidade mais perto) e a hora,
  como "Shinjuku Gyoen · 11:15". Escrever uma legenda substitui a automática.
- **Ficha da foto (ⓘ Info)**: onde (coordenadas, altitude e "ver no mapa"), a atividade, quando, câmera, lente,
  exposição e o tamanho original. A escolha de mostrar ou esconder a ficha fica salva.
- **No mapa**: as fotos com GPS aparecem como miniaturas no [mapa](mapa.md#fotos-do-diário). No mapa do dia, uma linha
  tracejada liga as fotos na ordem do horário: o caminho que você fez de verdade. Tocar na miniatura abre a foto.
- **Na atividade**: o painel do pino no mapa mostra as fotos ligadas àquela atividade.
- **Fotos sem local**: a aba Fotos avisa quantas fotos vieram sem GPS e as fotos com local ganham um pontinho. No
  Galaxy, ligue **Câmera › Configurações › Marcas de localização**. Fotos que passaram pelo WhatsApp ou foram editadas
  em alguns apps perdem esses dados.

## Vídeos

Os vídeos ficam **numa plataforma de vídeo**, não no app: lá eles mantêm a resolução original, e o banco do app não
enche. Um minuto de vídeo 4K do celular tem uns 300 a 400 MB, e o servidor do app só aceita 4,5 MB por envio. O
armazenamento de arquivos da Vercel (Blob) no plano grátis tem 1 GB e 10 GB de download por mês, o que dá uns 3 minutos
de 4K.

| Plataforma | Como deixar o vídeo | Observações |
| --- | --- | --- |
| **YouTube** (recomendado) | **Não listado**: só quem tem o link vê | Resolução original (até 4K), espaço ilimitado, mostra a capa. Links de Shorts entram como Vertical. |
| **Vimeo** | Público ou "Não listado" (o link traz um código extra, que o app guarda) | Plano grátis com limite de espaço. |
| **Google Drive** | Compartilhar › "Qualquer pessoa com o link" | Bom para quem já faz backup no Google. O player do Drive toca em qualidade menor e vídeos grandes demoram para processar. |
| **Instagram** | Reel ou post de conta **pública** | O player traz o cabeçalho e a legenda do Instagram. |
| **TikTok** | Vídeo de conta **pública** | Links curtos (`vt.tiktok.com/…`, o que o app copia) funcionam: o servidor descobre o vídeo. |

1. No app da plataforma, toque em **Compartilhar › Copiar link**.
2. No álbum, em **Editar**, toque em **+ Vídeo** e cole o link.

O álbum mostra a capa (YouTube e Drive) ou a cor da plataforma, com ▶ e o nome dela, e só carrega o player ao tocar (no
YouTube, o modo de privacidade reforçada, sem cookies até dar play). O bloco tem legenda opcional, **Horizontal** ou
**Vertical**, **Trocar vídeo** e **abrir no …**. Funciona no link de visitante e vai no backup (só a plataforma e o
código do vídeo). Google Fotos não entra: ele não oferece player para outros sites. Limites: precisa de internet para
tocar; se o vídeo for apagado ou ficar privado na plataforma, some do álbum; e o vídeo não entra no mapa nem é ligado a
uma atividade (as plataformas não informam onde nem quando foi gravado).

## O visual

Cada página tem cara de caderno: margem pontilhada vermelha, **carimbo (hanko)** com a data (em kanji nas viagens em
ienes: `11月6日 · 金`), o título sobre uma **fita washi** na cor da cidade e o fundo pontilhado. A capa mostra as três
primeiras fotos em polaroides, o carimbo 旅 ("viagem") e quantas fotos, páginas e cidades o álbum tem.

## Compartilhar

No **⋯ › Compartilhar roteiro**, marque **Diário de viagem** no link que quiser, ou crie um link **Amigos**, que mostra
só o diário (sem roteiro nem gastos). Quem tem o link vê o álbum como você vê fora do modo Editar, pode abrir e baixar
as fotos, e não muda nada. Desmarcar o diário ou desativar o link bloqueia as fotos na hora. Quem vê o álbum pelo link
também vê a ficha das fotos, com o local onde cada uma foi tirada. Ver
[Links de visitante](compartilhar-e-backup.md#links-de-visitante).

## Como as fotos são guardadas

- O próprio aparelho reduz cada foto antes de enviar: até 2048 px no lado maior, em JPEG (algo entre 300 KB e 1 MB),
  mais uma miniatura de 720 px. A foto já sai girada do jeito certo.
- As fotos ficam no mesmo banco do app (o Turso, na versão publicada). Mil fotos ocupam por volta de 1 GB. Confira o
  espaço do seu plano no Turso se for subir muitas.
- **Não são a cópia original**: guarde as originais no celular ou na nuvem.
- No Android (Samsung Galaxy, por exemplo), a câmera salva em JPEG por padrão e tudo funciona. Se a opção **Fotos de alta
  eficiência** (HEIF) estiver ligada na câmera, o Chrome pode recusar essas fotos: desligue antes da viagem. No iPhone,
  o iOS converte as fotos HEIC para JPEG sozinho.

## Sem internet

As miniaturas são guardadas no aparelho quando você abre o diário com internet, então o álbum continua aparecendo sem
sinal. A foto grande só fica guardada depois de aberta uma vez. Enviar fotos e editar precisam de internet (ver
[sem internet](app.md#sem-internet)).

## Limitações

- As fotos **não vão no backup JSON**. Os títulos das páginas, os blocos de texto e os de vídeo vão (campo `pages`, ver
  [formato do JSON](compartilhar-e-backup.md#formato-do-json)).
- Duplicar a viagem não copia o diário.
- Para mudar a ordem das fotos, use ‹ ›; ainda não dá para arrastar.

## Referências de design

O álbum foi desenhado a partir de apps de diário e álbum de viagem; as notas estão em
resumidas aqui:

- **Polarsteps** (travel book): fotos agrupadas por parada, layouts que se ajustam à quantidade e ao texto.
- **Google Fotos** (álbuns): texto e fotos intercalados num álbum, e a visão por data.
- **Apple Journal** e **Day One**: entradas com fotos em mosaico e texto opcional.
- **Bento grid**: mosaico com uma foto em destaque e as outras em volta.
- **Scrapbook / caderno japonês**: fita washi, carimbo hanko e polaroides.
